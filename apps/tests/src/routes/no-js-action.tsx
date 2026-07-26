import { action, json, redirect, reload, useSubmission } from "@solidjs/router";

const jsonAction = action(async (form: FormData) => {
  "use server";
  return json({ received: form.get("value") });
}, "no-js-json-action");

const reloadAction = action(async (_form: FormData) => {
  "use server";
  return reload();
}, "no-js-reload-action");

const redirectAction = action(async (_form: FormData) => {
  "use server";
  return redirect("/no-js-action?redirected=1");
}, "no-js-redirect-action");

const plainAction = action(async (form: FormData) => {
  "use server";
  return { received: form.get("value") };
}, "no-js-plain-action");

export default function NoJsAction() {
  const jsonSubmission = useSubmission(jsonAction);
  const plainSubmission = useSubmission(plainAction);

  return (
    <main>
      <form action={jsonAction} method="post">
        <input type="hidden" name="value" value="from-json" />
        <button id="submit-json" type="submit">
          json()
        </button>
      </form>
      <form action={reloadAction} method="post">
        <button id="submit-reload" type="submit">
          reload()
        </button>
      </form>
      <form action={redirectAction} method="post">
        <button id="submit-redirect" type="submit">
          redirect()
        </button>
      </form>
      <form action={plainAction} method="post">
        <input type="hidden" name="value" value="from-plain" />
        <button id="submit-plain" type="submit">
          plain
        </button>
      </form>
      <span id="json-result">{JSON.stringify(jsonSubmission.result ?? null)}</span>
      <span id="plain-result">{JSON.stringify(plainSubmission.result ?? null)}</span>
    </main>
  );
}
