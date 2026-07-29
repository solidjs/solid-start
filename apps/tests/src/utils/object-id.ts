/**
 * Stands in for a custom class that Seroval has no built-in support for, such
 * as Mongo's `ObjectId` or Prisma's `Decimal`. Serializing one of these across
 * a server function boundary requires a custom Seroval plugin.
 *
 * @see https://github.com/solidjs/solid-start/issues/1474
 */
export class ObjectId {
  constructor(readonly hex: string) {}

  toHexString() {
    return this.hex;
  }
}
