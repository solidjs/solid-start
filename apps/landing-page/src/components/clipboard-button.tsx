import { createSignal, Show } from "solid-js";
import { ClipboardIcon } from "./icons/clipboard-icon";

interface CopyToClipboardProps {
  class?: string;
  manager: string;
  command: string;
}

export function CopyToClipboard(props: CopyToClipboardProps) {
  const copyText = () => `${props.manager} ${props.command}`;

  const [isCopied, setIsCopied] = createSignal(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(copyText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      class={props.class}
      onClick={copyToClipboard}
      aria-label={isCopied ? "Copied!" : "Copy to clipboard"}
    >
      <Show when={isCopied()} fallback={<ClipboardIcon class="h-4 w-4" />}>
        ✔︎
      </Show>
    </button>
  );
}
