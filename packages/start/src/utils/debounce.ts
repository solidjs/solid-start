/**
 * Creates a debounced function that delays the invocation of a function
 */
export const debounce = <T extends (...args: any[]) => void>(cb: T, debounceMs: number) => {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => cb(...args), debounceMs)
  }
}
