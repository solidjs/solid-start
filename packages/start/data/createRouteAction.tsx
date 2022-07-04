import { useNavigate, useSearchParams } from "solid-app-router";
import { createSignal, startTransition, getOwner, runWithOwner, useContext } from "solid-js";
import { isServer } from "solid-js/web";
import { FormProps, FormImpl, FormError } from "./Form";

import type { ParentComponent } from "solid-js";
import { Owner } from "solid-js/types/reactive/signal";
import { isRedirectResponse } from "../server/responses";
import { refetchRouteData } from "./createRouteData";
import { ServerContext } from "../server/ServerContext";
import { ServerFunctionEvent } from "../server/types";

interface ActionEvent extends ServerFunctionEvent {}

export type ActionState = "idle" | "pending";
export type RouteAction<T, U> = {
  value?: U;
  error?: Error | null;
  pending: T[];
  state: ActionState;
  Form: T extends FormData ? ParentComponent<FormProps> : ParentComponent;
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
  let count = 0;
  let tempOwner: Owner = owner;
  let handledError = false;

  function submit(variables: T) {
    const p = fn(variables, event);
    const reqId = ++count;
    lookup.set(p, variables);
    setPending(Array.from(lookup.values()));
    p.then(res => {
      lookup.delete(p);
      const v = Array.from(lookup.values());
      setPending(v);
      if (reqId === count) {
        setData(() => ({ value: res }));
        if (res instanceof Response && res.status === 302)
          navigate(res.headers.get("Location") || "/");
        if (res instanceof Response && res.ok)
          startTransition(() => {
            refetchRouteData(
              typeof options.invalidate === "function"
                ? options.invalidate(res as Response)
                : options.invalidate
            );
          });
      }
      return res;
    }).catch(e => {
      lookup.delete(p);
      setPending(Array.from(lookup.values()));
      if (reqId === count) {
        return runWithOwner(tempOwner || owner, () => {
          if (e instanceof Response && isRedirectResponse(e)) {
            navigate(e.headers.get("Location") || "/");
            startTransition(() => {
              refetchRouteData(
                typeof options.invalidate === "function"
                  ? options.invalidate(e as Response)
                  : options.invalidate
              );
            });
          }
          setData(() => ({ error: e }));
          if (!handledError) throw e;
        });
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
    Form(props: FormProps) {
      const formOwner = getOwner();

      let url = (fn as any).url;
      return (
        <FormImpl
          {...props}
          action={url}
          onSubmit={submission => {
            tempOwner = formOwner;
            submit(submission.formData as any);
            tempOwner = owner;
          }}
        >
          {props.children}
        </FormImpl>
      );
    },
    submit
  };
}
