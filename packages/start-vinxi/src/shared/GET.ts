// @refresh skip
/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/get
 */
export function GET<T extends (...args: any[]) => any>(fn: T) {
  return (fn as any).GET as (...args: Parameters<T>) => ReturnType<T>
}
