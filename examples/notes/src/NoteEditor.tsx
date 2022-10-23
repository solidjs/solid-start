/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSignal, startTransition, useTransition } from "solid-js";
import { createServerAction$, redirect } from "solid-start/server";
import NotePreview from "./NotePreview";

export default function NoteEditor(props) {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [body, setBody] = createSignal(props.initialBody);
  const [isNavigating, startNavigating] = useTransition();
  const [isSaving, saveNote] = createServerAction$(
    async ({ noteId, body, title }: { noteId: string; body: string; title: string }, { env }) => {
      if (noteId !== null) {
        let n = {};
        n.title = title;
        n.body = body;
        n.updated_at = new Date().toISOString();
        await env.DO.get(env.DO.idFromName("notes")).fetch(
          `https://notes/update?id=${encodeURIComponent(noteId)}`,
          {
            body: JSON.stringify(n),
            method: "POST"
          }
        );
        return redirect("/?selectedId=" + noteId);
      } else {
        let n = {
          title,
          body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        let id = `note_${Math.round(Math.random() * 100000)}`;
        await env.DO.get(env.DO.idFromName("notes")).fetch(
          `https://notes/update?id=${encodeURIComponent(id)}`,
          {
            body: JSON.stringify(n),
            method: "POST"
          }
        );
        return redirect("/?selectedId=" + id);
      }
    }
  );
  const [, deleteNote] = createServerAction$(async ({ noteId }: { noteId: string }, { env }) => {
    if (noteId !== null) {
      await env.DO.get(env.DO.idFromName("notes")).fetch(`http://notes/delete?id=${noteId}`);
      return redirect("/");
    }
  });
  // const [isSaving, saveNote] = useMutation({
  //   endpoint: noteId !== null ? `/notes/${noteId}` : `/notes`,
  //   method: noteId !== null ? "PUT" : "POST"
  // });
  // const [isDeleting, deleteNote] = useMutation({
  //   endpoint: `/notes/${noteId}`,
  //   method: "DELETE"
  // });

  // async function handleSave() {
  //   const payload = { title, body };
  //   const requestedLocation = {
  //     selectedId: noteId,
  //     isEditing: false,
  //     searchText: location.searchText
  //   };
  //   const response = await saveNote(payload, requestedLocation);
  //   navigate(response);
  // }

  // async function handleDelete() {
  //   const payload = {};
  //   const requestedLocation = {
  //     selectedId: null,
  //     isEditing: false,
  //     searchText: location.searchText
  //   };
  //   const response = await deleteNote(payload, requestedLocation);
  //   navigate(response);
  // }

  // function navigate(response) {
  //   const cacheKey = response.headers.get("X-Location");
  //   const nextLocation = JSON.parse(cacheKey);
  //   const seededResponse = createFromReadableStream(response.body);
  //   startNavigating(() => {
  //     refresh(cacheKey, seededResponse);
  //     setLocation(nextLocation);
  //   });
  // }

  const isDraft = props.noteId === null;
  const isDeleting = false;
  return (
    <div class="note-editor">
      <form class="note-editor-form" autoComplete="off" onSubmit={e => e.preventDefault()}>
        <label class="offscreen" for="note-title-input">
          Enter a title for your note
        </label>
        <input
          id="note-title-input"
          type="text"
          value={title()}
          onInput={e => {
            setTitle(e.target.value);
          }}
        />
        <label class="offscreen" for="note-body-input">
          Enter the body for your note
        </label>
        <textarea
          id="note-body-input"
          value={body()}
          onInput={e => {
            setBody(e.target.value);
          }}
        />
      </form>
      <div class="note-editor-preview">
        <div class="note-editor-menu" role="menubar">
          <button
            class="note-editor-done"
            disabled={isSaving.pending || isNavigating()}
            onClick={() =>
              saveNote({
                noteId: props.noteId,
                body: body(),
                title: title()
              })
            }
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

// function useMutation({ endpoint, method }) {
//   const [isSaving, setIsSaving] = useState(false);
//   const [didError, setDidError] = useState(false);
//   const [error, setError] = useState(null);
//   if (didError) {
//     // Let the nearest error boundary handle errors while saving.
//     throw error;
//   }

//   async function performMutation(payload, requestedLocation) {
//     setIsSaving(true);
//     try {
//       const response = await fetch(
//         `${endpoint}?location=${encodeURIComponent(JSON.stringify(requestedLocation))}`,
//         {
//           method,
//           body: JSON.stringify(payload),
//           headers: {
//             "Content-Type": "application/json"
//           }
//         }
//       );
//       if (!response.ok) {
//         throw new Error(await response.text());
//       }
//       return response;
//     } catch (e) {
//       setDidError(true);
//       setError(e);
//     } finally {
//       setIsSaving(false);
//     }
//   }

//   return [isSaving, performMutation];
// }
