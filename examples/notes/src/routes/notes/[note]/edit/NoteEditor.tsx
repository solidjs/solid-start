"use client";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSignal, startTransition, useTransition } from "solid-js";
import { createServerAction$, redirect } from "solid-start/server";
import { NotePreview } from "../NotePreview";

export function NoteEditor(props: { noteId: string; initialTitle: string; initialBody: string }) {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [body, setBody] = createSignal(props.initialBody);
  const [isNavigating, startNavigating] = useTransition();
  const [isSaving, saveNote] = createServerAction$(async (form: FormData, { env }) => {
    let { noteId, title, body } = Object.fromEntries(form.entries()) as any;
    if (noteId.length > 0) {
      await env.DO.get(env.DO.idFromName("notes")).fetch(
        `https://notes/update?id=${encodeURIComponent(noteId)}`,
        {
          body: JSON.stringify({
            title,
            body,
            updated_at: new Date().toISOString()
          }),
          method: "POST"
        }
      );
      return redirect("/notes/" + noteId);
    } else {
      let id = `note_${Math.round(Math.random() * 100000)}`;
      await env.DO.get(env.DO.idFromName("notes")).fetch(
        `https://notes/update?id=${encodeURIComponent(id)}`,
        {
          body: JSON.stringify({
            title,
            body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }),
          method: "POST"
        }
      );
      return redirect("/notes/" + id);
    }
  });

  const [, deleteNote] = createServerAction$(async ({ noteId }: { noteId: string }, { env }) => {
    if (noteId !== null) {
      await env.DO.get(env.DO.idFromName("notes")).fetch(`http://notes/delete?id=${noteId}`);
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
            <button
              class="note-editor-delete"
              // disabled={isDeletsing || isNavigating}
              onClick={() =>
                startTransition(() =>
                  deleteNote({
                    noteId: props.noteId
                  })
                )
              }
              role="menuitem"
            >
              <img src="/cross.svg" width="10px" height="10px" alt="" role="presentation" />
              Delete
            </button>
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
