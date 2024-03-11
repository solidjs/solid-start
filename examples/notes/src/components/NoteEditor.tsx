/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSubmission } from "@solidjs/router";
import { marked } from "marked";
import { createSignal } from "solid-js";
import { deleteNote, saveNote } from "~/lib/api";

export default function NoteEditor(props: {
  noteId?: number;
  initialTitle: string;
  initialBody: string;
}) {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [body, setBody] = createSignal(props.initialBody);
  const isSaving = useSubmission(saveNote);
  const isDeleting = useSubmission(deleteNote);
  const isDraft = props.noteId == null;

  return (
    <div class="note-editor">
      <form
        action={saveNote.with(props.noteId)}
        method="post"
        class="note-editor-form"
        id="note-editor"
        autocomplete="off"
      >
        <label class="offscreen" for="note-title-input">
          Enter a title for your note
        </label>
        <input
          id="note-title-input"
          type="text"
          name="title"
          placeholder="Title"
          required={true}
          value={title()}
          onInput={e => {
            setTitle(e.currentTarget.value);
          }}
        />
        <label class="offscreen" for="note-body-input">
          Enter the body for your note
        </label>
        <textarea
          name="body"
          id="note-body-input"
          textContent={body()}
          onInput={e => {
            setBody(e.currentTarget.value);
          }}
        />
      </form>
      <div class="note-editor-preview">
        <div class="note-editor-menu" role="menubar">
          <button
            class="note-editor-done"
            disabled={isSaving.pending}
            type="submit"
            form="note-editor"
            role="menuitem"
          >
            <img src="/checkmark.svg" width="14px" height="10px" alt="" role="presentation" />
            Done
          </button>
          {!isDraft && (
            <form action={deleteNote.with(props.noteId!)} method="post">
              <button
                name="noteId"
                class="note-editor-delete"
                disabled={isDeleting.pending}
                type="submit"
                role="menuitem"
              >
                <img src="/cross.svg" width="10px" height="10px" alt="" role="presentation" />
                Delete
              </button>
            </form>
          )}
        </div>
        <div class="label label--preview" role="status">
          Preview
        </div>
        <h1 class="note-title">{title()}</h1>
        <div class="note-preview">
          <div class="text-with-markdown" innerHTML={body() ? marked(body()) : ""} />
        </div>
      </div>
    </div>
  );
}
