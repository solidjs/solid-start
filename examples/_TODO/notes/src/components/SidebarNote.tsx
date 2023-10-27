/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { format, isToday } from "date-fns";
import { Note } from "~/db";
import { SidebarNote as ClientSidebarNote } from "./SidebarNote.client";

export default function SidebarNote(props: { note: Note }) {
  const updatedAt = () => new Date(props.note.updated_at);
  const lastUpdatedAt = () =>
    isToday(updatedAt()) ? format(updatedAt(), "h:mm bb") : format(updatedAt(), "M/d/yy");

  return (
    <ClientSidebarNote
      id={props.note.id}
      title={props.note.title}
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
