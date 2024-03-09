import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import EditButton from "~/components/EditButton";
import NoteList from "~/components/NoteList";
import { getNotes } from "~/lib/api";
import "./app.css";
import SearchField from "./components/SearchField";

export default function App() {
  return (
    <Router
      root={props => (
        <div class="main" $ServerOnly>
          <section class="col sidebar">
            <section class="sidebar-header">
              <a href="/">
                <img
                  class="logo"
                  src="/logo.svg"
                  width="22px"
                  height="20px"
                  alt=""
                  role="presentation"
                />
              </a>
              <strong>Solid Notes</strong>
            </section>
            <section class="sidebar-menu" role="menubar">
              <SearchField />
              <EditButton>New</EditButton>
            </section>
            <nav>
              <Suspense fallback="Loading Notes..">
                <NoteList searchText={props.location.query.searchText || ""} />
              </Suspense>
            </nav>
          </section>
          <section class="col note-viewer">
            <Suspense fallback="Loading Content">{props.children}</Suspense>
          </section>
        </div>
      )}
      rootLoad={({ location }) => getNotes(location.query.searchText || "")}
    >
      <FileRoutes />
    </Router>
  );
}
