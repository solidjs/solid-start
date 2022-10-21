import { createEffect, createSignal } from "solid-js";
import { useLocation, useNavigate } from "solid-start";

export default function Input(props) {
  const [value, setValue] = createSignal("");
  const navigate = useNavigate();
  const location = useLocation();
  createEffect(() => {
    console.log("value", value());
    if (value().length) {
      console.log(document.activeElement);
      navigate(`${location.pathname}?q=${value()}`);
    }
  });

  return (
    <>
      <label>{value()}</label>
      <div>{props.value}</div>
      <input value={value()} oninput={e => setValue(e.currentTarget.value)} />
    </>
  );
}
