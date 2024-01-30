/// <reference types="vinxi/types/server" />
// import { provideRequestEvent } from "solid-js/web/storage";
import { eventHandler } from "vinxi/server";
import { getFetchEvent } from "../server/fetchEvent";

export default eventHandler((event) => {
  const fetchEvent = getFetchEvent(event);
  console.log(fetchEvent);
  // if (fetchEvent) {
  //   provideRequestEvent(fetchEvent, () => {});
  // }
  return "Hello World!"
});