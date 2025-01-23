import { render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from "./App";

const serverLogs: any[] = [];
const originalConsoleLog = console.log;

describe("<App />", () => {
  beforeEach(() => {
    serverLogs.length = 0;
    console.log = (...args: any[]) => {
      serverLogs.push(args);
      originalConsoleLog(...args);
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it("increments value", async () => {
    render(() => <App />);
    
    expect(serverLogs).toContainEqual(["Server Function", true]);
    expect(serverLogs).toContainEqual(["App Component", true]);
  });
});
