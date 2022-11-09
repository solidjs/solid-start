import { sitemapGET } from "./sitemap-utils";

//export the get function with the help of the higher order function
//defined in sitemap-utils. You just need to return the string
export const GET = sitemapGET(
  (_, baseURL) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${baseURL}/sitemap-base.xml</loc>
    </sitemap>
    <sitemap>
        <loc>${baseURL}/sitemap-movies.xml</loc>
    </sitemap>
    <sitemap>
        <loc>${baseURL}/sitemap-tvs.xml</loc>
    </sitemap>
</sitemapindex>`
);
