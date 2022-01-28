import { ComponentProps, createEffect, JSX, mergeProps, onCleanup, splitProps } from "solid-js";

function invariant(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export type AppData = any;

export interface Submission {
  action: string;
  method: string;
  formData: FormData;
  encType: string;
  key: string;
}

export type FormEncType = "application/x-www-form-urlencoded" | "multipart/form-data";

export function isCatchResponse(response: any): boolean {
  return response instanceof Response && response.headers.get("X-Remix-Catch") != null;
}

export function isErrorResponse(response: any): boolean {
  return response instanceof Response && response.headers.get("X-Remix-Error") != null;
}

export function isRedirectResponse(response: any): boolean {
  return response instanceof Response && response.headers.get("X-Remix-Redirect") != null;
}

export async function fetchData(
  url: URL,
  routeId: string,
  signal: AbortSignal,
  submission?: Submission
): Promise<Response | Error> {
  url.searchParams.set("_data", routeId);

  let init: RequestInit = submission
    ? getActionInit(submission, signal)
    : { credentials: "same-origin", signal };

  let response = await fetch(url.href, init);

  if (isErrorResponse(response)) {
    let data = await response.json();
    let error = new Error(data.message);
    error.stack = data.stack;
    return error;
  }

  return response;
}

export async function extractData(response: Response): Promise<AppData> {
  // This same algorithm is used on the server to interpret load
  // results when we render the HTML page.
  let contentType = response.headers.get("Content-Type");

  if (contentType && /\bapplication\/json\b/.test(contentType)) {
    return response.json();
  }

  return response.text();
}

function getActionInit(submission: Submission, signal: AbortSignal): RequestInit {
  let { encType, method, formData } = submission;

  let headers = undefined;
  let body = formData;

  if (encType === "application/x-www-form-urlencoded") {
    body = new URLSearchParams();
    for (let [key, value] of formData) {
      invariant(
        typeof value === "string",
        `File inputs are not supported with encType "application/x-www-form-urlencoded", please use "multipart/form-data" instead.`
      );
      body.append(key, value);
    }
    headers = { "Content-Type": encType };
  }

  return {
    method,
    body,
    signal,
    credentials: "same-origin",
    headers
  };
}

/**
 * Resolves a `<form action>` path relative to the current route.
 */
// export function useFormAction(
//   action = "/",
//   method: FormMethod = "get"
// ): string {
//   // let { id } = useRemixRouteContext();
//   // let path = useResolvedPath(action);
//   // let search = path.search;
//   // let isIndexRoute = id.endsWith("/index");
//   // if (action === "." && isIndexRoute && isActionRequestMethod(method)) {
//   //   search = search ? search.replace(/^\?/, "?index&") : "?index";
//   // }
//   // return path.pathname + search;
//   return action;
// }

export interface SubmitOptions {
  /**
   * The HTTP method used to submit the form. Overrides `<form method>`.
   * Defaults to "GET".
   */
  method?: FormMethod;

  /**
   * The action URL path used to submit the form. Overrides `<form action>`.
   * Defaults to the path of the current route.
   *
   * Note: It is assumed the path is already resolved. If you need to resolve a
   * relative path, use `useFormAction`.
   */
  action?: string;

  /**
   * The action URL used to submit the form. Overrides `<form encType>`.
   * Defaults to "application/x-www-form-urlencoded".
   */
  encType?: FormEncType;

  /**
   * Set `true` to replace the current entry in the browser's history stack
   * instead of creating a new one (i.e. stay on "the same page"). Defaults
   * to `false`.
   */
  replace?: boolean;
}

/**
 * Submits a HTML `<form>` to the server without reloading the page.
 */
export interface SubmitFunction {
  (
    /**
     * Specifies the `<form>` to be submitted to the server, a specific
     * `<button>` or `<input type="submit">` to use to submit the form, or some
     * arbitrary data to submit.
     *
     * Note: When using a `<button>` its `name` and `value` will also be
     * included in the form data that is submitted.
     */
    target:
      | HTMLFormElement
      | HTMLButtonElement
      | HTMLInputElement
      | FormData
      | URLSearchParams
      | { [name: string]: string }
      | null,

    /**
     * Options that override the `<form>`'s own attributes. Required when
     * submitting arbitrary data without a backing `<form>`.
     */
    options?: SubmitOptions
  ): void;
}

export type FormMethod = "get" | "post" | "put" | "patch" | "delete";

export interface FormProps extends Omit<ComponentProps<"form">, "method" | "onSubmit"> {
  /**
   * The HTTP verb to use when the form is submit. Supports "get", "post",
   * "put", "delete", "patch".
   *
   * Note: If JavaScript is disabled, you'll need to implement your own "method
   * override" to support more than just GET and POST.
   */
  method?: FormMethod;

  /**
   * Normal `<form action>` but supports React Router's relative paths.
   */
  action?: string;

  /**
   * Normal `<form encType>`.
   *
   * Note: Remix only supports `application/x-www-form-urlencoded` right now
   * but will soon support `multipart/form-data` as well.
   */
  // encType?: FormEncType;

  /**
   * Forces a full document navigation instead of a fetch.
   */
  reloadDocument?: boolean;

  /**
   * Replaces the current entry in the browser history stack when the form
   * navigates. Use this if you don't want the user to be able to click "back"
   * to the page with the form on it.
   */
  replace?: boolean;

  /**
   * A function to call when the form is submitted. If you call
   * `event.preventDefault()` then this form will not do anything.
   */
  onSubmit?: (submission: Submission) => void;

  key?: any;
}

/**
 * A Remix-aware `<form>`. It behaves like a normal form except that the
 * interaction with the server is with `fetch` instead of new document
 * requests, allowing components to add nicer UX to the page as the form is
 * submitted and returns with data.
 */
// export let Form = React.forwardRef<HTMLFormElement, FormProps>((props, ref) => {
//   return <FormImpl {...props} ref={ref} />;
// });

interface FormImplProps extends FormProps {
  fetchKey?: string;
}

export let FormImpl = (_props: FormImplProps) => {
  let [props, rest] = splitProps(
    mergeProps(
      {
        reloadDocument: false,
        replace: false,
        method: "post" as FormMethod,
        action: "/",
        encType: "application/x-www-form-urlencoded"
      },
      _props
    ),
    [
      "reloadDocument",
      "replace",
      "method",
      "action",
      "encType",
      "fetchKey",
      "onSubmit",
      "children",
      "ref"
    ]
  );
  let submit = useSubmitImpl(props.fetchKey, submission => {
    props.onSubmit(submission);
  });
  let formMethod: FormMethod = props.method.toLowerCase() === "get" ? "get" : "post";
  // let formAction = useFormAction(props.action, formMethod);
  // let formRef = React.useRef<HTMLFormElement>();
  // let ref = useComposedRefs(forwardedRef, formRef);

  // When calling `submit` on the form element itself, we don't get data from
  // the button that submitted the event. For example:
  //
  //   <Form>
  //     <button name="something" value="whatever">Submit</button>
  //   </Form>
  //
  // formData.get("something") should be "whatever", but we don't get that
  // unless we call submit on the clicked button itself.
  //
  // To figure out which button triggered the submit, we'll attach a click
  // event listener to the form. The click event is always triggered before
  // the submit event (even when submitting via keyboard when focused on
  // another form field, yeeeeet) so we should have access to that button's
  // data for use in the submit handler.
  let clickedButtonRef = { current: null };
  let form;

  createEffect(() => {
    if (!form) return;

    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      let submitButton = event.target.closest<HTMLButtonElement | HTMLInputElement>(
        "button,input[type=submit]"
      );

      if (submitButton && submitButton.type === "submit") {
        console.log("hereee");
        clickedButtonRef.current = submitButton;
      }
    }

    form.addEventListener("click", handleClick);
    onCleanup(() => {
      form && form.removeEventListener("click", handleClick);
    });
  }, []);
  // console.log(formMethod, formAction);

  return (
    <form
      ref={f => {
        form = f;
        // @ts-ignore
        props.ref?.(f);
      }}
      method={formMethod}
      action={_props.action}
      // encType={encType}
      onSubmit={
        props.reloadDocument
          ? undefined
          : event => {
              // props.onSubmit && props.onSubmit(event);
              if (event.defaultPrevented) return;
              event.preventDefault();
              console.log("submitting");
              submit(clickedButtonRef.current || event.currentTarget, {
                method: props.method,
                replace: props.replace
              });
              clickedButtonRef.current = null;
            }
      }
      {...rest}
    >
      {props.children}
    </form>
  );
};

