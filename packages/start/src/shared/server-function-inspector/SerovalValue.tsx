import { Text } from "../ui/Text.tsx";
import './SerovalValue.css';

interface SerovalValueProps {
  value: string | number | boolean | undefined | null;
}

export function SerovalValue(props: SerovalValueProps) {
  return (
    <Text data-start-seroval-value options={{ size: 'xs', weight: 'semibold', wrap: 'nowrap' }}>
      {`${props.value}`}
    </Text>
  );
}

export function PropertySeparator() {
  return <Text options={{ size: 'xs', weight: 'semibold', wrap: 'nowrap' }}>:</Text>;
}
