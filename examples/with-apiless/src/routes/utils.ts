export function delay(ms: number): undefined;
export function delay<T>(ms: number, data: T): Promise<T>;
export function delay<T>(ms: number, data?: T): Promise<T | undefined> {
  return new Promise<T | undefined>((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, ms);
  });
}
