import { AnyMap, type SourceMapInput, type TraceMap } from "@jridgewell/trace-mapping";

const INLINE_SOURCEMAP_REGEX = /^data:application\/json[^,]+base64,/;
const SOURCEMAP_REGEX =
  /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^*]+?)[ \t]*(?:\*\/)[ \t]*$)/;

export default async function getSourceMap(url: string, content: string): Promise<TraceMap | null> {
  const lines = content.split("\n");
  let sourceMapUrl: string | undefined;
  for (let i = lines.length - 1; i >= 0 && !sourceMapUrl; i--) {
    const result = lines[i]!.match(SOURCEMAP_REGEX);
    if (result) {
      sourceMapUrl = result[1];
    }
  }

  if (!sourceMapUrl) {
    return null;
  }

  if (!(INLINE_SOURCEMAP_REGEX.test(sourceMapUrl) || sourceMapUrl.startsWith("/"))) {
    // Resolve path if it's a relative access
    const parsedURL = url.split("/");
    parsedURL[parsedURL.length - 1] = sourceMapUrl;
    sourceMapUrl = parsedURL.join("/");
  }
  const response = await fetch(sourceMapUrl);
  const rawSourceMap: SourceMapInput = await response.json();
  // AnyMap also handles indexed ("sections") source maps
  return new AnyMap(rawSourceMap);
}
