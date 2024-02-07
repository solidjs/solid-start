import { createStorage } from "unstorage";
import fsLiteDriver from "unstorage/drivers/fs-lite";

// this uses file system driver for unstorage that works only on node.js
// swap with the key value of your choice in your deployed environment
export const storage = createStorage({
  driver: fsLiteDriver({
    base: "./.data"
  })
});