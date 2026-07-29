import { Button as BaseButton } from "terracotta/button";
import "./IconButton.css";

const IconButton: typeof BaseButton = props => (
  <BaseButton type="button" data-start-icon-button {...props} />
);

export default IconButton;
