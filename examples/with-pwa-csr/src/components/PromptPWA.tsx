import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { useRegisterSW } from 'virtual:pwa-register/solid';
import "./PromptPWA.css";

const PromptPWA: Component = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.info('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    }
  })

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <Show when={offlineReady() || needRefresh()}>
      <div class="toast">
        <div>
          <Show
            fallback={<span>New content available, click on reload button to update.</span>}
            when={offlineReady()}
          >
            <span>App ready to work offline</span>
          </Show>
        </div>
        <Show when={needRefresh()}>
          <button onClick={() => updateServiceWorker(true)}>Reload</button>
        </Show>
        <button onClick={() => close()}>Close</button>
      </div>
    </Show>
  );
};

export default PromptPWA;
