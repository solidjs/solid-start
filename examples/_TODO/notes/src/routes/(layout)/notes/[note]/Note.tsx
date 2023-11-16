/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { format } from "date-fns";
import { Show } from "solid-js";
import { EditButton } from "~/components/EditButton";
import { NotePreview } from "./NotePreview";

export function Note(props) {
  return (
    <Show when={props.note} keyed>
      {note => (
        <div class="note">
          <div class="note-header">
            <h1 class="note-title">{note.title}</h1>
            <div class="note-menu" role="menubar">
              <small class="note-updated-at" role="status">
                Last updated on {format(new Date(note.updated_at), "d MMM yyyy 'at' h:mm bb")}
              </small>
              <EditButton noteId={note.id}>Edit</EditButton>
            </div>
          </div>
          <NotePreview body={note.body} />
        </div>
      )}
    </Show>
  );
}
