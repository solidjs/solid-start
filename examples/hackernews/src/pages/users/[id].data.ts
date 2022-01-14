import { createResource } from "solid-js";
import { RouteDataFunc } from "solid-app-router";
import fetchAPI from "../../lib/api";

const UserData: RouteDataFunc = (props) => {
  const [user] = createResource(() => `user/${props.params.id}`, fetchAPI);
  return user;
};

export default UserData;
