export function methodNotFound()  {
  return new Response(null, { status: 405 });
}
