/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module variables.
 * @private
 */

var decode = decodeURIComponent;
var encode = encodeURIComponent;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

// Type definitions for cookie 0.5
// Project: https://github.com/jshttp/cookie
// Definitions by: Pine Mizune <https://github.com/pine>
//                 Piotr Błażejewicz <https://github.com/peterblazejewicz>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/**
 * Basic HTTP cookie parser and serializer for HTTP servers.
 */

/**
 * Additional serialization options
 */
export interface CookieSerializeOptions {
  /**
   * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.3|Domain Set-Cookie attribute}. By default, no
   * domain is set, and most clients will consider the cookie to apply to only
   * the current domain.
   */
  domain?: string | undefined;

  /**
   * Specifies a function that will be used to encode a cookie's value. Since
   * value of a cookie has a limited character set (and must be a simple
   * string), this function can be used to encode a value into a string suited
   * for a cookie's value.
   *
   * The default function is the global `encodeURIComponent`, which will
   * encode a JavaScript string into UTF-8 byte sequences and then URL-encode
   * any that fall outside of the cookie range.
   */
  encode?(value: string): string;

  /**
   * Specifies the `Date` object to be the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.1|`Expires` `Set-Cookie` attribute}. By default,
   * no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete
   * it on a condition like exiting a web browser application.
   *
   * *Note* the {@link https://tools.ietf.org/html/rfc6265#section-5.3|cookie storage model specification}
   * states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is
   * possible not all clients by obey this, so if both are set, they should
   * point to the same date and time.
   */
  expires?: Date | undefined;
  /**
   * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.6|`HttpOnly` `Set-Cookie` attribute}.
   * When truthy, the `HttpOnly` attribute is set, otherwise it is not. By
   * default, the `HttpOnly` attribute is not set.
   *
   * *Note* be careful when setting this to true, as compliant clients will
   * not allow client-side JavaScript to see the cookie in `document.cookie`.
   */
  httpOnly?: boolean | undefined;
  /**
   * Specifies the number (in seconds) to be the value for the `Max-Age`
   * `Set-Cookie` attribute. The given number will be converted to an integer
   * by rounding down. By default, no maximum age is set.
   *
   * *Note* the {@link https://tools.ietf.org/html/rfc6265#section-5.3|cookie storage model specification}
   * states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is
   * possible not all clients by obey this, so if both are set, they should
   * point to the same date and time.
   */
  maxAge?: number | undefined;
  /**
   * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.4|`Path` `Set-Cookie` attribute}.
   * By default, the path is considered the "default path".
   */
  path?: string | undefined;
  /**
   * Specifies the `string` to be the value for the [`Priority` `Set-Cookie` attribute][rfc-west-cookie-priority-00-4.1].
   *
   * - `'low'` will set the `Priority` attribute to `Low`.
   * - `'medium'` will set the `Priority` attribute to `Medium`, the default priority when not set.
   * - `'high'` will set the `Priority` attribute to `High`.
   *
   * More information about the different priority levels can be found in
   * [the specification][rfc-west-cookie-priority-00-4.1].
   *
   * **note** This is an attribute that has not yet been fully standardized, and may change in the future.
   * This also means many clients may ignore this attribute until they understand it.
   */
  priority?: "low" | "medium" | "high" | undefined;
  /**
   * Specifies the boolean or string to be the value for the {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|`SameSite` `Set-Cookie` attribute}.
   *
   * - `true` will set the `SameSite` attribute to `Strict` for strict same
   * site enforcement.
   * - `false` will not set the `SameSite` attribute.
   * - `'lax'` will set the `SameSite` attribute to Lax for lax same site
   * enforcement.
   * - `'strict'` will set the `SameSite` attribute to Strict for strict same
   * site enforcement.
   *  - `'none'` will set the SameSite attribute to None for an explicit
   *  cross-site cookie.
   *
   * More information about the different enforcement levels can be found in {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|the specification}.
   *
   * *note* This is an attribute that has not yet been fully standardized, and may change in the future. This also means many clients may ignore this attribute until they understand it.
   */
  sameSite?: true | false | "lax" | "strict" | "none" | undefined;
  /**
   * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.5|`Secure` `Set-Cookie` attribute}. When truthy, the
   * `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.
   *
   * *Note* be careful when setting this to `true`, as compliant clients will
   * not send the cookie back to the server in the future if the browser does
   * not have an HTTPS connection.
   */
  secure?: boolean | undefined;
}

/**
 * Additional parsing options
 */
export interface CookieParseOptions {
  /**
   * Specifies a function that will be used to decode a cookie's value. Since
   * the value of a cookie has a limited character set (and must be a simple
   * string), this function can be used to decode a previously-encoded cookie
   * value into a JavaScript string or other object.
   *
   * The default function is the global `decodeURIComponent`, which will decode
   * any URL-encoded sequences into their byte representations.
   *
   * *Note* if an error is thrown from this function, the original, non-decoded
   * cookie value will be returned as the cookie's value.
   */
  decode?(value: string): string;
}

/**
 * Parse an HTTP Cookie header string and returning an object of all cookie
 * name-value pairs.
 *
 * @param str the string representing a `Cookie` header value
 * @param [options] object containing parsing options
 */

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */
export function parseCookie(str: string, options?: CookieParseOptions): Record<string, string> {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }

  var obj: Record<string, any> = {};
  var opt = options || {};
  var pairs = str.split(";");
  var dec = opt.decode || decode;

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var index = pair.indexOf("=");

    // skip things that don't look like key=value
    if (index < 0) {
      continue;
    }

    var key = pair.substring(0, index).trim();

    // only assign once
    if (undefined == obj[key]) {
      var val = pair.substring(index + 1, pair.length).trim();

      // quoted values
      if (val[0] === '"') {
        val = val.slice(1, -1);
      }

      obj[key] = tryDecode(val, dec);
    }
  }

  return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */

/**
 * Serialize a cookie name-value pair into a `Set-Cookie` header string.
 *
 * @param name the name for the cookie
 * @param value value to set the cookie to
 * @param [options] object containing serialization options
 * @throws {TypeError} when `maxAge` options is invalid
 */
export function serializeCookie(
  name: string,
  value: string,
  options?: CookieSerializeOptions
): string;
export function serializeCookie(name: string, val: string, options?: CookieSerializeOptions) {
  var opt = options || {};
  var enc = opt.encode || encode;

  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }

  var value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError("argument val is invalid");
  }

  var str = name + "=" + value;

  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;

    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }

    str += "; Max-Age=" + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }

    str += "; Domain=" + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }

    str += "; Path=" + opt.path;
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== "function") {
      throw new TypeError("option expires is invalid");
    }

    str += "; Expires=" + opt.expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += "; HttpOnly";
  }

  if (opt.secure) {
    str += "; Secure";
  }

  if (opt.sameSite) {
    var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;

    switch (sameSite) {
      case true:
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError("option sameSite is invalid");
    }
  }

  return str;
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

function tryDecode(str: string, decode: (str: string) => string) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}
