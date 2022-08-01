import { fireEvent, render } from "solid-testing-library";
import { describe, it } from "vitest";
import Counter from "./Counter";

describe("<Counter />", () => {
  it("increments value", async ({ expect }) => {
    const { queryByRole, unmount } = render(() => <Counter />);
    const button = (await queryByRole("button")) as HTMLButtonElement;
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/Clicks: 0/);
    fireEvent.click(button);
    expect(button).toHaveTextContent(/Clicks: 1/);
    unmount();
  });

  it("renders 1", ({ expect }) => {
    expect.extend({})
    console.log(expect);
    const { container, unmount } = render(() => <Counter />);
    console.log(container, unmount);
    expect(container).toMatchSnapshot();
    unmount();
  });
});
