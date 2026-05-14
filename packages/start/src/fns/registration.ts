const REGISTRATIONS = new Map<string, Function>();

export function registerServerFunction<T extends any[], R>(
  id: string,
  callback: (...args: T) => Promise<R>,
) {
  REGISTRATIONS.set(id, callback);
  return callback;
}

export function getServerFunction<T extends any[], R>(
  id: string,
): ((...args: T) => Promise<R>) {
  const fn = REGISTRATIONS.get(id) as ((...args: T) => Promise<R>) | undefined;
  if (fn) {
    return fn;
  }
  throw new Error('invalid server function: ' + id);
}
