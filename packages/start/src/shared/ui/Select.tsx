import {
	Select as BaseSelect,
	SelectOption as BaseSelectOption,
} from "terracotta";

import "./Select.css";

export const Select: typeof BaseSelect = (props) => (
	<BaseSelect data-start-select {...props} />
);
export const SelectOption: typeof BaseSelectOption = (props) => (
	<BaseSelectOption data-start-select-option {...props} />
);
