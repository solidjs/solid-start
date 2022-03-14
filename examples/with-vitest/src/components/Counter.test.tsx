import { describe, expect, test } from 'vitest'
import { render, fireEvent } from 'solid-testing-library'
import Counter from './Counter';

describe('<Counter />', () => {
  test('renders', () => {
    const { container, unmount } = render(() => <Counter />);
    expect(container).toMatchSnapshot();
    unmount();
  });

  test('increments value', async () => {
    const { queryByRole, unmount } = render(() => <Counter />);
    const button = (await queryByRole('button')) as HTMLButtonElement;
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/Clicks: 0/);
    fireEvent.click(button);
    expect(button).toHaveTextContent(/Clicks: 1/);
  });
});
