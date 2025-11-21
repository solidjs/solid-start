// Example component test
import { describe, it, expect, beforeEach } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { userEvent, page } from "vitest/browser";

import BasicRoute from "./(basic)";

describe("Browser UI: Basic Counter Component Interactivity", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should initialize to 0 and increment on click", async () => {
    const { baseElement } = render(() => <BasicRoute />);

    const counterElement = baseElement.querySelector("span#counter-output");

    expect(counterElement).toHaveTextContent("0");

    const incrementButton = baseElement.querySelector("button#counter-button");
    await userEvent.click(incrementButton!!);
    expect(counterElement).toHaveTextContent("1");
  });
});
