import { createResource } from "solid-js";
import { delay } from "../../utils";

function generateUsers() {
  return {
    1: {
      id: 1,
      name: "Joey " + ~~(Math.random() * 100)
    },
    2: {
      id: 2,
      name: "Jamie " + ~~(Math.random() * 100)
    }
  };
}

export default function () {
  console.log("getting users list");
  const [users] = createResource("USERS", async () => {
    const list = await delay(300, generateUsers());
    console.log("returning users list");
    return list;
  });

  return {
    users
  };
}
