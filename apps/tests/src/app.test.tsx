import { describe } from "vitest";

// const serverLogs: any[] = [];
// const originalConsoleLog = console.log;

/**
 * @debt This test is comment out because of an issue with testing-library `render()` and
 * vinxi/routes magical export for fileRoutes inside `@solidjs/start` package.
 */

describe.skip("<App />", () => {
  // beforeEach(() => {
  //   serverLogs.length = 0;
  //   console.log = (...args: any[]) => {
  //     serverLogs.push(args);
  //     originalConsoleLog(...args);
  //   };
  // });
  // afterEach(() => {
  //   console.log = originalConsoleLog;
  // });
  // it("increments value", async () => {
  //   render(() => <App />);
  //   expect(serverLogs).toContainEqual(["Server Function", true]);
  //   expect(serverLogs).toContainEqual(["App Component", true]);
  // });
});
