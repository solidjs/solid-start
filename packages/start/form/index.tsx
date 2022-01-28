import { useNavigate } from "solid-app-router";
import {
  Accessor,
  createComputed,
  createResource,
  createSignal,
  getOwner,
  refetchResources,
  runWithOwner,
  startTransition
} from "solid-js";
import { FormProps, FormImpl, Submission } from "./Form";

export { FormImpl as Form };

function createAction<T, U = void>(fn: (args: T) => Promise<U>) {
  const [pending, setPending] = createSignal<T[]>();
  const owner = getOwner();
  const lookup = new Map();
  function mutate(variables: T) {
    const p = fn(variables);
    lookup.set(p, variables);
    setPending(Array.from(lookup.values()));
    p.then(data => {
      lookup.delete(p);
      const v = Array.from(lookup.values());
      setPending(v.length ? v : null);
      return data;
    }).catch(err =>
      runWithOwner(owner, () => {
        throw err;
      })
    );
    return p;
  }
  return [pending, mutate] as [Accessor<T[]>, (vars: T) => void];
}

export function createForm<
  T extends ((form: FormData) => Promise<any | never | void>) & { url?: string }
>(fn: T) {
  const [largeError, setError] = createSignal<Error | null>(null);
  const [submitting, setSubmitting] = createSignal<boolean>(false);
  const [submissions, setSubmissions] = createSignal<{
    [key: string]: Submission & { error: Accessor<Error | null>; key: any; index: number };
  }>({});
  const [pending, mutate] = createAction(async () => {
    fn;
  });
  let usingError = false;
  let index = 0;
  function Form(props: FormProps) {
    const navigate = useNavigate();

    async function handler(submission) {
      const [error, setFormError] = createSignal<Error | null>(null);

      let i = ++index;
      let key = () => props.key || i;

      setError(null);
      setFormError(null);
      setSubmitting(true);
      setSubmissions({ ...submissions(), [key()]: { ...submission, error, key: key(), index: i } });

      try {
        let response = await fn(submission.formData);
        setSubmitting(false);
        let obj = { ...submissions() };
        console.log(key(), i);
        delete obj[key()];
        setSubmissions(obj);

        if (response instanceof Response) {
          if (response.status === 302) {
            startTransition(() => {
              navigate(response.headers.get("Location") || "/");
              refetchResources();
            });
            return;
          } else if (response.headers.get("content-type") === "application/json") {
            return await response.json();
          } else {
            return new Error(await response.text());
          }
        } else {
          startTransition(refetchResources);
        }
      } catch (e) {
        // if (e instanceof Response) {
        //   if (e.status === 302) {
        //     setSubmitting(false);
        //     let obj = { ...submissions() };
        //     delete obj[key()];
        //     setSubmissions(obj);

        //     navigate(e.headers.get("Location") || "/");
        //     startTransition(refetchResources);
        //     return;
        //   } else if (e.headers.get("content-type") === "application/json") {
        //     throw await e.json();
        //   } else {
        //     throw new Error(await e.text());
        //   }
        // }

        console.log(e);
        setSubmitting(false);
        setSubmissions(submissions);
        setFormError(e);

        // setSubmission(null);
        // setError(e);
        // console.log(error(), usingError);
        // if (!usingError) {
        //   // refetch();
        // }
      }
    }

    return (
      <FormImpl
        {...props}
        action={fn.url ?? ""}
        onSubmit={submission => {
          handler(submission);
        }}
      />
    );
  }

  // Form.error = () => {
  //   usingError = true;
  //   return largeError();
  // };
  Form.Form = Form;
  Form.url = fn.url;
  Form.isSubmitting = submitting;
  Form.submissions = submissions;
  Form.submission = () => submissions()[index];
  return Form;
}
