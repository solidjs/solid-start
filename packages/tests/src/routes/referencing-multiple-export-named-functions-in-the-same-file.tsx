export function TextRenderTestComponent() {
  return <>(´｡• ᵕ •｡`) ♡</>;
}

export function VariableImportTestComponent() {
  return <>{testObjectExport.stringValue}</>;
}

export const testStringExport = "♡(˃͈ દ ˂͈ ༶ )";

export const testObjectExport = {
  stringValue: testStringExport,
};

export default function () {
  return <>
    <TextRenderTestComponent/>
    <VariableImportTestComponent/>
  </>;
}
