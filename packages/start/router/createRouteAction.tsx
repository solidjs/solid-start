import { useNavigate, useSearchParams } from "solid-app-router";
import { createSignal, startTransition, getOwner, runWithOwner, Show } from "solid-js";
import { FormProps, FormImpl } from "./Form";

import type { Accessor, JSX } from "solid-js";
import { FormError } from "./FormError";
import { Owner } from "solid-js/types/reactive/signal";
import { isRedirectResponse } from "../server/responses";
import { refetchRouteResources } from "./createRouteResource";

type ActionStatus = "submitting" | "error" | "success";

interface SubmissionState<T> {
  data: any;
  error: Error | null;
  status: ActionStatus;
  variables: T;
  readError: boolean;
}

type SetSubmissionState<T> = (
  state: SubmissionState<T> | ((s: SubmissionState<T>) => SubmissionState<T>)
) => void;

export type ActionSubmission<T> = {
  variables: T;
  state: Accessor<SubmissionState<T>>;
  status: ActionStatus;
  error: FormError | null;
  key: any;
  index: number;
  setState: SetSubmissionState<T>;
};

/**
 *
 * @param actionFn the async function that handles the submission, this would be where you call your API
 */
function createActionState<T extends [...any], U = void>(actionFn: (...args: T) => Promise<U>) {
  const [submissions, setSubmissions] = createSignal<{
    [key: string]: ActionSubmission<T>;
  }>({});

  let index = 0;

  async function actionWithKey(submission: T, _k: string) {
    let i = ++index;
    let key = () => _k || `${i}`;

    let submissionState: Accessor<SubmissionState<T>>, setSubmissionState: SetSubmissionState<T>;

    if (submissions()[key()]) {
      submissionState = submissions()[key()].state;
      setSubmissionState = submissions()[key()].setState;

      setSubmissionState({
        status: "submitting",
        data: null,
        error: null,
        readError: false,
        variables: submission
      });
    } else {
      [submissionState, setSubmissionState] = createSignal<SubmissionState<T>>({
        status: "submitting",
        data: null,
        error: null,
        readError: false,
        variables: submission
      });

      setSubmissions({
        ...submissions(),
        [key()]: {
          get variables() {
            return submissionState().variables;
          },
          get status() {
            return submissionState().status;
          },
          get error() {
            if (!submissionState().readError) {
              setSubmissionState(e => ({ ...e, readError: true }));
            }
            return submissionState().error as FormError;
          },
          get key() {
            return key();
          },
          state: submissionState,
          setState: setSubmissionState,
          index: i
        }
      });
    }

    try {
      let response = await actionFn(...submission);

      // if response was successful, remove the submission since its resolved
      // TODO: figure out if this is the appropriate behaviour, should we keep successful submissions?
      // setSubmissions(obj => {
      //   let newObj = { ...obj };
      //   delete newObj[key()];
      //   return newObj;
      // });
      setSubmissionState(sub => ({
        ...sub,
        status: "success",
        data: response,
        error: null
      }));

      return response;
    } catch (e) {
      // console.error(e);
      setSubmissionState(sub => ({
        ...sub,
        status: "error",
        data: null,
        error: e
      }));

      throw e;
    }
  }

  return [submissions, actionWithKey] as [
    Accessor<{
      [key: string]: ActionSubmission<T>;
    }>,
    (vars?: T, key?: string) => Promise<U>
  ];
}

export type Action<
  D extends [...any],
  R extends any
  // | {
  //     url?: string;
  //     action: (...arg: D) => Promise<Response>;
  //   }
> =
  //   Accessor<{
  //     [key: string]: ActionSubmission<FormAction<FormData>>;
  //   }>,
  //   (...vars: D) => Promise<R>
  // ]
  {
    (...submission: [...D]): Promise<R | void>;
    Form: D extends [FormData] ? (props: FormProps) => JSX.Element : never;
    url: string;
    isSubmitting(): boolean;
    submissions: () => {
      [key: string]: ActionSubmission<D>;
    };
    submission(key?: string): ActionSubmission<D>;
    submit: (submission?: D, key?: string, owner?: Owner) => Promise<R | void>;
  };

