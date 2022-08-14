import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, getOwner, runWithOwner, startTransition, useContext } from "solid-js";
import { isServer } from "solid-js/web";
import { FormError, FormImpl, FormProps } from "./Form";

import type { ParentComponent } from "solid-js";
import { Owner } from "solid-js/types/reactive/signal";
import { isRedirectResponse } from "../server/responses";
import { ServerContext } from "../server/ServerContext";
import { ServerFunctionEvent } from "../server/types";
import { refetchRouteData } from "./createRouteData";

interface ActionEvent extends ServerFunctionEvent {}

export type ActionState = "idle" | "pending";
export type RouteAction<T, U> = {
  value?: U;
  error?: FormError | null;
  pending: T[];
  state: ActionState;
  Form: T extends FormData ? ParentComponent<FormProps> : never;
  url: string;
  submit: (vars: T) => Promise<U>;
  reset: () => void;
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
  const [pending, setPending] = createSignal<T[]>([]);
  const [data, setData] = createSignal<{ value?: U; error?: any }>({});
  const owner = getOwner();
  const navigate = useNavigate();
  const event = useContext(ServerContext);
  const lookup = new Map();
  const toDelete = new Set();
  let count = 0;
  let tempOwner: Owner = owner!;
  let handledError = false;

  function handleRefetch(response) {
    return startTransition(() => {
      refetchRouteData(
        typeof options.invalidate === "function" ? options.invalidate(response) : options.invalidate
      );
    });
  }

  function handleResponse(response: Response) {
    if (response instanceof Response && isRedirectResponse(response)) {
      const locationUrl = response.headers.get("Location") || "/";
      if (locationUrl.startsWith("http")) {
        window.location.href = locationUrl;
      } else {
        navigate(locationUrl);
      }
    }

    if (response.ok || isRedirectResponse(response)) return handleRefetch(response);
  }

  function submit(variables: T) {
    const p = fn(variables, event);
    const reqId = ++count;
    lookup.set(p, variables);
    setPending(Array.from(lookup.values()));
    p.then(async res => {
      toDelete.add(p);
      if (reqId === count) {
        if (res instanceof Response) {
          await handleResponse(res);
        } else await handleRefetch(res);
        toDelete.forEach(p => lookup.delete(p));
        setPending(Array.from(lookup.values()));
        setData(() => ({ value: res }));
      }
      return res;
    }).catch(async e => {
      toDelete.add(p);
      if (reqId === count) {
        if (e instanceof Response) {
          await handleResponse(e);
        } else await handleRefetch(e);
        toDelete.forEach(p => lookup.delete(p));
        setPending(Array.from(lookup.values()));
        if (!isRedirectResponse(e)) {
          setData(() => ({ error: e }));
          return runWithOwner(tempOwner || owner, () => {
            if (!handledError) throw e;
          });
        } else setData(() => ({ value: e }));
      }
    });
    return p;
  }

  return {
    get value() {
      return data().value;
    },
    get pending() {
      return pending();
    },
    get state() {
      return pending().length ? "pending" : "idle";
    },
    get error() {
      handledError = true;
      const error = data().error;
      if (!isServer) return error;
      const [params] = useSearchParams();

      let param = params.form ? JSON.parse(params.form) : null;
      if (!param || param.url !== (fn as any).url) {
        return error;
      }

      return param.error
        ? new FormError(param.error.message, {
            fieldErrors: param.error.fieldErrors,
            stack: param.error.stack,
            form: param.error.form,
            fields: param.error.fields
          })
        : error;
    },
    reset() {
      setData(() => ({}));
    },
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
