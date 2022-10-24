/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { format } from "date-fns";
import { Show, Suspense } from "solid-js";
import { unstable_island } from "solid-start";
import { createServerData$ } from "solid-start/server";
const NoteEditor = unstable_island(() => import("./NoteEditor"));
const EditButton = unstable_island(() => import("./EditButton"));

import NotePreview from "./NotePreview";
//  import EditButton from './EditButton.client';
//  import NoteEditor from './NoteEditor.client';

export default function Note(props) {
  const note = createServerData$(
    async ([selectedId], { env }) => {
      const db = env.DO.get(env.DO.idFromName("notes"));
      const data = await (
        await db.fetch(`http://notes/get?id=${selectedId}`)
      ).json<{ error?: string; id: string; body: string; title: string; updated_at: string }>();

      if (data.error) {
        return null;
      }

      return data;
    },
    {
      key: () => [props.selectedId]
    }
  );

  return (
    <Suspense fallback={<div>Waiting</div>}>
      <Show
        when={note()}
        fallback={
          <Show
            when={props.isEditing}
            fallback={
              <div class="note--empty-state">
                <span class="note-text--empty-state">
                  Click a note on the left to view something! 🥺
                </span>
              </div>
            }
          >
            <NoteEditor noteId={null} initialTitle="Untitled" initialBody="" />
          </Show>
        }
        keyed
      >
        {note => (
          <Show
            when={!props.isEditing}
            fallback={
              <NoteEditor noteId={note.id} initialTitle={note.title} initialBody={note.body} />
            }
          >
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
          </Show>
        )}
      </Show>
    </Suspense>
  );
}
