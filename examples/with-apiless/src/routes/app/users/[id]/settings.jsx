import { useData } from "solid-app-router";
export default function Main(props) {
  const { user } = useData(1);
  return <div>{user?.name}'s Settings</div>;
}
