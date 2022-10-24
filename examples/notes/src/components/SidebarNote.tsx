/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { format, isToday } from "date-fns";
import { unstable_island } from "solid-start";

const ClientSidebarNote = unstable_island(() => import("./SidebarNote.island"));

let i = 0;
export default function SidebarNote(props) {
  console.log("rendered", props.note);
  const updatedAt = () => new Date(props.note.updated_at);
  const lastUpdatedAt = () =>
    isToday(updatedAt()) ? format(updatedAt(), "h:mm bb") : format(updatedAt(), "M/d/yy");
  // const summary = createServerData$(
  //   async (note, { env }) => {
  //     console.log("called how many times", note, i++);
  //     console.log(note);

  //     const db = env.DO.get(env.DO.idFromName("notes"));
  //     const data = await (await db.fetch(`http://notes/get?id=${note.id}`)).json();
  //     console.log({ data });
  //     return data.body.slice(0, 120);
  //   },
  //   {
  //     key: () => props.note
  //   }
  // );
  return (
    <ClientSidebarNote
      id={props.note.id}
      children={
        <header class="sidebar-note-header">
          <strong>{props.note.title}</strong>
          <small>{lastUpdatedAt()}</small>
        </header>
      }
      expandedChildren={
        <p class="sidebar-note-excerpt" innerHTML={props.note.body || `<i>No content</i>`} />
      }
    />
  );
}
