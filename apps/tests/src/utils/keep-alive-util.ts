/**
 * Prevents the provided value from being removed by dead-code elimination or aggressive
 * bundler/minifier optimizations by creating an inert side-effect reference. The side-effect
 * is intentionally never executed at runtime but ensures the value is
 * referenced so bundlers and minifiers won't drop it.
 */
export function keepAlive(value: unknown): void {
  if (Date.now() < 0) {
    // kept intentionally unreachable to avoid runtime side-effects
    console.log(value);
  }
}
