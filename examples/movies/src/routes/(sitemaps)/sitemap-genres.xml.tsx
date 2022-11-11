import { getGenreList } from "~/services/tmdbAPI";
import { sitemapGET } from "./sitemap-utils";

//export the get function with the help of the higher order function
//defined in sitemap-utils. You just need to return the string
export const GET = sitemapGET(async (_, baseURL) => {
  try {
    const moviesGenres = await getGenreList("movie");
    const tvGenres = await getGenreList("tv");
    let genresSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (let index = 0; index < tvGenres.length; index++) {
      const tvGenre = tvGenres[index];
      genresSitemap += `
    <url>
        <loc>${baseURL}/genre/${tvGenre.id}/tv</loc>
    </url>`;
    }
    for (let index = 0; index < moviesGenres.length; index++) {
      const tvGenre = moviesGenres[index];
      genresSitemap += `
    <url>
        <loc>${baseURL}/genre/${tvGenre.id}/movie</loc>
    </url>`;
    }
    genresSitemap += "</urlset>";
    return genresSitemap;
  } catch (e) {
    return "";
  }
});
