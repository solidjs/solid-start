export function GET() {
  return new Response("Should not take priority over routes/api.ts");
}
