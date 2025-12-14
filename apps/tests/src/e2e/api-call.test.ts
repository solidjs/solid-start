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

    const redirectResp = await fetch("http://localhost:3000/api/header-merging?status=redirect", {
      redirect: "manual",
    });
    expect(redirectResp.headers.get("Set-Cookie")).toBeTruthy();
    expect(redirectResp.headers.get("x-event-header")).toBe("value");
    expect(redirectResp.headers.get("x-return-header")).toBe("value");
    expect(redirectResp.headers.get("x-shared-header")).toBe("event");
  });

  test("should preserve multiple Set-Cookie headers on redirect (RFC 6265)", async () => {
    const response = await fetch("http://localhost:3000/api/multi-set-cookie-redirect", {
      redirect: "manual",
    });

    expect(response.status).toBe(302);

    // Use getSetCookie() to retrieve all Set-Cookie headers as an array
    const cookies = response.headers.getSetCookie();

    // We expect 3 cookies:
    // 1. session=abc123 (from response headers)
    // 2. csrf=xyz789 (from response headers)
    // 3. event_cookie=from_event (from event.response headers via setHeader)
    expect(cookies.length).toBe(3);

    const cookieValues = cookies.join("; ");
    expect(cookieValues).toContain("session=abc123");
    expect(cookieValues).toContain("csrf=xyz789");
    expect(cookieValues).toContain("event_cookie=from_event");
  });
});
