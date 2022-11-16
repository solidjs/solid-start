import { debounce } from "@solid-primitives/scheduled";
import { createEffect, createSignal, Match, on, onCleanup, onMount, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import ChevronLeftIcon from "~icons/icons/chevron-left.svg?inline";
import ChevronRightIcon from "~icons/icons/chevron-right.svg?inline";
import CrossIcon from "~icons/icons/cross.svg?inline";
import "./Modal.scss";

interface Props {
  data?: any[];
  type?: string;
  modifier?: string;
  nav?: boolean;
  startAt?: number;
  ariaLabel?: string;
  onClose: () => void;
}

export const Modal = props => {
  const [modalRef, setModalRef] = createSignal<HTMLElement>();

  const [state, setState] = createStore({
    selected: props.startAt ?? 0,
    activeItem: null,
    focusedElBeforeOpen: document.activeElement as HTMLElement,
    focusableEls: [],
    lastFocusableEl: undefined,
    firstFocusableEl: undefined
  });

  const handleForwardTab = e => {
    if (document.activeElement === state.lastFocusableEl) {
      e.preventDefault();
      state.firstFocusableEl.focus();
    }
  };
  const handleBackwardTab = e => {
    if (document.activeElement === state.firstFocusableEl) {
      e.preventDefault();
      state.lastFocusableEl.focus();
    }
  };

  const handleClose = () => {
    props.onClose();
  };

  const handleKeyDown = e => {
    if (e.keyCode === 27) {
      // esc key
      handleClose();
    } else if (props.nav && e.keyCode === 39) {
      // right arrow
      next();
    } else if (props.nav && e.keyCode === 37) {
      // left arrow
      previous();
    } else if (e.keyCode === 9) {
      // tab
      if (state.focusableEls.length === 1) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        handleBackwardTab(e);
      } else {
        handleForwardTab(e);
      }
    }
  };
  const handleIframeSize = () => {
    const aspectRatio = 16 / 9;
    const styles = getComputedStyle(modalRef());
    let maxWidth = modalRef().offsetWidth;
    let maxHeight = modalRef().offsetHeight;
    let width;
    let height;
    maxWidth -= parseFloat(styles.paddingRight) + parseFloat(styles.paddingLeft);
    maxHeight -= parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    width = maxWidth;
    height = maxHeight;
    if (maxHeight > maxWidth / aspectRatio) {
      height = maxWidth / aspectRatio;
    } else if (maxWidth > maxHeight * aspectRatio) {
      width = maxHeight * aspectRatio;
    }
    (modalRef().querySelector(".modal__iframe") as HTMLElement).style.width = `${width}px`;
    (modalRef().querySelector(".modal__iframe") as HTMLElement).style.height = `${height}px`;
  };

  createEffect(
    on(
      () => state.selected,
      () => {
        setState("activeItem", props.data[state.selected]);
      }
    )
  );

  onMount(() => {
    const availableFocusable = Array.from(
      modalRef().querySelectorAll(`
          a[href],
          area[href],
          input:not([disabled]),
          select:not([disabled]),
          textarea:not([disabled]),
          button:not([disabled]),
          [tabindex="0"]
        `)
    ) as HTMLElement[];
    const firstFocusableEl = availableFocusable[0];
    const lastFocusableEl = availableFocusable[availableFocusable.length - 1];
    setState(prev => ({
      ...prev,
      focusableEls: availableFocusable,
      firstFocusableEl,
      lastFocusableEl
    }));

    firstFocusableEl.focus();

    if (props.type === "iframe") {
      handleIframeSize();
      window.addEventListener("resize", () => {
        debounce(handleIframeSize, 600);
      });
    }
    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
    if (props.type === "iframe") {
      window.removeEventListener("resize", () => {
        debounce(handleIframeSize, 600);
      });
    }
    if (state.focusedElBeforeOpen) {
      state.focusedElBeforeOpen.focus();
    }
  });

  const showNav = () => props.nav && props.data.length > 1;

  const label = () => {
    if (props.ariaLabel) {
      return props.ariaLabel;
    } else if (state.activeItem?.name) {
      return state.activeItem.name;
    } else {
      return null;
    }
  };

  const isIFrame = () => props.type === "iframe" && state.activeItem;

  const isImage = () => props.type === "image" && state.activeItem?.file_path;

  const previous = () => {
    setState("selected", prev => (prev - 1 + props.data.length) % props.data.length);
  };
  const next = () => {
    setState("selected", prev => (prev + 1) % props.data.length);
  };
  return (
    <div
      ref={setModalRef}
      class={"modal"}
      classList={{
        "modal--nav": showNav(),
        [`modal--${props.type}`]: true,
        [props.modifier]: true
      }}
      tabIndex={-1}
      aria-hidden="false"
      aria-label={label()}
      role="dialog"
      onClick={handleClose}
    >
      <div class={"modal__wrap"}>
        <div class={"modal__body"} onClick={e => e.stopPropagation()}>
          <button
            class={"modal__close"}
            aria-label="Close"
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <CrossIcon />
          </button>

          <div class={`modal__${props.type}`}>
            <Switch>
              <Match when={isIFrame()}>
                <iframe
                  src={state.activeItem.src}
                  allow="autoplay; encrypted-media"
                  allowfullscreen
                />
              </Match>
              <Match when={isImage()}>
                <img src={`https://image.tmdb.org/t/p/original/${state.activeItem.file_path}`} />
              </Match>
            </Switch>
          </div>

          <div class={"modal__nav"}>
            <button
              class={"modal__arrow modal__arrow_prev"}
              aria-label="Previous"
              title="Previous"
              type="button"
              onClick={e => {
                e.stopPropagation();
                previous();
              }}
            >
              <ChevronLeftIcon />
            </button>
            <div class="modal__count">
              {state.selected + 1} / {props.data.length}
            </div>
            <button
              class={"modal__arrow modal__arrow_next"}
              aria-label="Next"
              title="Next"
              type="button"
              onClick={e => {
                e.stopPropagation();
                next();
              }}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
