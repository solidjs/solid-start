import { test, expect } from "@playwright/test";

test("basic login test", async ({ page, context }) => {
  // go to home
  await page.goto("http://localhost:3000/");

  console.log(`redirect to login page`);
  await page.waitForURL("http://localhost:3000/login");

  console.log("testing wrong password");
  await page.fill('input[name="username"]', "kody");
  await page.fill('input[name="password"]', "twixroxx");
  await page.click("button[type=submit]");

  await expect(page.locator("#error-message")).toHaveText(
    "Username/Password combination is incorrect"
  );

  await page.click("#reset-errors");

  console.log("testing wrong username");
  await page.fill('input[name="username"]', "kod");
  await page.fill('input[name="password"]', "twixrox");
  await page.click("button[type=submit]");

  await expect(page.locator("#error-message")).toHaveText(
    "Username/Password combination is incorrect"
  );

  await page.click("#reset-errors");

  console.log("testing invalid password");
  await page.fill('input[name="username"]', "kody");
  await page.fill('input[name="password"]', "twix");
  await page.click("button[type=submit]");

  await expect(page.locator("#error-message")).toHaveText("Fields invalid");

  await page.click("#reset-errors");

  console.log("login");
  await page.fill('input[name="username"]', "kody");
  await page.fill('input[name="password"]', "twixrox");
  await page.click("button[type=submit]");

  console.log(`redirect to home after login`);
  await page.waitForURL("http://localhost:3000/");

  console.log(`going back should redirect to home since we are logged in`);
  await page.goBack();
  await page.waitForURL("http://localhost:3000/");

  console.log(`going to login page should redirect to home page since we are logged in`);
  await page.goto("http://localhost:3000/login");
  await page.waitForURL("http://localhost:3000/");

  console.log(`logout`);
  await page.click("button[name=logout]");
  await page.waitForURL("http://localhost:3000/login");

  console.log(`going back should redirect to login`);
  await page.goBack();
  await page.waitForURL("http://localhost:3000/login");

  console.log(`going to home should redirect to login`);
  await page.goto("http://localhost:3000/");
  await page.waitForURL("http://localhost:3000/login");
});
