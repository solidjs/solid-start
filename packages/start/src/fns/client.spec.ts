import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../shared/dev-toolbar/functions/tracker.ts", () => ({
  pushRequest: vi.fn(),
  pushResponse: vi.fn(),
}));

vi.mock("./serialization.ts", () => ({
  serializeToJSONString: vi.fn(async () => "[]"),
}));

vi.mock("./shared.ts", async importOriginal => {
  const actual = await importOriginal<typeof import("./shared.ts")>();
  return { ...actual, extractBody: vi.fn(async () => undefined) };
});

const { cloneServerReference } = await import("./client.ts");

const respondWith = (status: number, headers: Record<string, string> = {}) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status, headers })),
  );
};

const callServerFunction = () =>
  (cloneServerReference("test-fn") as unknown as () => Promise<unknown>)();

const rejectionOf = async (call: Promise<unknown>) => {
  try {
    await call;
  } catch (error) {
    return error;
  }
  throw new Error("expected the server function call to reject");
};

describe("fetchServerFunction", () => {
  beforeEach(() => {
    vi.stubEnv("BASE_URL", "http://localhost/");
  });

  it("rejects when the response is a 5xx without an X-Error header", async () => {
    respondWith(500);
    const rejection = await rejectionOf(callServerFunction());
    expect(rejection).toBeInstanceOf(Error);
    expect(rejection).toHaveProperty("message", "Server function call failed with status 500");
  });

  it("rejects with an error when an X-Error response carries no body", async () => {
    respondWith(403, { "X-Error": "true" });
    const rejection = await rejectionOf(callServerFunction());
    expect(rejection).toBeInstanceOf(Error);
    expect(rejection).toHaveProperty("message", "Server function call failed with status 403");
  });

  it("resolves normally for a successful response", async () => {
    respondWith(200);
    await expect(callServerFunction()).resolves.toBeUndefined();
  });
});
