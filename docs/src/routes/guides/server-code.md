# Server Code

Solid start comes with a server function that allows you to right code that only runs on the server from within your client code.

```tsx
import server from "solid-start/server";
import { Component, Suspence  } from "solid";

const Counter: Component = () => {
    const count = createResource(() => server(() => db.items.findMany()));

    return (
        <Suspence fallback={<div>Loading...</div>}>
            <div>
                <h1>Counter</h1>
                <p>{count()}</p>
                <button onClick={() => {
                    server(() => db.items.create({
                        name: "Item " + count()
                    }));
                }}>
                    Increment
                </button>
            </div>
        </Suspence>
    );
}

```