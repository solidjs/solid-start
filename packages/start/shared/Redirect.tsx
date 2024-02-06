import { HttpHeader } from "./HttpHeader";
import { HttpStatusCode } from "./HttpStatusCode";

export function Redirect(props: { to: string, permanent?: boolean }) {
  return <>
    <HttpHeader name="location" value={props.to} />
    <HttpStatusCode code={props.permanent ? 308 : 307} />
  </>
}
