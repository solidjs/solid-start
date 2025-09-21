export function GET(e: { nativeEvent: { respondWith: (arg0: Response) => void; }; }) {
  e.nativeEvent.respondWith(new Response("test"));
}
