import { Properties } from "../ui/Properties.tsx";
import { Text } from "../ui/Text.tsx";

import './HeadersViewer.css';

interface HeadersViewerProps {
  headers: Headers;
}

export function HeadersViewer(props: HeadersViewerProps) {
  return (
    <div data-start-headers-viewer>
      <Properties
        entries={Array.from(props.headers.entries())}
        renderKey={(key) => <Text options={{ size: 'xs', weight: 'semibold', wrap: 'nowrap' }}>{key}:</Text>}
        renderValue = {(value) => <Text options={{ size: 'xs', wrap: 'nowrap' }}>{value}</Text>}
      />
    </div >
  );
}