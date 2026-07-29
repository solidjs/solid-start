import { Button as BaseButton } from "terracotta/button";
import "./Button.css";

const Button: typeof BaseButton = props => (
  <BaseButton type="button" data-start-button {...props} />
);

export default Button;
