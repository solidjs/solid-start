import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import "./app.css";
import Nav from "./components/nav";

const Router = createRouter({ routes: fileRoutes });

export default function App() {
  return (
    <Router>
      {props => (
        <>
          <Nav />
          <Loading fallback={<div class="news-list-nav">Loading...</div>}>
            {props.children}
          </Loading>
        </>
      )}
    </Router>
  );
}
