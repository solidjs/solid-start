import { createSignal, FlowProps, onMount } from "solid-js";
import { getRequestEvent } from "solid-js/web";

const Badge = (props: FlowProps) => (
  <div class="text-base text-white bg-gray-700 rounded-lg px-2 font-medium">{props.children}</div>
);

const Layout = (props: FlowProps<{ title: string }>) => {
  const [mounted, setMounted] = createSignal(false);
  onMount(() => setMounted(true));

  return (
    <div class="flex gap-2 flex-col">
      <div class="flex items-center gap-2 flex-wrap">
        <h1>{props.title}</h1>
        <Badge>Environment: {import.meta.env.DEV ? "DEV" : "PROD"}</Badge>
        <Badge>Rendered: {!mounted() ? "Server" : "Server & Client"}</Badge>
      </div>

      <div class="text-gray-500 text-sm font-medium">
        Agent:{" "}
        <span class="text-xs">
          {getRequestEvent()?.request.headers.get("user-agent") ?? navigator.userAgent}
        </span>
      </div>

      <ul class="list-inside list-disc mb-4 text-gray-400 font-semibold text-xs">
        <li>
          Enable throttling & disable cache in the network tab to see eventual FOUC's (frames of
          unstyled content)
        </li>
        <li>Click on routes to test client navigation</li>
      </ul>

      <div class="grid grid-cols-[repeat(5,auto)] gap-4 gap-y-2">
        <div class="grid col-span-full grid-cols-subgrid px-4 text-gray-400 text-sm">
          <div>Component</div>
          <div>File</div>
          <div>Integration</div>
          <div>Lazy</div>
          <div>Comments</div>
        </div>

        {props.children}
      </div>

      <div class="flex justify-end gap-2 items-center text-sm uppercase font-bold text-white">
        <div class="grid content-center rounded-lg bg-success px-2">pass</div>
        <div class="grid content-center rounded-lg bg-error px-2">fail</div>
        <div class="grid content-center rounded-lg bg-warn px-2">not supported</div>
      </div>
    </div>
  );
};

export default Layout;
