import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import ChevronLeftIcon from "~icons/icons/chevron-left.svg?inline";
import ChevronRightIcon from "~icons/icons/chevron-right.svg?inline";
import { Card } from "./Card";

export function ListingCarousel(props) {
  const [carouselRef, setCarouselRef] = createSignal<HTMLElement>();

  const [state, setState] = createStore({
    elementWidth: 0,
    carouselWidth: 0,
    visibleWidth: 0,
    maximumPosition: 0,
    unusableVisibleWidth: 0,
    disableLeftButton: true,
    disableRightButton: false
  });

  const calculateState = numberOfItems => {
    let unusableVisibleWidth = 72;
    const elementWidth = carouselRef().firstElementChild?.getBoundingClientRect().width;
    const carouselWidth = numberOfItems * elementWidth;
    const maximumPosition = carouselRef().scrollWidth;

    if (window.innerWidth >= 1200) {
      unusableVisibleWidth = 92;
    }

    const visibleWidth = carouselRef().offsetWidth - unusableVisibleWidth;

    setState({
      unusableVisibleWidth,
      maximumPosition,
      carouselWidth,
      disableLeftButton: !carouselRef().scrollLeft,
      disableRightButton: visibleWidth >= carouselWidth,
      elementWidth,
      visibleWidth
    });
  };

  const moveTo = width => {
    carouselRef().scrollTo({
      left: width,
      behavior: "smooth"
    });
  };

  const moveToClickEvent = direction => {
    const invisible =
      carouselRef().scrollLeft +
      (direction === "left" ? -state.visibleWidth + 1 : state.visibleWidth);
    const remainder = invisible - (invisible % state.elementWidth);

    moveTo(remainder);
  };

  const scrollEvent = () => {
    const scrollLeft = carouselRef().scrollLeft;
    const end = state.maximumPosition - state.visibleWidth - state.elementWidth;

    setState(prev => ({
      ...prev,
      disableLeftButton: 3 > scrollLeft,
      disableRightButton: scrollLeft > end
    }));
  };

  const resizeEvent = () => {
    const count = props.viewAllUrl ? props.items.length + 1 : props.items.length;
    calculateState(count);
  };
  onMount(() => {
    const count = props.viewAllHref ? props.items.length + 1 : props.items.length;
    calculateState(count);
    window.addEventListener("resize", resizeEvent);
  });

  onCleanup(() => {
    window.removeEventListener("resize", resizeEvent);
  });

  return (
    <Show when={!!props.items?.length}>
      <div class="listing listing--carousel">
        <Show when={props.title || props.viewAllHref}>
          <div class="listing__head">
            <Show when={props.title}>
              <h2 class="listing__title">{props.title}</h2>
            </Show>

            <Show when={props.viewAllHref}>
              <a href={props.viewAllHref} class="listing__explore">
                <strong>Explore All</strong>
              </a>
            </Show>
          </div>
        </Show>

        <div class="carousel">
          <button
            class="carousel__nav carousel__nav--left"
            aria-label="Previous"
            type="button"
            disabled={state.disableLeftButton}
            onClick={() => moveToClickEvent("left")}
          >
            <ChevronLeftIcon />
          </button>

          <div ref={setCarouselRef} class="carousel__items" onScroll={scrollEvent}>
            <For each={props.items}>{item => <Card item={item} />}</For>

            <div class="card">
              <a href={props.viewAllHref} class="card__link card__viewAll">
                <div class="card__img">
                  <span>Explore All</span>
                </div>
              </a>
            </div>
          </div>

          <button
            class="carousel__nav carousel__nav--right"
            aria-label="Next"
            type="button"
            disabled={state.disableRightButton}
            onClick={() => moveToClickEvent("right")}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </Show>
  );
}

export default ListingCarousel;
