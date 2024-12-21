import { A } from "@solidjs/router";
import { useAuth } from "@solid-mediakit/auth/client";
import { type VoidComponent, Match, Switch } from "solid-js";

const Home: VoidComponent = () => {
  return (
    <main class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#026d56] to-[#152a2c]">
      <div class="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 class="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Create <span class="text-[hsl(88,_77%,_78%)]">JD</span> App
        </h1>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <A
            class="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
            href="https://start.solidjs.com"
            target="_blank"
          >
            <h3 class="text-2xl font-bold">Solid Start →</h3>
            <div class="text-lg">
              Learn more about Solid Start and the basics.
            </div>
          </A>
          <A
            class="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
            href="https://github.com/orjdev/create-jd-app"
            target="_blank"
          >
            <h3 class="text-2xl font-bold">JD End →</h3>
            <div class="text-lg">
              Learn more about Create JD App, the libraries it uses, and how to
              deploy it.
            </div>
          </A>
        </div>
        <AuthShowcase />
      </div>
    </main>
  );
};

export default Home;

const AuthShowcase: VoidComponent = () => {
  const auth = useAuth();
  return (
    <div class="flex flex-col items-center justify-center gap-4">
      <Switch fallback={<div>Loading...</div>}>
        <Match when={auth.status() === "authenticated"}>
          <div class="flex flex-col gap-3">
            <span class="text-xl text-white">
              Welcome {auth.session()?.user?.name}
            </span>
            <button
              onClick={() => auth.signOut({ redirectTo: "/" })}
              class="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </Match>
        <Match when={auth.status() === "unauthenticated"}>
          <button
            onClick={() => auth.signIn("discord", { redirectTo: "/" })}
            class="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
          >
            Sign in
          </button>
        </Match>
      </Switch>
    </div>
  );
};
