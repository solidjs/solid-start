import { expect, test } from "@playwright/test";

import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture, prettyHtml } from "./helpers/playwright-fixture.js";

test.describe("actions", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.skip(process.env.START_ADAPTER !== "solid-start-node");

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/client-action.tsx": js`
          import { createRouteAction } from 'solid-start/data';

          export default function Index() {
            const [submission, submit] = createRouteAction(async (params) => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (params.hello === "world") {
                return "success";
              }
              else throw new Error('Wrong planet');
            })
            return (
              <>
                <button onClick={e => submit({ hello: "world" })} id="submit-earth">Earth</button>
                <button onClick={e => submit({ hello: "mars" })} id="submit-mars">Mars</button>
                <button onClick={e => submission.clear()} id="reset">Reset</button>
                <Show when={submission.result}><p id="result">{submission.result}</p></Show>
                <Show when={submission.pending}><p id="pending">Pending</p></Show>
                <Show when={submission.error} keyed>{e => <p id="error">{e.message}</p>}</Show>
              </>
            );
          }
        `,
        "src/routes/server-action.tsx": js`
          import { createServerAction$, ServerError } from 'solid-start/server';

          export default function Index() {
            const [submission, submit] = createServerAction$(async (params) => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (params.hello === "world") {
                return "success";
              }
              else throw new ServerError('Wrong planet');
            })

            return (
              <>
                <button onClick={e => submit({ hello: "world" })} id="submit-earth">Earth</button>
                <button onClick={e => submit({ hello: "mars" })} id="submit-mars">Mars</button>
                <button onClick={e => submission.clear()} id="reset">Reset</button>
                <Show when={submission.result}><p id="result">{submission.result}</p></Show>
                <Show when={submission.pending}><p id="pending">Pending</p></Show>
                <Show when={submission.error} keyed>{e => <p id="error">{e.message}</p>}</Show>
              </>
            );
          }
        `,
        "src/components/Action.tsx": js`
          import { createServerAction$, ServerError } from 'solid-start/server';

          export function Action() {
            const [submission, submit] = createServerAction$(async (params) => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (params.hello === "world") {
                return "success";
              }
              else throw new ServerError('Wrong planet');
            })

            return (
              <>
                <button onClick={e => submit({ hello: "world" })} id="submit-earth">Earth</button>
                <button onClick={e => submit({ hello: "mars" })} id="submit-mars">Mars</button>
                <button onClick={e => submission.clear()} id="reset">Reset</button>
                <Show when={submission.result}><p id="result">{submission.result}</p></Show>
                <Show when={submission.pending}><p id="pending">Pending</p></Show>
                <Show when={submission.error} keyed>{e => <p id="error">{e.message}</p>}</Show>
              </>
            );
          }
        `,
        // TODO: check the bug related to Document hydration for the `< when={action.value}>`
        "src/routes/server-action-in-component.tsx": js`
          import { Action } from '~/components/Action';
          export default function Route() {
            return <Action />
          }
        `,
        "src/routes/server-file-action.tsx": js`
          import { createServerAction$, ServerError } from 'solid-start/server';
          import { Buffer } from 'node:buffer';

          async function verifyFileContent(file, expectedName, expectedContent, expectedType) {
            if (file.name !== expectedName) {
              throw new ServerError("file had wrong name " + file.name + "; expected " + expectedName);
            }
            if (file.type !== expectedType) {
              throw new ServerError("file had wrong type " + file.type + "; expected " + expectedType);
            }
            let decoded = Buffer.from(await file.arrayBuffer()).toString("utf8");
            if (decoded !== expectedContent) {
              throw new ServerError("file " + expectedName + " had wrong content " + decoded);
            }
          }
          export default function Index() {
            const [submission, submit] = createServerAction$(async (formData) => {
              if (formData.get("other") !== "otherval") {
                throw new ServerError("other had wrong value " + formData.get("other"));
              }
              const files = formData.getAll("files");
              if (files.length < 3) {
                throw new ServerError("too few files");
              }
              await verifyFileContent(files[0], "a.txt", "a", "text/plain");
              await verifyFileContent(files[1], "b.txt", "b", "text/plain");
              await verifyFileContent(files[2], "c.json", '{"message":"c"}', "application/json");
              return "success";
            });

            return (
              <submit.Form enctype="multipart/form-data">
                <input type="file" name="files" multiple={true}/>
                <br/>
                <input name="other"/>
                <br/>
                <input type="submit" id="submit"/>
                <Show when={submission.result}><p id="result">{submission.result}</p></Show>
                <Show when={submission.pending}><p id="pending">Pending</p></Show>
                <Show when={submission.error} keyed>{e => <p id="error">{e.message}</p>}</Show>
              </submit.Form>
            );
          }
        `
      }
    });

    appFixture = await fixture.createServer();
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test("client-side action submitted without form", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/client-action", true);

    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);

    // successful submission
    await page.click("button#submit-earth");
    expect(await page.isVisible("#pending")).toBe(true);
    await page.waitForSelector("#result", {
      state: "visible"
    });

    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
    expect(await app.getHtml("#result")).toBe(prettyHtml(`<p id="result">success</p>`));

    // error submission
    await page.click("button#submit-mars");
    expect(await page.isVisible("#pending")).toBe(true);
    expect(await page.isVisible("#result")).toBe(false);
    await page.waitForSelector("#error", {
      state: "visible"
    });
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await app.getHtml("#error")).toBe(prettyHtml(`<p id="error">Wrong planet</p>`));

    // reset
    await page.click("button#reset");
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
  });

  test("server-side action submitted without form", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/server-action", true);

    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);

    // successful submission
    await page.click("button#submit-earth");
    expect(await page.isVisible("#pending")).toBe(true);
    await page.waitForSelector("#result", {
      state: "visible"
    });

    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
    expect(await app.getHtml("#result")).toBe(prettyHtml(`<p id="result">success</p>`));

    // error submission
    await page.click("button#submit-mars");
    expect(await page.isVisible("#pending")).toBe(true);
    expect(await page.isVisible("#result")).toBe(false);
    await page.waitForSelector("#error", {
      state: "visible"
    });
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await app.getHtml("#error")).toBe(prettyHtml(`<p id="error">Wrong planet</p>`));

    // reset
    await page.click("button#reset");
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
  });

  test("server-side action submitted without form in another component file", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/server-action-in-component", true);

    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);

    // successful submission
    await page.click("button#submit-earth");
    expect(await page.isVisible("#pending")).toBe(true);
    await page.waitForSelector("#result", {
      state: "visible"
    });

    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
    expect(await app.getHtml("#result")).toBe(prettyHtml(`<p id="result">success</p>`));

    // error submission
    await page.click("button#submit-mars");
    expect(await page.isVisible("#pending")).toBe(true);
    expect(await page.isVisible("#result")).toBe(false);
    await page.waitForSelector("#error", {
      state: "visible"
    });
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await app.getHtml("#error")).toBe(prettyHtml(`<p id="error">Wrong planet</p>`));

    // reset
    await page.click("button#reset");
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
  });

  test("server-side action with files", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/server-file-action", true);

    // check that non-file multipart/form-data has the right value
    await page.click("input#submit");
    await page.waitForSelector("#error,#result", { state: "visible" });
    expect(await app.getHtml("#error,#result")).toBe(
      prettyHtml(`<p id="error">other had wrong value</p>`)
    );

    await page.type("input[name='other']", "otherval");
    await page.click("input#submit");
    await page.waitForSelector("#error,#result", { state: "visible" });
    expect(await app.getHtml("#error,#result")).toBe(prettyHtml(`<p id="error">too few files</p>`));

    await page.setInputFiles("input[name='files']", [
      { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("garbled") },
      { name: "b.txt", mimeType: "text/plain", buffer: Buffer.from("garbled") },
      { name: "c.json", mimeType: "application/json", buffer: Buffer.from('{"message":"garbled"}') }
    ]);
    await page.click("input#submit");
    await page.waitForSelector("#error,#result", { state: "visible" });
    expect(await app.getHtml("#error,#result")).toBe(
      prettyHtml(`<p id="error">file a.txt had wrong content garbled</p>`)
    );

    await page.setInputFiles("input[name='files']", [
      { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("a") },
      { name: "b.txt", mimeType: "text/plain", buffer: Buffer.from("b") },
      { name: "c.json", mimeType: "application/json", buffer: Buffer.from('{"message":"c"}') }
    ]);
    await page.click("input#submit");
    await page.waitForSelector("#error,#result", { state: "visible" });
    expect(await app.getHtml("#error,#result")).toBe(prettyHtml(`<p id="result">success</p>`));
  });
});
