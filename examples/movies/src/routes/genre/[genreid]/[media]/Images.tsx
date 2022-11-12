"use client";
import { batch, createResource, createSignal, For, onMount, Signal } from "solid-js";
import { createStore, produce, unwrap } from "solid-js/store";
import server$ from "solid-start/server";
import { Card } from "~/components/Card";
import { getMediaByGenre, MediaByGenre } from "~/services/tmdbAPI";
import "./Images.scss";

//get the media by genre on the server to avoid exposing the api key
const getMedia = server$(async (media, genreid, page) => {
  return await getMediaByGenre(media, genreid, page as number);
});

export function Images(props: { media: string; genreid: number; title: string }) {
  let page = 1;
  //create a resource to fetch the media by genre from the server function
  const [images, { refetch }] = createResource<MediaByGenre[]>(
    async (_, info) => {
      //if info.refetching is undefined it's the first fetch, we can just return empty
      if (!info.refetching) return [];
      //get the media passing the media, the genre and the page number stored in refetching
      const media = await getMedia(props.media, props.genreid, info.refetching);
      //return the results
      return media.results;
    },
    {
      initialValue: [],
      //assign this storage to the createResource. It expect a signal
      //but for performance reasonse we create a "fake" signal that uses a store
      //under the hood (thanks @davedbase)
      storage: <T extends MediaByGenre[]>(value: T): Signal<T> => {
        const [store, setStore] = createStore<MediaByGenre[]>(value);
        return [
          // this is the getter of the fake signal that just return the store
          //it's the same store that will end in the images variable
          () => store,
          //this is the setter for the fake signal
          (newValue: T) => {
            //we first unwrap the store to get the unreactive object
            const unwrapped = unwrap(store);
            //if the new value it's a value we simply assign it
            let toAssign = newValue;
            //if it's a function will call the new value passing the
            //unwrapped store
            if (typeof newValue === "function") {
              toAssign = (newValue as Function)(unwrapped);
            }
            //we can use procude to append elements to the old store
            setStore(produce((oldStore: MediaByGenre[]) => oldStore.push(...toAssign)));
          }
        ] as Signal<T>;
      }
    }
  );
  let intersectionDiv;
  onMount(() => {
    //onmount (only on the client) we create an intersection observer
    //and observe the intersection div (the one with Load More inside it)
    //whenever it comes into view we refetch incrementing the page number
    const observer = new IntersectionObserver(([reloadDiv]) => {
      if (reloadDiv?.isIntersecting) {
        refetch(page++);
      }
    });
    observer.observe(intersectionDiv as Element);
  });
  return (
    <div class="spacing">
      <div class="images__head">
        <h2 class="images__title">Genre: {props.title}</h2>
        <strong class="images__count"> {images()?.length} Images </strong>
      </div>
      <div class="images__items">
        <For each={images()}>{(image: MediaByGenre) => <Card item={image} />}</For>
      </div>
      <div class="load-more" ref={intersectionDiv}>
        <button
          disabled={images.loading}
          onClick={() => {
            refetch(page++);
          }}
        >
          Load more
        </button>
      </div>
    </div>
  );
}
