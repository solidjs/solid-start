import { expect, test, type ElementHandle } from "@playwright/test";

test("navigates while the initial route module is still loading", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });

  const requested = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const isInitialRoute = (url: URL) =>
    url.pathname === "/src/routes/client-only/index.tsx" ||
    (url.pathname === "/@vite/lazy" &&
      !!url.searchParams.get("id")?.includes("/src/routes/client-only/index.tsx?"));
  await page.route(isInitialRoute, async route => {
    requested.resolve();
    await release.promise;
    await route.continue();
  });

  try {
    await page.goto("/client-only", { waitUntil: "commit" });
    await requested.promise;
    await page.getByRole("link", { name: "Basic", exact: true }).click();
    await expect(page.locator("#counter-output")).toHaveText("0");
    const loaded = page.waitForResponse(response => isInitialRoute(new URL(response.url())));
    release.resolve();
    await (await loaded).finished();

    await page.locator("#counter-button").click();
    await expect(page.locator("#counter-output")).toHaveText("1");
    await expect(page.locator("#app > ul")).toHaveCount(1);
    await expect(page.locator("#app > main")).toHaveCount(1);
    expect(errors).toEqual([]);
  } finally {
    release.resolve();
  }
});

for (const scenario of [
  { name: "pathname", from: "/client-only", to: "/", hydrate: false },
  {
    name: "streaming pathname",
    from: "/hydration-navigation?value=server",
    to: "/",
    hydrate: false,
  },
  {
    name: "streaming query string",
    from: "/hydration-navigation?value=server",
    to: "/hydration-navigation?value=client",
    hydrate: false,
  },
  {
    name: "hash-only",
    from: "/hydration-navigation?value=server",
    to: "/hydration-navigation?value=server#details",
    hydrate: true,
  },
]) {
  test(`handles a ${scenario.name} change before hydration`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });

    let initialNav: ElementHandle<SVGElement | HTMLElement> | null = null;
    await page.route(/\/entry-client(?:-[^/]+)?\.(?:tsx|js)(?:\?|$)/, async route => {
      // Pin the race before hydration instead of sweeping machine-dependent delays.
      initialNav = await page.locator("#app > ul").elementHandle();
      await page.evaluate(to => history.pushState({}, "", to), scenario.to);
      await route.continue();
    });

    // Waiting for load also lets the original response finish streaming.
    await page.goto(scenario.from);
    await expect(page).toHaveURL(new URL(scenario.to, page.url()).href);
    if (scenario.to === "/") {
      await expect(page.locator("#counter-output")).toHaveText("0");
      await page.locator("#counter-button").click();
      await expect(page.locator("#counter-output")).toHaveText("1");
      await expect(page.locator("#hydration-navigation-value")).toHaveCount(0);
    } else {
      await expect(page.locator("#hydration-navigation-value")).toHaveText(
        scenario.hydrate ? "server" : "client",
      );
      await page.locator("#hydration-navigation-counter").click();
      await expect(page.locator("#hydration-navigation-counter")).toHaveText("1");
    }

    await expect(page.locator("#app > ul")).toHaveCount(1);
    await expect(page.locator("#app > main")).toHaveCount(1);
    expect(initialNav).not.toBeNull();
    expect(await initialNav!.evaluate(node => node.isConnected)).toBe(scenario.hydrate);
    expect(errors).toEqual([]);
  });
}
