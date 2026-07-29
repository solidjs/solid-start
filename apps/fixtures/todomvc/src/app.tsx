import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import "./app.css";

const Router = createRouter({ routes: fileRoutes });

export default function App() {
  return <Router>{props => <Loading>{props.children}</Loading>}</Router>;
}
