const CLOUDFLARE_PRESETS = ["cloudflare-module", "cloudflare-pages", "cloudflare-durable"];

export function isCloudflarePreset(preset: string | undefined): boolean {
  if (!preset) return false;
  return CLOUDFLARE_PRESETS.some((cf) => preset.toLowerCase().includes(cf.toLowerCase()));
}

/**
 * Generates the virtual entry content for Cloudflare Workers.
 *
 * Nitro's nested H3 apps strip the URL down to just the path
 * (e.g., "/about" instead of "http://example.com/about").
 * This causes h3's `fromWebHandler` to fail with "Invalid URL string".
 *
 * This handler reconstructs the full URL from headers before passing
 * the request to the SolidStart handler.
 */
export function getCloudflareVirtualEntryContent(ssrEntry: string): string {
  return `
    import { defineEventHandler } from 'h3';
    import handler from '${ssrEntry}';

    export default defineEventHandler((event) => {
      const headers = event.req.headers;
      const getHeader = (name) => {
        if (headers && typeof headers.get === 'function') return headers.get(name);
        if (headers && typeof headers === 'object') return headers[name] || headers[name.toLowerCase()];
        return null;
      };
      const host = getHeader('host') || 'localhost';
      const proto = getHeader('x-forwarded-proto') || 'http';
      const path = event.path || event.req.url || '/';
      const fullUrl = proto + '://' + host + path;
      const request = new Request(fullUrl, {
        method: event.req.method,
        headers: headers,
        body: event.req.method !== 'GET' && event.req.method !== 'HEAD' ? event.req.body : undefined,
        duplex: 'half'
      });
      return handler.fetch(request);
    });
  `;
}
