import { type Accessor, createMemo } from "solid-js";
import getSourceMap from "./get-source-map.ts";

const HTTP_URL_REGEX = /^https?:\/\//;
const LEADING_SLASH_REGEX = /^\/+/;

export interface StackFrameSource {
  content: string;
  source: string;
  name?: string;
  line: number;
  column: number;
}

// Frames from an SSR error carry filesystem paths (or file:// URLs) rather
// than the http URL the module is served from. Their positions are already
// mapped back to the original source by the Vite module runner, unlike
// client frames whose positions refer to the compiled module.
function isServerSource(path: string): boolean {
  return !HTTP_URL_REGEX.test(path);
}

function getActualFileSource(path: string): string {
  if (path.startsWith("file://")) {
    return "/@fs/" + path.substring("file://".length).replace(LEADING_SLASH_REGEX, "");
  }
  if (isServerSource(path)) {
    return "/@fs/" + path.replace(LEADING_SLASH_REGEX, "");
  }
  return path;
}

export function createStackFrame(stackframe: StackFrame, isCompiled: () => boolean) {
  const data = createMemo(async () => {
    const source = {
      fileName: stackframe.fileName,
      line: stackframe.lineNumber,
      column: stackframe.columnNumber,
      functionName: stackframe.functionName,
    };
    if (!source.fileName) {
      return null;
    }
    const response = await fetch(getActualFileSource(source.fileName));
    if (!response.ok) {
      return null;
    }
    const content = await response.text();
    const url = getActualFileSource(source.fileName);
    const sourceMap = await getSourceMap(url, content);
    return {
      source,
      content,
      sourceMap,
      isServer: isServerSource(source.fileName),
    };
  });

  const info = createMemo(() => {
    const current = data();
    if (!current) {
      return undefined;
    }
    const { source, content, sourceMap, isServer } = current;

    if (!isCompiled() && source.line && source.column && sourceMap) {
      if (isServer) {
        // The position is already original; only the original content needs
        // to be pulled out of the source map.
        const originalContent = sourceMap.sources.length
          ? sourceMap.sourceContentFor(sourceMap.sources[0]!, true)
          : null;
        if (originalContent) {
          return {
            source: source.fileName,
            line: source.line,
            column: source.column,
            name: source.functionName,
            content: originalContent,
          } as StackFrameSource;
        }
      } else {
        const result = sourceMap.originalPositionFor({
          line: source.line,
          column: source.column,
        });
        if (result.source) {
          return {
            ...result,
            content: sourceMap.sourceContentFor(result.source, true),
          } as StackFrameSource;
        }
      }
    }

    return {
      source: source.fileName,
      line: source.line,
      column: source.column,
      name: source.functionName,
      content,
    } as StackFrameSource;
  });

  return info as Accessor<StackFrameSource>;
}
