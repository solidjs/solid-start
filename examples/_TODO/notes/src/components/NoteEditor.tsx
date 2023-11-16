"use client";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSignal, useTransition } from "solid-js";
import { createServerAction$, redirect } from "solid-start/server";
import { NotePreview } from "../routes/(layout)/notes/[note]/NotePreview";

export function NoteEditor(props: { noteId: string; initialTitle: string; initialBody: string }) {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [body, setBody] = createSignal(props.initialBody);
  const [isNavigating, startNavigating] = useTransition();
  const [isSaving, saveNote] = createServerAction$(async (form: FormData, { fetch, env }) => {
    let { noteId, title, body } = Object.fromEntries(form.entries()) as any;
    if (noteId.length > 0) {
      await env.notes.update(noteId, title, body);
      return redirect("/notes/" + noteId);
    } else {
      let note = await env.notes.create(title, body);
      return redirect("/notes/" + note);
    }
  });

  const [, deleteNote] = createServerAction$(async (form: FormData, { env }) => {
    if (form.get("noteId") !== null) {
      await env.notes.delete(form.get("noteId") as string);
      return redirect("/");
    }
  });

  const isDraft = props.noteId === null;

  return (
    <div class="note-editor">
      <saveNote.Form class="note-editor-form" id="note-editor" autocomplete="off">
        <input type="hidden" name="noteId" value={props.noteId} />
        <label class="offscreen" for="note-title-input">
          Enter a title for your note
        </label>
        <input
          id="note-title-input"
          type="text"
          name="title"
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
          value={body()}
          onInput={e => {
            setBody(e.currentTarget.value);
          }}
        />
      </saveNote.Form>
      <div class="note-editor-preview">
        <div class="note-editor-menu" role="menubar">
          <button
            class="note-editor-done"
            disabled={isSaving.pending || isNavigating()}
            type="submit"
            form="note-editor"
            role="menuitem"
          >
            <img src="/checkmark.svg" width="14px" height="10px" alt="" role="presentation" />
            Done
          </button>
          {!isDraft && (
            <deleteNote.Form>
              <button
                name="noteId"
                value={props.noteId}
                class="note-editor-delete"
                // disabled={isDeletsing || isNavigating}
                type="submit"
                role="menuitem"
              >
                <img src="/cross.svg" width="10px" height="10px" alt="" role="presentation" />
                Delete
              </button>
            </deleteNote.Form>
          )}
        </div>
        <div class="label label--preview" role="status">
          Preview
        </div>
        <h1 class="note-title">{title()}</h1>
        <NotePreview title={title()} body={body()} />
      </div>
    </div>
  );
}
