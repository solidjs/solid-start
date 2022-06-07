import { useNavigate } from "solid-app-router";
import { createSignal, startTransition, getOwner, runWithOwner } from "solid-js";
import { isServer } from "solid-js/web";
import { FormProps, FormImpl, FormError } from "./Form";

import type { ParentComponent } from "solid-js";
import { Owner } from "solid-js/types/reactive/signal";
import { isRedirectResponse } from "../server/responses";
import { refetchRouteResources } from "./createRouteResource";
import { useSearchParams } from ".";

export type ActionState = "idle" | "pending";
type Action<T, U> = [{ value?: U; pending: T[]; state: ActionState }, (vars: T) => Promise<U>];

function createAction<T, U = void>(fn: (args: T) => Promise<U>): Action<T, U> {
  const [pending, setPending] = createSignal<T[]>([]);
  const [value, setValue] = createSignal<U>();
  const owner = getOwner();
  const lookup = new Map();
  let count = 0;
  function mutate(variables: T) {
    const p = fn(variables);
    const reqId = ++count;
    lookup.set(p, variables);
    setPending(Array.from(lookup.values()));
    p.then(data => {
      lookup.delete(p);
      const v = Array.from(lookup.values());
      setPending(v);
      if (reqId === count) setValue(() => data);
      return data;
    }).catch(err =>
      runWithOwner(owner, () => {
        throw err;
      })
    );
    return p;
  }
  return [
    {
      get value() {
        return value();
      },
      get pending() {
        return pending();
      },
      get state() {
        return pending().length ? "pending" : "idle";
      }
    },
    mutate
  ];
}

export type RouteAction<T, U> = {
  value?: U;
  pending: T[];
  state: ActionState;
  Form: T extends FormData ? ParentComponent<FormProps> : ParentComponent;
  url: string;
  submit: (vars: T) => Promise<U>;
};

export function createRouteAction<D, R extends any>(
  fn: (arg: D) => Promise<R>,
  options: { invalidate?: ((r: Response) => string | any[] | void) | string | any[] } = {}
): RouteAction<D, R> {
  const navigate = useNavigate();
  const actionOwner = getOwner();
  let tempOwner: Owner = actionOwner;
  const [action, submit] = createAction<D, R>(v =>
    fn(v)
      .then(response => {
        if (response instanceof Response && response.status === 302)
          navigate(response.headers.get("Location") || "/");
        if (response instanceof Response && response.ok)
          startTransition(() => {
            refetchRouteResources(
              typeof options.invalidate === "function"
                ? options.invalidate(response as Response)
                : options.invalidate
            );
          });
        return response;
      })
      .catch((e: Error) => {
        return runWithOwner(tempOwner || actionOwner, () => {
          if (e instanceof Response && isRedirectResponse(e)) {
            navigate(e.headers.get("Location") || "/");
            startTransition(() => {
              refetchRouteResources(
                typeof options.invalidate === "function"
                  ? options.invalidate(e as Response)
                  : options.invalidate
              );
            });
          }
          return e as R;
        });
      })
  );

  function Form(props: FormProps) {
    const owner = getOwner();

    let url = (fn as any).url;
    return (
      <FormImpl
        {...props}
        action={url}
        onSubmit={submission => {
          tempOwner = owner;
          submit(submission.formData as any);
          tempOwner = actionOwner;
        }}
      >
        {props.children}
      </FormImpl>
    );
  }

  (action as any).submit = submit;
  (action as any).Form = Form as D extends FormData ? ParentComponent<FormProps> : ParentComponent;
  (action as any).url = (fn as any).url;
  if (isServer) {
    const ogValue = Object.getOwnPropertyDescriptor(action, "value").get;
    Object.defineProperty(action as any, "value", {
      get() {
        const value: R = ogValue();
        const [params] = useSearchParams();

        let param = params.form ? JSON.parse(params.form) : null;
        if (!param || param.url !== (fn as any).url) {
          return value;
        }

        return param.error
          ? new FormError(param.error.message, {
              fieldErrors: param.error.fieldErrors,
              stack: param.error.stack,
              form: param.error.form,
              fields: param.error.fields
            })
          : value;
      }
    });
  }
  return action as RouteAction<D, R>;
}
