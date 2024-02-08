import { useSearchParams } from "@solidjs/router";
import { useTransition } from "solid-js";

import Spinner from "./Spinner";

export default function SearchField() {
  const [isSearching] = useTransition();
  const [search, setParams] = useSearchParams();
  return (
    <form class="search" role="search" onSubmit={e => e.preventDefault()}>
      <label class="offscreen" for="sidebar-search-input">
        Search for a note by title
      </label>
      <input
        id="sidebar-search-input"
        placeholder="Search"
        value={search.searchText || ""}
        onInput={e => {
          setParams({
            searchText: e.target.value
          });
        }}
      />
      <Spinner active={isSearching()} />
    </form>
  );
}
