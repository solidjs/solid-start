import { getMovies } from "~/services/tmdbAPI";
import { sitemapGET } from "./sitemap-utils";

//export the get function with the help of the higher order function
//defined in sitemap-utils. You just need to return the string
export const GET = sitemapGET(async (_, baseURL) => {
  try {
    const popular = await getMovies("popular");
    let moviesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (let index = 0; index < popular.results.length; index++) {
      const movie = popular.results[index];
      moviesSitemap += `
    <url>
        <loc>${baseURL}/movie/${movie.id}</loc>
    </url>`;
    }
    moviesSitemap += "</urlset>";
    return moviesSitemap;
  } catch (e) {
    return "";
  }
});
