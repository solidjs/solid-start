import { useNavigate } from "@solidjs/router";
import { createSignal, getOwner, runWithOwner, startTransition, useContext } from "solid-js";
import { FormImpl, FormProps } from "./Form";

import type { Owner, ParentComponent } from "solid-js";
import { isRedirectResponse } from "../server/responses";
import { ServerContext } from "../server/ServerContext";
import { ServerFunctionEvent } from "../server/types";
import { refetchRouteData } from "./createRouteData";

interface ActionEvent extends ServerFunctionEvent {}
export interface Submission<T, U> {
  body: T;
  result?: U;
  clear: () => void;
  retry: () => void;
}

export type ActionState = "idle" | "pending";
export type RouteAction<T, U> = {
  submission: Submission<T, U>;
  pending?: T;
  result?: U;
  state: ActionState;
  Form: T extends FormData ? ParentComponent<FormProps> : never;
  url: string;
  submit: (vars: T) => Promise<U>;
};
export type RouteMultiAction<T, U> = {
  submissions: Submission<T, U>[];
  pending: T[];
  state: ActionState;
  Form: T extends FormData ? ParentComponent<FormProps> : never;
  url: string;
  submit: (vars: T) => Promise<U>;
};
export function createRouteAction<T = void, U = void>(
  fn: (arg1: void, event: ActionEvent) => Promise<U>,
  options?: { invalidate?: ((r: Response) => string | any[] | void) | string | any[] }
): RouteAction<T, U>;
export function createRouteAction<T, U = void>(
  fn: (args: T, event: ActionEvent) => Promise<U>,
  options?: { invalidate?: ((r: Response) => string | any[] | void) | string | any[] }
): RouteAction<T, U>;
export function createRouteAction<T, U = void>(
  fn: (args: T, event: ActionEvent) => Promise<U>,
  options: { invalidate?: ((r: Response) => string | any[] | void) | string | any[] } = {}
): RouteAction<T, U> {
  const [submission, setSubmission] = createSignal<Submission<T, U>>();
  const [result, setResult] = createSignal<U | { error: any }>();
  const owner = getOwner();
  const navigate = useNavigate();
  const event = useContext(ServerContext);
  let count = 0;
  let tempOwner: Owner = owner!;
  let handledError = false;

  function submit(variables: T) {
    const p = fn(variables, event);
    const reqId = ++count;
    setSubmission(() => ({
      body: variables,
      get result() {
        return result();
      },
      clear() {
        setSubmission(undefined);
      },
      retry() {
        mutate(variables);
      }
    }));
    return p
      .then(async res => {
        if (reqId === count) {
          if (res instanceof Response) {
            await handleResponse(res, navigate, options);
          } else await handleRefetch(res, options);
          if (!res) setSubmission(undefined);
          setResult(() => res);
        }
        return res;
      })
      .catch(async e => {
        if (reqId === count) {
          if (e instanceof Response) {
            await handleResponse(e, navigate, options);
          } else await handleRefetch(e, options);
          if (!isRedirectResponse(e)) {
            setResult(() => ({ error: e }));
            return runWithOwner(tempOwner || owner, () => {
              if (!handledError) throw e;
            });
          } else setResult(() => e);
        }
      });
  }

  return {
    get result() {
      return result();
    },
    get submission() {
      return submission();
    },
    get pending() {
      return !result() && submission()?.body;
    },
    get state() {
      return this.pending ? "pending" : "idle";
    },
    // get error() {
    //   handledError = true;
    //   const error = data().error;
    //   if (!isServer) return error;
    //   const [params] = useSearchParams();

    //   let param = params.form ? JSON.parse(params.form) : null;
    //   if (!param || param.url !== (fn as any).url) {
    //     return error;
    //   }

    //   return param.error
    //     ? new FormError(param.error.message, {
    //         fieldErrors: param.error.fieldErrors,
    //         stack: param.error.stack,
    //         form: param.error.form,
    //         fields: param.error.fields
    //       })
    //     : error;
    // },
    url: (fn as any).url,
    Form: ((props: FormProps) => {
      const formOwner = getOwner();

      let url = (fn as any).url;
      return (
        <FormImpl
          {...props}
          action={url}
          onSubmission={submission => {
            tempOwner = formOwner!;
            submit(submission.formData as any);
            tempOwner = owner!;
          }}
        >
          {props.children}
        </FormImpl>
      );
    }) as T extends FormData ? ParentComponent<FormProps> : never,
    submit
  };
}

