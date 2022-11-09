import { APIEvent } from "solid-start";

/**
 * Helper higher order function to get the sitemap GET function.
 * @param {(event: APIEvent, baseURL: string) => Promise<string> | string} sitemapBodyFunction a 
 * function used to generate the content of the sitemap. It takes as inputs the APIEvent
 * and the baseURL (needed in every sitemap).
 * @returns a function that returns an async function usable as the GET method in an api route
 * with the headers with the correct Content-Type
 */
export function sitemapGET(sitemapBodyFunction: (event: APIEvent, baseURL: string) => Promise<string> | string) {
    return async (event: APIEvent) => {
        const url = new URL(event.request.url);
        const baseURL = url.origin;
        let sitemapBody = '';
        try {
            sitemapBody = await sitemapBodyFunction(event, baseURL);
        } catch (e) {
            console.error(e);
        }
        return new Response(sitemapBody, {
            headers: {
                "Content-Type": "text/xml"
            }
        });
    };
}