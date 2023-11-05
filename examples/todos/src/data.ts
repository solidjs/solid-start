import {
  $TRACK,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  startTransition
} from "solid-js";

const resources = new Set<(k: any) => void>();
export function refetchLoaders(key?: string | any[] | void) {
  return startTransition(() => {
    for (let refetch of resources) refetch(key);
  });
}

export function createLoader<T>(fn: () => Promise<T>) {
  const [resource, { refetch }] = createResource(fn);
  resources.add(refetch);
  onCleanup(() => resources.delete(refetch));
  return resource;
}

export type Submission<T, U> = {
  readonly input: T;
  fn: (vars: T) => Promise<U>;
  readonly result?: U;
  readonly error?: unknown;
  clear: () => void;
  retry: () => void;
  readonly pending: boolean;
};
export type Action<T, U> = (vars: T) => Promise<U>;

const [submissions, setSubmissions] = createSignal<Submission<any, any>[]>([]);
export function useSubmissions<T, U>(
  fn: Action<T, U>,
  filter?: (arg: T) => boolean
): Submission<T, U>[] & { pending: boolean } {
  const subs = createMemo(() =>
    submissions().filter(s => s.fn === fn && (!filter || filter(s.input)))
  );
  return new Proxy<Submission<any, any>[] & { pending: boolean }>([] as any, {
    get(_, property) {
      if (property === $TRACK) return subs();
      if (property === "pending") return subs().some(sub => !sub.result && !sub.error);
      return subs()[property];
    }
  });
}

export function useSubmission<T, U>(
  fn: Action<T, U>,
  filter?: (arg: T) => boolean
): Submission<T, U> {
  const submissions = useSubmissions(fn, filter);
  return {
    get fn() {
      return submissions[0]?.fn;
    },
    get clear() {
      return submissions[0]?.clear;
    },
    get retry() {
      return submissions[0]?.retry;
    },
    get input() {
      return submissions[0]?.input;
    },
    get result() {
      return submissions[0]?.result;
    },
    get pending() {
      return submissions[0]?.pending;
    }
  };
}

export function useAction<T, U>(action: Action<T, U>) {
  // this is where we would inject Router specific context.. for now just a pass through.
  return action;
}

export function action<T, U = void>(fn: (args: T) => Promise<U>): Action<T, U> {
  function mutate(variables: T) {
    const p = fn(variables);
    const [result, setResult] = createSignal<{ data?: U; error?: any }>();
    let submission;
    setSubmissions(s => [
      ...s,
      (submission = {
        fn: mutate,
        input: variables,
        get result() {
          return result()?.data;
        },
        get pending() {
          return !result();
        },
        get error() {
          return result()?.error;
        },
        clear() {
          setSubmissions(v => v.filter(i => i.input !== variables));
        },
        retry() {
          setResult(undefined);
          const p = fn(variables);
          p.then(async data => {
            await refetchLoaders();
            data ? setResult({ data }) : submission.clear();
            return data;
          }).catch(error => {
            console.log(error);
            setResult({ error });
          });
          return p;
        }
      })
    ]);
    p.then(async data => {
      await refetchLoaders();
      data ? setResult({ data }) : submission.clear();
      return data;
    }).catch(error => {
      console.log(error);
      setResult({ error });
    });
    return p;
  }
  return mutate;
}
