export function NamedClientOnly() {
  return <p id="client-only-named">CLIENT_ONLY_NAMED_EXPORT_RENDERED</p>;
}

// Never imported through clientOnly, so it should stay out of the client bundle.
export function UnusedClientOnly() {
  return <p>CLIENT_ONLY_UNUSED_EXPORT_MARKER</p>;
}
