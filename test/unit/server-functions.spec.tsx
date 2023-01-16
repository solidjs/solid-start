import { assert, expect, it, vi } from "vitest";
// Edit an assertion and save to see HMR in action
import "solid-start/node/globals.js";
import server$, {
  handleServerRequest,
  XSolidStartContentTypeHeader, XSolidStartResponseTypeHeader
} from "solid-start/server";
import { MockAgent, setGlobalDispatcher } from "undici";

const mockAgent = new MockAgent({});
setGlobalDispatcher(mockAgent);

mockAgent.on("*", console.log);

// Provide the base url to the request
const mockPool = mockAgent.get("http://localhost:3000");

if (process.env.TEST_ENV === "client" && process.env.TEST_MODE === "client-server") {
  // tests that the client-server interaction is correct
  // wires the client side Request to the server side handler and parses the Response on the way back
  let mock = vi.spyOn(server$, "fetcher");
  mock.mockImplementation(request =>
    handleServerRequest({ request, responseHeaders: new Headers(), manifest: {} })
  );
}

// tests that the client is sending the correct http request and parsing the http respose correctly,
// mocks fetch
// if testing client-server or server, this is a noop
function mockServerFunction(fn, args, status, response, headers?) {
  if (process.env.TEST_MODE === "client") {
    mockPool
      .intercept({
        path: fn.url,
        method: "POST"
        // body: args ? JSON.stringify(args) : undefined
      })
      .reply(status, response, { headers });
  }
}

it("should handle no args", async () => {
  const basic = server$(async () => ({ data: "Hello World" }));

  mockServerFunction(basic, null, 200, {
    data: "Hello World"
  });

  expect(await basic()).toMatchObject({ data: "Hello World" });
});

it("should handle one string arg", async () => {
  const basicArgs = server$(async (name?: string) => ({
    data: `Hello ${name ?? "World"}`
  }));

  mockServerFunction(basicArgs, [], 200, {
    data: "Hello World"
  });

  expect(await basicArgs()).toMatchObject({ data: "Hello World" });

  mockServerFunction(basicArgs, ["da vinci"], 200, {
    data: "Hello da vinci"
  });

  expect(await basicArgs("da vinci")).toMatchObject({ data: "Hello da vinci" });
});

it("should handle multiple args", async () => {
  const mutipleArgs = server$(async (name: string, message: string) => ({
    data: `${message} ${name}`
  }));

  mockServerFunction(mutipleArgs, ["World", "Hello"], 200, {
    data: "Hello World"
  });

  expect(await mutipleArgs("World", "Hello")).toMatchObject({ data: "Hello World" });
});

it("should throw object if handler throws", async () => {
  const throwJSON = server$(async (name?: string) => {
    throw {
      data: `Hello ${name ?? "World"}`
    };
  });

  mockServerFunction(
    throwJSON,
    ["da vinci"],
    200,
    {
      data: "Hello da vinci"
    },
    {
      [XSolidStartResponseTypeHeader]: "throw",
      "content-type": "application/json"
    }
  );

  try {
    let e = await throwJSON("da vinci");
    throw new Error("should have thrown");
  } catch (e) {
    expect(e.data).toBe("Hello da vinci");
  }
});

it("should allow curried servers with args explicity passed in", async () => {
  const curriedServer = (message?: string) => (name?: string) =>
    server$(async (name?: string, message?: string) => ({
      data: `${message ?? "Hello"} ${name ?? "World"}`
    }))(name, message);

  if (process.env.TEST_MODE === "client") {
    return;
  }
  expect(await curriedServer()()).toMatchObject({ data: "Hello World" });
  expect(await curriedServer("Hello")()).toMatchObject({ data: "Hello World" });
  expect(await curriedServer("Welcome")()).toMatchObject({ data: "Welcome World" });
  expect(await curriedServer("Welcome")("da vinci")).toMatchObject({ data: "Welcome da vinci" });
});

