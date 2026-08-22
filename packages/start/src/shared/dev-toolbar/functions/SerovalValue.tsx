import { Text } from "../../ui/Text.tsx";
import "./SerovalValue.css";

interface SerovalValueProps {
  value: string | number | boolean | undefined | null;
  kind?: "key" | "string" | "number" | "keyword";
}

export function SerovalValue(props: SerovalValueProps) {
  return (
    <Text
      data-start-seroval-value={props.kind ?? "plain"}
      options={{ size: "xs", weight: "semibold", font: "mono", wrap: "nowrap" }}
    >
      {`${props.value}`}
    </Text>
  );
}

export function PropertySeparator() {
  return (
    <Text data-start-seroval-separator options={{ size: "xs", weight: "semibold", wrap: "nowrap" }}>
      :
    </Text>
  );
}
