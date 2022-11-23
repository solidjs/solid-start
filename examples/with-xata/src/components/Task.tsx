import { createServerAction$ } from "solid-start/server";
import { xata } from "~/lib/xata";
import { SolidWithXataExampleRecord } from "~/lib/xata.codegen.server";

export default function Task({ id, title, url, description }: SolidWithXataExampleRecord) {
  // Delete action
  const [_, { Form }] = createServerAction$((formData: FormData) => {
    const item = formData.get("item");
    if (typeof item === "string") { return xata.db.solid_with_xata_example.delete(item) }
  })

  return <li>
    <a href={url ?? ''} rel="noopener noreferrer" target="_blank">
      {title}
    </a>
    <p>{description}</p>
    <Form method="put">
      <input type="hidden" name="action" value="delete" />
      <button type="submit" name="item" value={id}>
        <span role="img" aria-label="delete item">
          🗑
        </span>
      </button>
    </Form>
  </li>
}