// function isActionRequestMethod(method: string): boolean {
//   method = method.toLowerCase();
//   return method === "post" || method === "put" || method === "patch" || method === "delete";
// }

/**
 * Resolves a `<form action>` path relative to the current route.
 */
// export function useFormAction(
//   action = ".",
//   method: FormMethod = "get"
// ): string {
//   let { id } = useRemixRouteContext();
//   let path = useResolvedPath(action);
//   let search = path.search;
//   let isIndexRoute = id.endsWith("/index");

//   if (action === "." && isIndexRoute && isActionRequestMethod(method)) {
//     search = search ? search.replace(/^\?/, "?index&") : "?index";
//   }

//   return path.pathname + search;
// }

export interface SubmitOptions {
  /**
   * The HTTP method used to submit the form. Overrides `<form method>`.
   * Defaults to "GET".
   */
  method?: FormMethod;

  /**
   * The action URL path used to submit the form. Overrides `<form action>`.
   * Defaults to the path of the current route.
   *
   * Note: It is assumed the path is already resolved. If you need to resolve a
   * relative path, use `useFormAction`.
   */
  action?: string;

  /**
   * The action URL used to submit the form. Overrides `<form encType>`.
   * Defaults to "application/x-www-form-urlencoded".
   */
  // encType?: FormEncType;

