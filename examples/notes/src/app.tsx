// @refresh reload
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import EditButton from "~/components/EditButton";
import NoteList from "~/components/NoteList";
import { getNotes } from "~/lib/api";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <div class="main" $ServerOnly>
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
              <EditButton>New</EditButton>
            </section>
            <nav>
              <NoteList searchText={""} />
            </nav>
          </section>
          <section class="col note-viewer"><Suspense fallback="Loading Content">{props.children}</Suspense></section>
        </div>
      )}
      rootLoad={() => getNotes()}
    >
      <FileRoutes />
    </Router>
  );
}
