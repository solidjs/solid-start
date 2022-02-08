import { Accessor, createSignal } from "solid-js";

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
  error: Error | null;
  key: any;
  index: number;
  setState: SetSubmissionState<T>;
};

/**
 *
 * @param actionFn the async function that handles the submission, this would be where you call your API
 */
export function createAction<T, U = void>(actionFn: (args: T) => Promise<U>) {
  const [submissions, setSubmissions] = createSignal<{
    [key: string]: ActionSubmission<T>;
  }>({});

  let index = 0;

  async function action(submission: T, _k: string) {
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
            return submissionState().error;
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
      let response = await actionFn(submission);

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

  return [submissions, action] as [
    Accessor<{
      [key: string]: ActionSubmission<T>;
    }>,
    (vars: T, key?: string) => Promise<U>
  ];
}
