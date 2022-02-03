import { Accessor, createSignal } from "solid-js";

type ActionStatus = "submitting" | "error" | "success";

interface SubmissionState {
  data: any;
  error: Error | null;
  status: ActionStatus;
}

export type ActionSubmission<T> = {
  variables: T;
  state: Accessor<SubmissionState>;
  status: ActionStatus;
  error: Error | null;
  key: any;
  index: number;
  setState: (state: SubmissionState | ((s: SubmissionState) => SubmissionState)) => void;
};

export function createAction<T, U = void>(fn: (args: T) => Promise<U>) {
  const [submissions, setSubmissions] = createSignal<{
    [key: string]: ActionSubmission<T>;
  }>({});

  let index = 0;
  async function action(submission: T, _k: string) {
    let i = ++index;
    let key = () => _k || `${i}`;
    let submissionState, setSubmissionState;

    if (submissions()[key()]) {
      submissionState = submissions()[key()].state;
      setSubmissionState = submissions()[key()].setState;

      setSubmissionState({
        status: "success",
        data: null,
        error: null
      });
    } else {
      [submissionState, setSubmissionState] = createSignal<SubmissionState>({
        status: "submitting",
        data: null,
        error: null
      });

      setSubmissions({
        ...submissions(),
        [key()]: {
          variables: submission,
          state: submissionState,
          get status() {
            return submissionState().status;
          },
          get error() {
            return submissionState().error;
          },
          get key() {
            return key();
          },
          setState: setSubmissionState,
          index: i
        }
      });
    }

    try {
      let response = await fn(submission);

      // if response was successful, remove the submission since its resolved
      // TODO: figure out if this is the appropriate behaviour, should we keep successful submissions?
      // setSubmissions(obj => {
      //   let newObj = { ...obj };
      //   delete newObj[key()];
      //   return newObj;
      // });
      setSubmissionState({
        status: "success",
        data: response,
        error: null
      });
      return response;
    } catch (e) {
      // console.error(e);
      setSubmissionState({
        status: "error",
        data: null,
        error: e
      });

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
