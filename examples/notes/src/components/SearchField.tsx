/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useSearchParams } from "@solidjs/router";
import { useTransition } from "solid-js";

export default function SearchField() {
  const [isSearching] = useTransition();
  const [search, setParams] = useSearchParams();
  return (
    <form class="search" role="search" onSubmit={e => e.preventDefault()} $ServerOnly>
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
      <div
        class={["spinner", isSearching() && "spinner--active"].join(" ")}
        role="progressbar"
        aria-busy={isSearching() ? "true" : "false"}
      />
    </form>
  );
}
