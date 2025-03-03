import { router } from "./router";
import { RouterProvider } from "@tanstack/solid-router";

import "./app.css";

export default function App() {
  return <RouterProvider router={router} />;
}
