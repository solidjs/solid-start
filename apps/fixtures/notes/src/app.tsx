import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import EditButton from "~/components/EditButton";
import NoteList from "~/components/NoteList";
import { getNotes } from "~/lib/api";
import "./app.css";
import SearchField from "./components/SearchField";

export default function App() {
  return (
    <Router
      rootPreload={({ location }) => getNotes(String(location.query.searchText || ""))}
      root={props => (
        <div class="main">
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
              <Loading fallback="Loading Notes..">
                <NoteList searchText={String(props.location.query.searchText || "")} />
              </Loading>
            </nav>
          </section>
          <section class="col note-viewer">
            <Loading fallback="Loading Content">{props.children}</Loading>
          </section>
        </div>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
