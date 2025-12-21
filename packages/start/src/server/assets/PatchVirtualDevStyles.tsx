/**
 * Patches the data-vite-dev-id attribute for style tags of virtual modules
 *
 * Per Vite's convention, virtual module ids are prefixed with \0 (null byte):
 * https://vite.dev/guide/api-plugin#virtual-modules-convention
 *
 * However this null byte cannot be server rendered properly.
 * Vite client runtime then fails to find style's with wrong null bytes,
 * and instead inserts duplicate style's.
 *
 * This patch replaces the serializable /@id/__x00__ with the proper null byte,
 * and has to run before Vite's client runtime:
 * https://github.com/vitejs/vite/blob/130e7181a55c524383c63bbfb1749d0ff7185cad/packages/vite/src/client/client.ts#L529
 *
 * TODO: This should be solved in Vite directly!
 */
const patch = function () {
  document.querySelectorAll<HTMLElement>("style[data-vite-dev-id]").forEach(function (el) {
    el.setAttribute("data-vite-dev-id", el.dataset.viteDevId!.replace("/@id/__x00__", "\0"));
  });
};

const serializedPatch = `(${patch.toString()})();`;

const PatchVirtualDevStyles = (props: { nonce?: string }) => {
  if (!import.meta.env.PROD) {
    return <script nonce={props.nonce} innerHTML={serializedPatch} />;
  }
};

export default PatchVirtualDevStyles;