export function createRouteAction<
  D extends [...any],
  R extends any
  // | {
  //     url?: string;
  //     action: (...arg: D) => Promise<Response>;
  //   }
>(
  fn: (...arg: D) => Promise<R>,
  options: { invalidate?: ((r: Response) => any[]) | any[] } = {}
): Action<D, R> {
  const [submissions, action] = createActionState(fn);

  const navigate = useNavigate();
  const actionOwner = getOwner();

  function submitWithKey(submission: D = [] as D, key: string = "", owner: Owner = actionOwner) {
    return action(submission, key)
      .then(response => {
        runWithOwner(owner, () => {
          if (response instanceof Response && response.status === 302)
            navigate(response.headers.get("Location") || "/");
          startTransition(() => {
            refetchRouteResources(
              typeof options.invalidate === "function" ? options.invalidate(response) : options.invalidate
            );
          });
        });
        return response;
      })
      .catch((e: Error) => {
        const sub = submissions()[key];
        runWithOwner(owner, () => {
          if (e instanceof Response && isRedirectResponse(e)) {
            navigate(e.headers.get("Location") || "/");
            startTransition(() => {
              refetchRouteResources(
                typeof options.invalidate === "function" ? options.invalidate(e) : options.invalidate
              );
            });
            return;
          }
          if (!sub.state().readError) {
            throw e;
          }
        });
      });
  }

  function submit(...submission: D) {
    return submitWithKey(submission);
  }

  function Form(props: FormProps) {
    const owner = getOwner();

    let url = (fn as any).url;
    return (
      <FormImpl
        {...props}
        action={url}
        onSubmit={submission => {
          const key =
            typeof props.key !== "undefined"
              ? props.key
              : Math.random().toString(36).substring(2, 8);

          submitWithKey([submission.formData] as any, key, owner);
        }}
      >
        <Show when={props.key}>
          <input type="hidden" name="_key" value={props.key} />
        </Show>
        {props.children}
      </FormImpl>
    );
  }

  submit.Form = Form as unknown as D extends [FormData] ? (props: FormProps) => JSX.Element : never;
  submit.url = (fn as any).url;
  submit.isSubmitting = () =>
    Object.values(submissions()).filter(sub => sub.status === "submitting").length > 0;

  let getSubmissions = (): { [key: string]: ActionSubmission<D> } => {
    const existingSubmissions = submissions();
    const [params] = useSearchParams();

    let param = params.form ? JSON.parse(params.form) : null;
    if (!param) {
      return existingSubmissions;
    }

    let entry = param.entries.find(e => e[0] === "_key");
    let key = typeof entry !== "undefined" ? entry[1] : "default";

    if (param.url !== (fn as any).url) {
      return existingSubmissions;
    }

    let error = param.error
      ? new FormError(param.error.message, {
          fieldErrors: param.error.fieldErrors,
          stack: param.error.stack,
          form: param.error.form,
          fields: param.error.fields
        })
      : null;

    let paramForm = {
      key,
      error: error,
      index: -1,
      status: error ? "error" : "idle",
      variables: {
        action: param.url,
        method: "POST",
        // mock readonly form data to read the information from the form
        // submission from the URL params
        formData: {
          get: (name: string) => {
            let entry = param.entries.find(e => e[0] === name);
            return typeof entry !== "undefined" ? entry[1] : undefined;
          }
        }
      }
    };

    return {
      [paramForm.key]: paramForm,
      ...existingSubmissions
    };
  };

  submit.submissions = getSubmissions;
  submit.submission = (key: string) => getSubmissions()[key ?? ""];
  submit.submit = submitWithKey;

  return submit;
}
