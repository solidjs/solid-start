import { test, expect } from "@playwright/test";

test("basic login test", async ({ browser }) => {
  let appURL = new URL(process.env.TEST_HOST ?? "http://localhost:3000/").href;
  const context = await browser.newContext({
    javaScriptEnabled: !process.env.DISABLE_JAVASCRIPT
  });

  const page = await context.newPage();

  // go to home
  await page.goto(appURL);

  console.log(`redirect to login page`);
  await page.waitForURL(new URL("/login", appURL).href);

  console.log("testing wrong password");
  await page.fill('input[name="username"]', "kody");
  await page.fill('input[name="password"]', "twixroxx");
  await page.click("button[type=submit]");

  await expect(page.locator("#error-message")).toHaveText(
    "Username/Password combination is incorrect"
  );

  // await page.click("#reset-errors");

  console.log("testing wrong username");
  await page.fill('input[name="username"]', "kod");
  await page.fill('input[name="password"]', "twixrox");
  await page.click("button[type=submit]");

  await expect(page.locator("#error-message")).toHaveText(
    "Username/Password combination is incorrect"
  );

  // await page.click("#reset-errors");

  console.log("testing invalid password");
  await page.fill('input[name="username"]', "kody");
  await page.fill('input[name="password"]', "twix");
  await page.click("button[type=submit]");

  await expect(page.locator("#error-message")).toHaveText("Fields invalid");

  // await page.click("#reset-errors");

  console.log("login");
  await page.fill('input[name="username"]', "kody");
  await page.fill('input[name="password"]', "twixrox");
  await page.click("button[type=submit]");

  console.log(`redirect to home after login`);
  await page.waitForURL(appURL);

  console.log(`going to login page should redirect to home page since we are logged in`);
  await page.goto(new URL("/login", appURL).href);
  await page.waitForURL(appURL);

  console.log(`logout`);
  await page.click("button[name=logout]");
  await page.waitForURL(new URL("/login", appURL).href);

  console.log(`going to home should redirect to login`);
  await page.goto(appURL);
  await page.waitForURL(new URL("/login", appURL).href);
});
