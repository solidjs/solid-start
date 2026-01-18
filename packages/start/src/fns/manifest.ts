type HandlerRegistration = [id: string, callback: Function];

const REGISTRATIONS = new Map<string, HandlerRegistration>();

export function registerServerFunction<T extends any[], R>(
  id: string,
  callback: (...args: T) => Promise<R>,
) {
  REGISTRATIONS.set(id, [id, callback]);
  return callback;
}

export function getServerFunction<T extends any[], R>(
  id: string,
): ((...args: T) => Promise<R>) | undefined {
  return REGISTRATIONS.get(id) as ((...args: T) => Promise<R>) | undefined;
}
