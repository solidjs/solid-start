export function GET() {
  // @ts-ignore
  console.log(process.env.SERVER_TEST);
  return new Response("Hello World");
}
