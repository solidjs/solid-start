// @ts-ignore
import App from "#start/app";
import "./mount";

function Dummy(props) {
  return props.children;
}

export function StartClient() {
  return (
    <Dummy>
      <Dummy>
        <App />
      </Dummy>
    </Dummy>
  );
}
