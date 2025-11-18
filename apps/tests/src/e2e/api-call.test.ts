import { expect, test } from "@playwright/test";

test.describe("api calls", () => {
  test("should return text/plain", async () => {
    const response = await fetch("http://localhost:3000/api/text-plain");
    expect(await response.text()).toBe("test");
  });
});
