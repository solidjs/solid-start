import type { ComponentProps, JSX } from 'solid-js';

import './Table.css';

type TableProps = ComponentProps<'div'>;

export function Table(props: TableProps): JSX.Element {
  return (
    <div data-start-table {...props} />
  );
}

type TableHeaderProps = ComponentProps<'div'>;

export function TableHeader(props: TableHeaderProps): JSX.Element {
  return (
    <div data-start-table-header {...props} />
  );
}

type TableRowProps = ComponentProps<'div'>;

export function TableRow(props: TableRowProps): JSX.Element {
  return (
    <div data-start-table-row  {...props} />
  );
}

type TableCellProps = ComponentProps<'div'>;

export function TableCell(props: TableCellProps): JSX.Element {
  return (
    <div data-start-table-cell {...props} />
  );
}
