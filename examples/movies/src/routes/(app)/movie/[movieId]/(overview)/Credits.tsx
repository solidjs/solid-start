import { For } from "solid-js";
import { CreditsItem } from "./CreditsItem";

export function Credits(props) {
  return (
    <div class="listing listing--carousel">
      <div class="listing__head">
        <h2 class="listing__title">Cast</h2>
      </div>

      <div class="carousel">
        <button
          class="carousel__nav carousel__nav--left"
          aria-label="Previous"
          type="button"
          disabled="disableLeftButton"
          click="moveToClickEvent('left')"
        >
          {/* <ChevronLeftIcon /> */}
        </button>

        <div ref="carouselElement" class="carousel__items" scroll="scrollEvent">
          <For each={props.people}>{person => <CreditsItem person={person} />}</For>
        </div>

        <button
          class="carousel__nav carousel__nav--right"
          aria-label="Next"
          type="button"
          disabled="disableRightButton"
          click="moveToClickEvent('right')"
        >
          {/* <ChevronRightIcon /> */}
        </button>
      </div>
    </div>
  );
}
