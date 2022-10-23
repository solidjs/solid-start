// import Note from './Note.server';
// import NoteList from './NoteList.server';
// import EditButton from './EditButton.client';
// import SearchField from "./SearchField.island";
// import NoteSkeleton from './NoteSkeleton';
// import NoteListSkeleton from './NoteListSkeleton';

import { unstable_island, useSearchParams } from "solid-start";
import Note from "../Note";
import { NoteList } from "../NoteList";
import "./index.css";
const EditButton = unstable_island(() => import("../EditButton"));
export default function Home() {
  const [searchParams] = useSearchParams();
  return (
    <div class="main">
      <section class="col sidebar">
        <section class="sidebar-header">
          <img class="logo" src="/logo.svg" width="22px" height="20px" alt="" role="presentation" />
          <strong>Solid Notes</strong>
        </section>
        <section class="sidebar-menu" role="menubar">
          {/* <SearchField /> */}
          <EditButton noteId={null}>New</EditButton>
        </section>
        <nav>
          {/* <Suspense fallback={<NoteListSkeleton />}> */}
          <NoteList searchText={""} />
          {/* </Suspense> */}
        </nav>
      </section>
      <section class="col note-viewer">
        <Note selectedId={searchParams.selectedId} isEditing={searchParams.isEditing} />
      </section>
      {/* <section key={selectedId} class="col note-viewer">
        <Suspense fallback={<NoteSkeleton isEditing={isEditing} />}>
          <Note selectedId={selectedId} isEditing={isEditing} />
        </Suspense>
      </section> */}
    </div>
  );
}
