import { createResource } from "solid-js";
import { RouteDataFunc } from "solid-app-router";
import fetchAPI from "../../lib/api";
import server from "solid-start/server";

const UserData: RouteDataFunc = props => {
  const [user] = createResource(
    () => `user/${props.params.id}`,
    server(fetchAPI)
  );
  return user;
};

export default UserData;
