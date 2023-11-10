interface DurableObjectGetAlarmOptions {
  allowConcurrency?: boolean;
}

interface DurableObjectGetOptions {
  allowConcurrency?: boolean;
  noCache?: boolean;
}

interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
  readonly name?: string;
}

interface DurableObjectListOptions {
  start?: string;
  startAfter?: string;
  end?: string;
  prefix?: string;
  reverse?: boolean;
  limit?: number;
  allowConcurrency?: boolean;
  noCache?: boolean;
}

interface DurableObjectNamespace {
  newUniqueId(options?: DurableObjectNamespaceNewUniqueIdOptions): DurableObjectId;
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectNamespaceNewUniqueIdOptions {
  jurisdiction?: string;
}

interface DurableObjectPutOptions {
  allowConcurrency?: boolean;
  allowUnconfirmed?: boolean;
  noCache?: boolean;
}

interface DurableObjectSetAlarmOptions {
  allowConcurrency?: boolean;
  allowUnconfirmed?: boolean;
}

interface DurableObjectState {
  waitUntil(promise: Promise<any>): void;
  id: DurableObjectId;
  readonly storage: DurableObjectStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}

interface DurableObjectStorage {
  get<T = unknown>(key: string, options?: DurableObjectGetOptions): Promise<T | undefined>;
  get<T = unknown>(keys: string[], options?: DurableObjectGetOptions): Promise<Map<string, T>>;
  list<T = unknown>(options?: DurableObjectListOptions): Promise<Map<string, T>>;
  put<T>(key: string, value: T, options?: DurableObjectPutOptions): Promise<void>;
  put<T>(entries: Record<string, T>, options?: DurableObjectPutOptions): Promise<void>;
  delete(key: string, options?: DurableObjectPutOptions): Promise<boolean>;
  delete(keys: string[], options?: DurableObjectPutOptions): Promise<number>;
  deleteAll(options?: DurableObjectPutOptions): Promise<void>;
  transaction<T>(closure: (txn: DurableObjectTransaction) => Promise<T>): Promise<T>;
  getAlarm(options?: DurableObjectGetAlarmOptions): Promise<number | null>;
  setAlarm(scheduledTime: number | Date, options?: DurableObjectSetAlarmOptions): Promise<void>;
  deleteAlarm(options?: DurableObjectSetAlarmOptions): Promise<void>;
  sync(): Promise<void>;
}

/**
 *
 * @deprecated Don't use. Introduced incidentally in workers-types 3.x. Scheduled for removal.
 */
declare type DurableObjectStorageOperationsGetOptions = DurableObjectGetOptions;

/**
 *
 * @deprecated Don't use. Introduced incidentally in workers-types 3.x. Scheduled for removal.
 */
declare type DurableObjectStorageOperationsListOptions = DurableObjectListOptions;

/**
 *
 * @deprecated Don't use. Introduced incidentally in workers-types 3.x. Scheduled for removal.
 */
declare type DurableObjectStorageOperationsPutOptions = DurableObjectPutOptions;

declare abstract class Fetcher {
  fetch(requestOrUrl: Request | string, requestInit?: RequestInit | Request): Promise<Response>;
}

interface DurableObjectStub extends Fetcher {
  readonly id: DurableObjectId;
  readonly name?: string;
}

interface DurableObjectTransaction {
  get<T = unknown>(key: string, options?: DurableObjectGetOptions): Promise<T | undefined>;
  get<T = unknown>(keys: string[], options?: DurableObjectGetOptions): Promise<Map<string, T>>;
  list<T = unknown>(options?: DurableObjectListOptions): Promise<Map<string, T>>;
  put<T>(key: string, value: T, options?: DurableObjectPutOptions): Promise<void>;
  put<T>(entries: Record<string, T>, options?: DurableObjectPutOptions): Promise<void>;
  delete(key: string, options?: DurableObjectPutOptions): Promise<boolean>;
  delete(keys: string[], options?: DurableObjectPutOptions): Promise<number>;
  rollback(): void;
  getAlarm(options?: DurableObjectGetAlarmOptions): Promise<number | null>;
  setAlarm(scheduledTime: number | Date, options?: DurableObjectSetAlarmOptions): Promise<void>;
  deleteAlarm(options?: DurableObjectSetAlarmOptions): Promise<void>;
}

declare global {
  interface ResponseInit {
    webSocket?: WebSocket;
  }

  const WebSocketPair: { new (): { 0: WebSocket; 1: WebSocket } };
}

export interface DurableObjectContext<T extends {} = {}> {
  storage: DurableObjectStorage;
  state: DurableObjectState;
  durableObject: T;
  [key: string]: any;
}

export function createDurableObject(
  fn: (request: Request, ctx: DurableObjectContext) => Promise<Response>
) {
  return class {
    ctx: DurableObjectContext;
    constructor(state: DurableObjectState) {
      this.ctx = {
        storage: state.storage,
        state,
        durableObject: this
      };
    }

    async fetch(request: Request) {
      return fn(request, this.ctx);
    }
  };
}
