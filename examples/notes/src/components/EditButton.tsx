"use client";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { JSX } from "solid-js";
import { A } from "solid-start";

export function EditButton(props: { noteId: string; children: JSX.Element }) {
  const isDraft = props.noteId == null;
  return (
    <A
      href={props.noteId ? `/notes/${props.noteId}/edit` : `/new`}
      class={["edit-button", isDraft ? "edit-button--solid" : "edit-button--outline"].join(" ")}
      role="menuitem"
    >
      {props.children}
    </A>
  );
}
