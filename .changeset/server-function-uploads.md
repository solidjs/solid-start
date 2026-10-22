---
"@solidjs/start": minor
---

Let server functions take files and blobs anywhere in their arguments, not only inside a `FormData` that is the only argument. A call like `upload(file, { tags })`, or one with files in arrays, objects, maps, sets or form data, sends them as parts of multipart form data next to the serialized arguments, and the server function gets them as `File` values. Calls without files are sent as before.
