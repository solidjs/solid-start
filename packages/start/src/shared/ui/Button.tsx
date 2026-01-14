import { Button as BaseButton } from "terracotta";
import "./Button.css";

const Button: typeof BaseButton = (props) => (
	<BaseButton type="button" data-start-button {...props} />
);

export default Button;