  /**
   * Set `true` to replace the current entry in the browser's history stack
   * instead of creating a new one (i.e. stay on "the same page"). Defaults
   * to `false`.
   */
  replace?: boolean;
}

/**
 * Returns a function that may be used to programmatically submit a form (or
 * some arbitrary data) to the server.
 */
export function useSubmit(): SubmitFunction {
  return useSubmitImpl();
}

export function useSubmitImpl(key?: string, onSubmit?: (sub: Submission) => void): SubmitFunction {
  // let defaultAction = useFormAction();
  // let { transitionManager } = useRemixEntryContext();

  return (target, options = {}) => {
    let method: string;
    let action: string;
    let encType: string;
    let formData: FormData;

    if (isFormElement(target)) {
      let submissionTrigger: HTMLButtonElement | HTMLInputElement = (options as any)
        .submissionTrigger;

      method = options.method || target.method;
      action = options.action || target.action;
      encType = options.encType || target.enctype;
      formData = new FormData(target);

      if (submissionTrigger && submissionTrigger.name) {
        formData.append(submissionTrigger.name, submissionTrigger.value);
      }
    } else if (
      isButtonElement(target) ||
      (isInputElement(target) && (target.type === "submit" || target.type === "image"))
    ) {
      let form = target.form;

      if (form == null) {
        throw new Error(`Cannot submit a <button> without a <form>`);
      }

      // <button>/<input type="submit"> may override attributes of <form>

      method = options.method || target.getAttribute("formmethod") || form.method;
      action = options.action || target.getAttribute("formaction") || form.action;
      encType = options.encType || target.getAttribute("formenctype") || form.enctype;
      formData = new FormData(form);

      // Include name + value from a <button>
      if (target.name) {
        formData.set(target.name, target.value);
      }
    } else {
      if (isHtmlElement(target)) {
        throw new Error(
          `Cannot submit element that is not <form>, <button>, or ` + `<input type="submit|image">`
        );
      }

      method = options.method || "get";
      action = options.action || "/";
      encType = options.encType || "application/x-www-form-urlencoded";

      if (target instanceof FormData) {
        formData = target;
      } else {
        formData = new FormData();

        if (target instanceof URLSearchParams) {
          for (let [name, value] of target) {
            formData.append(name, value);
          }
        } else if (target != null) {
          for (let name of Object.keys(target)) {
            formData.append(name, target[name]);
          }
        }
      }
    }

    let { protocol, host } = window.location;
    console.log({ action });
    let url = new URL(isButtonElement(action) ? "/" : action, `${protocol}//${host}`);

    if (method.toLowerCase() === "get") {
      for (let [name, value] of formData) {
        if (typeof value === "string") {
          url.searchParams.append(name, value);
        } else {
          throw new Error(`Cannot submit binary form data using GET`);
        }
      }
    }

    let submission: Submission = {
      formData,
      action: url.pathname + url.search,
      method: method.toUpperCase(),
      encType,
      key: key ?? Math.random().toString(36).substr(2, 8)
    };

    onSubmit(submission);

    // if (key) {
    //   transitionManager.send({
    //     type: "fetcher",
    //     href: submission.action,
    //     submission,
    //     key,
    //   });
    // } else {
    //   setNextNavigationSubmission(submission);
    //   navigate(url.pathname + url.search, { replace: options.replace });
    // }
  };
}

// let nextNavigationSubmission: Submission | undefined;

// function setNextNavigationSubmission(submission: Submission) {
//   nextNavigationSubmission = submission;
// }

// function consumeNextNavigationSubmission() {
//   let submission = nextNavigationSubmission;
//   nextNavigationSubmission = undefined;
//   return submission;
// }

function isHtmlElement(object: any): object is HTMLElement {
  return object != null && typeof object.tagName === "string";
}

function isButtonElement(object: any): object is HTMLButtonElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}

function isFormElement(object: any): object is HTMLFormElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}

function isInputElement(object: any): object is HTMLInputElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}
