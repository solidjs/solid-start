import { For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Modal } from "~/components/Modal";
import "./Images.scss";

export default function ImagesSection(props) {
  const [state, setState] = createStore({
    modalVisible: false,
    modalStartAt: 0
  });

  const openModal = index => {
    setState("modalStartAt", index);
    setState("modalVisible", true);
  };

  const closeModal = () => {
    setState("modalVisible", false);
    setState("modalStartAt", 0);
  };

  return (
    <div class="spacing">
      <div class="images__head">
        <h2 class="images__title">{props.title}</h2>
        <strong class="images__count"> {props.images?.length} Images </strong>
      </div>
      <div class="images__items">
        <For each={props.images as any[]}>
          {(image, index) => (
            <ImagesItem
              type={props.title.toLowerCase()}
              image={image}
              openModal={() => openModal(index())}
            />
          )}
        </For>
      </div>
      <Show when={state.modalVisible}>
        <Modal
          data={props.images}
          ariaLabel="Images"
          type="image"
          modifier="modal--images"
          nav
          startAt={state.modalStartAt}
          onClose={closeModal}
        />
      </Show>
    </div>
  );
}

function ImagesItem(props) {
  const thumbWidth = props.type === "posters" ? 370 : 533;
  const thumbHeight = props.type === "posters" ? 556 : 300;

  return (
    <div class={`images-item images-${props.type}`}>
      <a
        href={props.image.file_path}
        onClick={e => {
          e.preventDefault();
          props.openModal();
        }}
      >
        <div class="images-item__img">
          <img
            // loading="lazy"
            width={thumbWidth}
            height={thumbHeight}
            // sizes="xsmall:29vw small:29vw medium:17vw large:14vw xlarge:13vw xlarge1:11vw xlarge2:12vw xlarge3:342"
            src={`https://image.tmdb.org/t/p/w${thumbWidth}_and_h${thumbHeight}_bestv2${props.image
              .file_path!}`}
          />
        </div>
      </a>
    </div>
  );
}
