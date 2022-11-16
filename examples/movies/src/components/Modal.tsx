import { debounce } from "@solid-primitives/scheduled";
import { createEffect, createSignal, on, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
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

  const [selected, setSelected] = createSignal<number>(props.startAt ?? 0);
  const [activeItem, setActiveItem] = createSignal<any>();

  const [focusedElBeforeOpen, setFocusedElBeforeOpen] = createSignal<HTMLElement>(
    document.activeElement as HTMLElement
  );
  const [focusableEls, setFocusableEls] = createSignal<HTMLElement[]>();

  const [lastFocusableEl, setLastFocusableEl] = createSignal<HTMLElement>();
  const [firstFocusableEl, setFirstFocusableEl] = createSignal<HTMLElement>();

  const handleForwardTab = e => {
    if (document.activeElement === lastFocusableEl()) {
      e.preventDefault();
      firstFocusableEl().focus();
    }
  };
  const handleBackwardTab = e => {
    if (document.activeElement === firstFocusableEl()) {
      e.preventDefault();
      lastFocusableEl().focus();
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
      if (focusableEls().length === 1) {
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
    on(selected, () => {
      setActiveItem(props.data[selected()]);
    })
  );

  onMount(() => {
    setSelected(props.startAt);
    const data = Array.from(
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
    setFocusableEls(data);
    const firstFocusableEl = focusableEls()[0];
    const lastFocusableEl = focusableEls()[focusableEls().length - 1];
    setFirstFocusableEl(firstFocusableEl);
    setLastFocusableEl(lastFocusableEl);
    // focus on the first element
    firstFocusableEl.focus();
    // calculate iframe size for responsive sizing on resize
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
    if (focusedElBeforeOpen()) {
      focusedElBeforeOpen().focus();
    }
  });

  const showNav = () => props.nav && props.data.length > 1;

  const label = () => {
    if (props.ariaLabel) {
      return props.ariaLabel;
    } else if (activeItem()?.name) {
      return activeItem().name;
    } else {
      return null;
    }
  };

  const isIFrame = () => props.type === "iframe" && activeItem();

  const isImage = () => props.type === "image" && activeItem()?.src;

  const previous = () => {
    setSelected(prev => (prev - 1 + props.data.length) % props.data.length);
  };
  const next = () => {
    setSelected(prev => (prev + 1) % props.data.length);
  };
  return (
    <Portal>
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
              <Show when={isIFrame()}>
                <iframe src={activeItem().src} allow="autoplay; encrypted-media" allowfullscreen />
              </Show>
              <Show when={isImage()}>
                <img src={activeItem().src} />
              </Show>
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
                {selected() + 1} / {props.data.length}
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
    </Portal>
  );
};
