import { For } from "solid-js";
import { A } from "solid-start";
import { Card } from "./Card";

export function ListingCarousel(props) {
  return (
    <div class="listing listing--carousel">
      <div class="listing__head">
        <h2 class="listing__title">{props.title}</h2>

        <A href={props.viewAllHref} class="listing__explore">
          <strong>Explore All</strong>
        </A>
      </div>

      <div class="carousel">
        <button
          class="carousel__nav carousel__nav--left"
          aria-label="Previous"
          type="button"
          // disabled="disableLeftButton"
          // click="moveToClickEvent('left')"
        >
          {/* <ChevronLeftIcon /> */}
        </button>

        <div class="carousel__items">
          <For each={props.items}>{item => <Card item={item} />}</For>

          <div class="card">
            <A href={props.viewAllHref} class="card__link">
              <div class="card__img">
                <span>Explore All</span>
              </div>
            </A>
          </div>
        </div>

        <button
          class="carousel__nav carousel__nav--right"
          aria-label="Next"
          type="button"
          // disabled="disableRightButton"
          // click="moveToClickEvent('right')"
        >
          {/* <ChevronRightIcon /> */}
        </button>
      </div>
    </div>
  );
}
