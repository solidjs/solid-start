import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router root={props => <Loading>{props.children}</Loading>}>
      <FileRoutes />
    </Router>
  );
}
