import { createResource } from "solid-js";
import { RouteDataFunc } from "solid-app-router";
import fetchAPI from "../../lib/api";
import server from "solid-start/server";

const UserData: RouteDataFunc = props => {
  const [user] = createResource(
    () => `user/${props.params.id}`,
    server(async (path: string) => {
      const request = server.getRequest().request;
      const bearer = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!bearer || bearer === "solidjs") {
        return await fetchAPI(path);
      }
      throw new Error("Unauthorized");
    })
  );
  return user;
};

export default UserData;
