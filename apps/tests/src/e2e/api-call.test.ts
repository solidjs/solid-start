import { expect, test } from "@playwright/test";

test.describe("api calls", () => {
  test("should return plain text", async () => {
    const response = await fetch("http://localhost:3000/api/text-plain");
    expect(await response.text()).toBe("test");
  });

  test("should include headers from both event and returned request", async () => {
    const okResp = await fetch("http://localhost:3000/api/header-merging?status=ok");
    expect(okResp.headers.get("Set-Cookie")).toBeTruthy();
    expect(okResp.headers.get("x-event-header")).toBe("value");
    expect(okResp.headers.get("x-return-header")).toBe("value");
    expect(okResp.headers.get("x-shared-header")).toBe("event");

    const redirectResp = await fetch("http://localhost:3000/api/header-merging?status=redirect", { redirect: "manual" });
    expect(redirectResp.headers.get("Set-Cookie")).toBeTruthy();
    expect(redirectResp.headers.get("x-event-header")).toBe("value");
    expect(redirectResp.headers.get("x-return-header")).toBe("value");
    expect(redirectResp.headers.get("x-shared-header")).toBe("event");
  })
});
