import { createSignal } from 'solid-js';
import greet from '~/server';

export default function Home() {
  const [message, setMessage] = createSignal('');

  return (
    <main>
      <h1>Hello world!</h1>
      <button
        onClick={async () => {
          const message = await greet();
          setMessage(message);
        }}
      >
        Greet
      </button>
      <p>{message}</p>
    </main>
  );
}
