import {
  Dialog as BaseDialog,
  DialogOverlay as BaseDialogOverlay,
  DialogPanel as BaseDialogPanel,
} from "terracotta";

import "./Dialog.css";

export const Dialog: typeof BaseDialog = (props) => (
  <BaseDialog data-start-dialog {...props} />
);
export const DialogOverlay: typeof BaseDialogOverlay = (props) => (
  <BaseDialogOverlay data-start-dialog-overlay {...props} />
);
export const DialogPanel: typeof BaseDialogPanel = (props) => (
  <BaseDialogPanel data-start-dialog-panel {...props} />
);