const MESSAGE = "HELLO";

it("should allow access to module scope inside the handler", async () => {
  const accessModuleScope = () => (name?: string) =>
    server$(async (name?: string) => ({
      data: `${MESSAGE ?? "Hello"} ${name ?? "World"}`
    }))(name);

  if (process.env.TEST_MODE === "client") {
    return;
  }

  expect(await accessModuleScope()()).toMatchObject({ data: "HELLO World" });
  expect(await accessModuleScope()("World")).toMatchObject({ data: "HELLO World" });
});

it("should throw error when invalid closure", async () => {
  const invalidClosureAccess = (message?: string) => (name?: string) =>
    server$(async (name?: string) => ({
      data: `${message ?? "Hello"} ${name ?? "World"}`
    }))(name);

  if (process.env.TEST_MODE === "client") {
    return;
  }

  try {
    expect(await invalidClosureAccess("Welcome")("da vinci")).toMatchObject({
      data: "Welcome da vinci"
    });
  } catch (e) {
    assert.equal(
      e.message,
      `message is not defined\n You probably are using a variable defined in a closure in your server function.`
    );
  }
});

it("should return redirect when handler returns redirect", async () => {
  const redirectServer = server$(async () => {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/hello"
      }
    });
  });

  mockPool
    .intercept({
      path: redirectServer.url,
      method: "POST",
      body: JSON.stringify([])
    })
    .reply(204, null, {
      headers: {
        Location: "/hello"
      }
    });

  expect(await redirectServer()).satisfies(e => {
    expect(e.headers.get("location")).toBe("/hello");
    expect(e.status).toBe(302);
    // expect(server$.getContext().headers.get("x-solidstart-status-code")).toBe("302");
    // expect(server$.getContext().headers.get("x-solidstart-location")).toBe("/hello");
    // expect(server$.getContext().headers.get("location")).toBe("/hello");
    return true;
  });
});

it("should throw redirect when handler throws redirect", async () => {
  const throwRedirectServer = server$(async () => {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/hello"
      }
    });
  });

  mockPool
    .intercept({
      path: throwRedirectServer.url,
      method: "POST",
      body: JSON.stringify([])
    })
    .reply(204, null, {
      headers: {
        Location: "/hello",
        [XSolidStartResponseTypeHeader]: "throw"
      }
    });

  try {
    await throwRedirectServer();

    throw new Error("Should have thrown");
  } catch (e) {
    expect(e.headers.get("location")).toBe("/hello");
    expect(e.status).toBe(302);
    // expect(server$.getContext().headers.get("x-solidstart-status-code")).toBe("302");
    // expect(server$.getContext().headers.get("x-solidstart-location")).toBe("/hello");
    // expect(server$.getContext().headers.get("location")).toBe("/hello");
  }
});

it("should return response when handler returns response", async () => {
  const redirectServer = server$(async () => {
    return new Response("text", {
      status: 404,
      headers: {
        RandomHeader: "solidjs"
      }
    });
  });

  mockPool
    .intercept({
      path: redirectServer.url,
      method: "POST",
      body: JSON.stringify([])
    })
    .reply(404, "text", {
      headers: {
        RandomHeader: "solidjs"
      }
    });

  expect(await redirectServer()).satisfies(async e => {
    expect(e.headers.get("randomheader")).toBe("solidjs");
    expect(e.status).toBe(404);
    expect(await e.text()).toBe("text");
    return true;
  });
});

it("should throw response when handler throws response", async () => {
  const throwRedirectServer = server$(async () => {
    throw new Response("text", {
      status: 404,
      headers: {
        RandomHeader: "solidjs"
      }
    });
  });

  mockPool
    .intercept({
      path: throwRedirectServer.url,
      method: "POST",
      body: JSON.stringify([])
    })
    .reply(404, "text", {
      headers: {
        RandomHeader: "solidjs",
        [XSolidStartResponseTypeHeader]: "throw"
      }
    });

  try {
    await throwRedirectServer();

    throw new Error("Should have thrown");
  } catch (e) {
    expect(e.headers.get("randomheader")).toBe("solidjs");
    expect(e.status).toBe(404);
    expect(await e.text()).toBe("text");
  }
});

