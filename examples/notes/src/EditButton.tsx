/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTransition } from "solid-js";
import { useLocation, useNavigate } from "solid-start";

export default function EditButton(props) {
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();
  const isDraft = props.noteId == null;
  const location = useLocation();
  return (
    <button
      class={["edit-button", isDraft ? "edit-button--solid" : "edit-button--outline"].join(" ")}
      disabled={isPending()}
      onClick={() => {
        // startTransition(() => {
        console.log(props);
        const sp = new URLSearchParams(location.search);
        sp.set("isEditing", "true");
        if (props.noteId) sp.set("selectedId", props.noteId);
        else sp.delete("selectedId");
        navigate(`/?${sp.toString()}`);
        // });
      }}
      role="menuitem"
    >
      {props.children}
    </button>
  );
}
