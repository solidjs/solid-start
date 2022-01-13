import { createResource } from "solid-js";
import { delay } from "../routes/utils";

const USERS = {
  1: {
    id: 1,
    name: "Joey"
  },
  2: {
    id: 2,
    name: "Jamie"
  }
};

export default async function ({ params }) {
  console.log("getting user");

  const user = await delay(250, USERS[params.id]);
  console.log("returning user", user, params.id);

  return {
    user
  };
}
