// import Note from './Note.server';
// import NoteList from './NoteList.server';
// import EditButton from './EditButton.client';
// import SearchField from "./SearchField.island";
// import NoteSkeleton from './NoteSkeleton';
// import NoteListSkeleton from './NoteListSkeleton';

import { Outlet } from "solid-start";
import { EditButton } from "~/components/EditButton";
import { NoteList } from "~/routes/NoteList";
import { DarkModeToggle, Provider } from "../components/DarkModeContext";
import "./index.css";
export default function Home() {
  return (
    <Provider>
      <div class="main">
        <section class="col sidebar">
          <section class="sidebar-header">
            <img
              class="logo"
              src="/logo.svg"
              width="22px"
              height="20px"
              alt=""
              role="presentation"
            />
            <strong>Solid Notes</strong>
          </section>
          <section class="sidebar-menu" role="menubar">
            {/* <SearchField /> */}
            <EditButton noteId={null}>New</EditButton>
            <DarkModeToggle></DarkModeToggle>
          </section>
          <nav>
            {/* <Suspense fallback={<NoteListSkeleton />}> */}
            <NoteList searchText={""} />
            {/* </Suspense> */}
          </nav>
        </section>
        <section class="col note-viewer">
          <Outlet />
        </section>
        {/* <section key={selectedId} class="col note-viewer">
        <Suspense fallback={<NoteSkeleton isEditing={isEditing} />}>
          <Note selectedId={selectedId} isEditing={isEditing} />
        </Suspense>
      </section> */}
      </div>
    </Provider>
  );
}
