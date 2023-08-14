import { useLocation as useBaseLocation, type Location } from "@solidjs/router";

function getLocation() {
  return window.router.location();
}

function useIslandsLocation() {
  return {
    get pathname() {
      let location = getLocation();
      return location.pathname;
    },
    get hash() {
      let location = getLocation();
      return location.hash;
    },
    get search() {
      let location = getLocation();
      return location.search;
    }
  } as Location;
}

export const useLocation =
  import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? useIslandsLocation
    : useBaseLocation;
