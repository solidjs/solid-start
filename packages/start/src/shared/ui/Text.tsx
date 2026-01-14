import { type ComponentProps, createMemo, type JSX, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import './Text.css';

export type TextProps<T extends keyof JSX.IntrinsicElements = 'span'> = ComponentProps<T> & {
  options?: {
    as?: T;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    font?: 'sans' | 'serif' | 'mono';
    weight?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    wrap?: 'wrap' | 'nowrap';
  };
};

export function Text<T extends keyof JSX.IntrinsicElements = 'span'>(props: TextProps<T>): JSX.Element {
  const [current, rest] = splitProps(props, ['options']);

  const customization = createMemo<TextProps<T>>(() => {
    const options = Object.assign({}, {
      size: 'base',
      font: 'mono',
      weight: 'normal',
      wrap: 'wrap',
    }, current.options);
    const entries = Object.entries(options);
    return Object.fromEntries(entries.map(([key, value]) => [`data-start-text-${key}`, value])) as TextProps<T>;
  });

  return (
    <Dynamic
      component={(current.options?.as || 'span') as T}
      {...rest}
      {...customization()}
    />
  );
}