export function createRouteMultiAction<T = void, U = void>(
  fn: (arg1: void, event: ActionEvent) => Promise<U>,
  options?: { invalidate?: ((r: Response) => string | any[] | void) | string | any[] }
): RouteMultiAction<T, U>;
export function createRouteMultiAction<T, U = void>(
  fn: (args: T, event: ActionEvent) => Promise<U>,
  options?: { invalidate?: ((r: Response) => string | any[] | void) | string | any[] }
): RouteMultiAction<T, U>;
export function createRouteMultiAction<T, U = void>(
  fn: (args: T, event: ActionEvent) => Promise<U>,
  options: { invalidate?: ((r: Response) => string | any[] | void) | string | any[] } = {}
): RouteMultiAction<T, U> {
  const [submissions, setSubmissions] = createSignal<Submission<T, U>[]>([]);
  const owner = getOwner();
  const navigate = useNavigate();
  const event = useContext(ServerContext);
  let count = 0;
  let tempOwner: Owner = owner!;
  let handledError = false;

  function submit(variables: T) {
    const p = fn(variables, event);
    const reqId = ++count;
    const [result, setResult] = createSignal<U | { error: any }>();
    let submission;
    setSubmissions(s => [
      ...s,
      (submission = {
        body: variables,
        get result() {
          return result();
        },
        clear() {
          setSubmissions(v => v.filter(i => i.body !== variables));
        },
        retry() {
          setResult(undefined);
          return handleSubmit(fn(variables, event));
        }
      })
    ]);
    return handleSubmit(p);
    function handleSubmit(p) {
      p.then(async res => {
        if (reqId === count) {
          if (res instanceof Response) {
            await handleResponse(res, navigate, options);
          } else await handleRefetch(res, options);
          res ? setResult(() => res) : submission.clear();
        }
        return res;
      }).catch(async e => {
        if (reqId === count) {
          if (e instanceof Response) {
            await handleResponse(e, navigate, options);
          } else await handleRefetch(e, options);
          if (!isRedirectResponse(e)) {
            setResult(() => ({ error: e }));
            return runWithOwner(tempOwner || owner, () => {
              if (!handledError) throw e;
            });
          } else setResult(() => e);
        }
      });
      return p;
    }
  }

  return {
    get submissions() {
      return submissions();
    },
    get pending() {
      return submissions().reduce((m, s) => {
        !s.result && m.push(s.body);
        return m;
      }, []);
    },
    get state() {
      return submissions().some(s => !s.result) ? "pending" : "idle";
    },
    // get error() {
    //   handledError = true;
    //   const error = data().error;
    //   if (!isServer) return error;
    //   const [params] = useSearchParams();

    //   let param = params.form ? JSON.parse(params.form) : null;
    //   if (!param || param.url !== (fn as any).url) {
    //     return error;
    //   }

    //   return param.error
    //     ? new FormError(param.error.message, {
    //         fieldErrors: param.error.fieldErrors,
    //         stack: param.error.stack,
    //         form: param.error.form,
    //         fields: param.error.fields
    //       })
    //     : error;
    // },
    url: (fn as any).url,
    Form: ((props: FormProps) => {
      const formOwner = getOwner();

      let url = (fn as any).url;
      return (
        <FormImpl
          {...props}
          action={url}
          onSubmission={submission => {
            tempOwner = formOwner!;
            submit(submission.formData as any);
            tempOwner = owner!;
          }}
        >
          {props.children}
        </FormImpl>
      );
    }) as T extends FormData ? ParentComponent<FormProps> : never,
    submit
  };
}

function handleRefetch(response, options) {
  return startTransition(() => {
    refetchRouteData(
      typeof options.invalidate === "function" ? options.invalidate(response) : options.invalidate
    );
  });
}

function handleResponse(response: Response, navigate, options) {
  if (response instanceof Response && isRedirectResponse(response)) {
    const locationUrl = response.headers.get("Location") || "/";
    if (locationUrl.startsWith("http")) {
      window.location.href = locationUrl;
    } else {
      navigate(locationUrl);
    }
  }

  if (response.ok || isRedirectResponse(response)) return handleRefetch(response, options);
}
