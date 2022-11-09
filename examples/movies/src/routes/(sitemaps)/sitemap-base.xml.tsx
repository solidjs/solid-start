import { sitemapGET } from "./sitemap-utils";

//export the get function with the help of the higher order function
//defined in sitemap-utils. You just need to return the string
export const GET = sitemapGET(
  (_, baseURL) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">  
    <url>
        <loc>${baseURL}/</loc>
    </url>
</urlset>`
);
