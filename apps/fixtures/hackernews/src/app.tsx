import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import "./app.css";
import Nav from "./components/nav";

export default function App() {
  return (
    <Router
      root={props => (
        <>
          <Nav />
          <Loading fallback={<div class="news-list-nav">Loading...</div>}>
            {props.children}
          </Loading>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