it("should throw error when handler throws error", async () => {
  const throwRedirectServer = server$(async () => {
    let error = new Error("Something went wrong");
    error.stack = "Custom stack";
    throw error;
  });

  mockPool
    .intercept({
      path: throwRedirectServer.url,
      method: "POST",
      body: JSON.stringify([])
    })
    .reply(
      200,
      {
        error: {
          message: "Something went wrong",
          stack: "Custom stack"
        }
      },
      {
        headers: {
          [XSolidStartContentTypeHeader]: "error",
          [XSolidStartResponseTypeHeader]: "throw"
        }
      }
    );

  try {
    await throwRedirectServer();

    throw new Error("Should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toBe("Something went wrong");
    expect(e.stack).toBe("Custom stack");
  }
});

class FormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormError";
  }
}

it("should throw custom error when handler throws error", async () => {
  const throwRedirectServer = server$(async () => {
    let error = new FormError("Something went wrong");
    error.stack = "Custom stack";
    throw error;
  });

  mockPool
    .intercept({
      path: throwRedirectServer.url,
      method: "POST",
      body: JSON.stringify([])
    })
    .reply(
      200,
      {
        error: {
          message: "Something went wrong",
          stack: "Custom stack",
          name: "FormError"
        }
      },
      {
        headers: {
          [XSolidStartContentTypeHeader]: "error",
          [XSolidStartResponseTypeHeader]: "throw"
        }
      }
    );

  try {
    await throwRedirectServer();

    throw new Error("Should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toBe("Something went wrong");
    expect(e.stack).toBe("Custom stack");
  }
});

it("should send request when caller sends request", async () => {
  const requestServer = server$(async request => {
    return { data: request.headers.get("x-test") };
  });

  mockPool
    .intercept({
      path: requestServer.url,
      method: "POST",
      body: JSON.stringify([
        {
          $type: "request",
          url: "http://localhost:3000/",
          method: "GET",
          headers: {
            $type: "headers",
            values: [["x-test", "test"]]
          }
        }
      ])
    })
    .reply(200, {
      data: "test"
    });

  expect(
    await requestServer(new Request("http://localhost:3000/", { headers: { "x-test": "test" } }))
  ).toMatchObject({
    data: "test"
  });
});

it("should send request inside an object when caller sends context", async () => {
  const requestServer = server$(async ({ request }) => {
    return { data: request.headers.get("x-test") };
  });

  mockPool
    .intercept({
      path: requestServer.url,
      method: "POST",
      body: JSON.stringify([
        {
          request: {
            $type: "request",
            url: "http://localhost:3000/",
            method: "GET",
            headers: {
              $type: "headers",
              values: [["x-test", "test"]]
            }
          }
        }
      ])
    })
    .reply(200, {
      data: "test"
    });

  expect(
    await requestServer({
      request: new Request("http://localhost:3000/", { headers: { "x-test": "test" } })
    })
  ).toMatchObject({
    data: "test"
  });
});

it("should send headers inside an object when caller sends object with headers", async () => {
  const requestServer = server$(async ({ headers }) => {
    return { data: headers.get("x-test") };
  });

  mockPool
    .intercept({
      path: requestServer.url,
      method: "POST",
      body: JSON.stringify([
        {
          headers: {
            $type: "headers",
            values: [["x-test", "test"]]
          }
        }
      ])
    })
    .reply(200, {
      data: "test"
    });

  expect(
    await requestServer({
      headers: new Headers({ "x-test": "test" })
    })
  ).toMatchObject({
    data: "test"
  });
});
