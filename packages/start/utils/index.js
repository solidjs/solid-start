/**
 * JSDoc types lack a non-undefined assertion.
 * https://github.com/Microsoft/TypeScript/issues/23405#issuecomment-873331031
 *
 * Throws if the supplied value is _undefined_ (_null_ is allowed).\
 * Returns (via casting) the supplied value as a T with _undefined_ removed from its type space.
 * This informs the compiler that the value cannot be _undefined_.
 * @template T
 * @param {T} value
 * @param {string} [valueName]
 * @returns {T extends undefined ? never : T}
 */
export function assertDefined(value, valueName) {
  if (value === undefined) {
    throw new Error(
      `Encountered unexpected undefined value${valueName ? ` for '${valueName}'` : ""}`
    );
  }
  return /** @type {*} */ (value);
}

/**
 * @template T
 * @param {T} value
 * @returns {value is Exclude<T, null>}
 */
export function isNotNull(value) {
  return value != null;
}
