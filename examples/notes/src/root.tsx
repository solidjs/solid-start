// @refresh reload
import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title
} from "solid-start";
import { EditButton } from "~/components/EditButton";
import { NoteList } from "~/routes/NoteList";
import { DarkModeToggle, Provider } from "./components/DarkModeContext";
import "./env";
import "./root.css";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - Bare</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
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
                  <Routes>
                    <FileRoutes />
                  </Routes>
                </section>
                {/* <section key={selectedId} class="col note-viewer">
        <Suspense fallback={<NoteSkeleton isEditing={isEditing} />}>
          <Note selectedId={selectedId} isEditing={isEditing} />
        </Suspense>
      </section> */}
              </div>
            </Provider>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
