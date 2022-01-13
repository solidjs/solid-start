import { useData } from "solid-app-router";

const defineResource = (importer, params) => {};

const userResource = defineResource(() => import("../../../../components/user.api"), {
  id: () => {}
});

interface ResourceDefiniton {}

function a<T extends string>(a: T) {
  return a;
}

function UserName(params) {
  return <>{params.user?.name}</>;
}

function useResource(def: ResourceDefiniton) {
  const { user } = useData(1);
  return userResource(user);
}

export function action() {}
export function loader() {}
export function data() {}

export default function Main() {
  const { user } = useResource(userResource);
  const { theme } = useData(2);

  return <div>Welcome {theme}</div>;
}
