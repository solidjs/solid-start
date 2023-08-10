"use client";
import { debounce } from "@solid-primitives/scheduled";
import { createSignal } from "solid-js";
import { useLocation, useNavigate } from "solid-start";
import styles from "./SearchBox.module.scss";

export function SearchBox(props) {
  const [value, setValue] = createSignal(props.value || "");
  const navigate = useNavigate();
  const location = useLocation();

  const update = (newValue: string) => {
    if (newValue.length && newValue !== value()) {
      setValue(newValue);
      navigate(`${location.pathname}?q=${newValue}`);
    }
  };

  const debouncedUpdate = debounce(update, 500);

  const goBack = () => {
    // !TODO
  };

  return (
    <>
      <div class={styles.form}>
        <form autocomplete="off" onSubmit={e => e.preventDefault()}>
          <label class="visuallyhidden" for="q">
            Search
          </label>

          <div class={styles.field}>
            <input
              id="q"
              name="q"
              type="text"
              placeholder="Search for a movie, tv show or person..."
              // keyup="goToRoute"
              // blur="unFocus"
              onInput={e => debouncedUpdate(e.currentTarget.value)}
              onKeyUp={e => {
                e.preventDefault();
                if (e.key === "Enter") {
                  debouncedUpdate.clear();
                  update(e.currentTarget.value);
                }
              }}
              value={value()}
            />
            <button v-if="showButton" type="button" aria-label="Close" onClick={goBack}>
              {/* <CrossIcon /> */}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
