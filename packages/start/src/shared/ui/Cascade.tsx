import {
  Select as BaseSelect,
  SelectOption as BaseSelectOption,
} from "terracotta";

import "./Cascade.css";

export const Cascade: typeof BaseSelect = (props) => (
  <BaseSelect data-start-cascade {...props} />
);
export const CascadeOption: typeof BaseSelectOption = (props) => (
  <BaseSelectOption data-start-cascade-option {...props} />
);
