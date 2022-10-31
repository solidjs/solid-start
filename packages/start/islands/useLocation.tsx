import { useLocation as useBaseLocation } from "@solidjs/router";

function useIslandsLocation() {
  return {
    get pathname() {
      let location = window.LOCATION();
      return location.pathname;
    },
    get hash() {
      let location = window.LOCATION();
      return location.hash;
    },
    get search() {
      let location = window.LOCATION();
      return location.search;
    }
  } as Location;
}

export const useLocation =
  import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? useIslandsLocation
    : useBaseLocation;
