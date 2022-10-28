"use client";

import { createContext, createSignal, Signal, useContext } from "solid-js";
export const context = createContext<Signal<boolean>>();

export const Provider = props => {
  const signal = createSignal(true);
  return (
    <context.Provider value={signal}>
      <div class={signal[0]() ? "dark" : "light"}>{props.children}</div>
    </context.Provider>
  );
};

export const DarkModeToggle = props => {
  const [darkMode, setDarkMode] = useContext(context);
  return (
    <button
      class="dark-mode-toggle"
      onClick={() => setDarkMode(!darkMode())}
      style={{
        "background-color": darkMode() ? "var(--gray-20)" : "var(--gray-80)",
        color: darkMode() ? "white" : "black",
        "padding-top": "6px"
      }}
    >
      {darkMode() ? "☀️" : "🌙"}
    </button>
  );
};
