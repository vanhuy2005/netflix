import axios from "axios";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;

/**
 * Fetch popular movies from TMDB
 */
export const getPopularMovies = async (language = "vi-VN", page = 1) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: language,
        page: page,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    throw error;
  }
};

/**
 * Fetch trending movies/TV shows
 */
export const getTrending = async (mediaType = "movie", timeWindow = "week") => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "vi-VN",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching trending:", error);
    throw error;
  }
};

/**
 * Fetch movie details
 */
export const getMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "vi-VN",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
};

/**
 * Search movies
 */
export const searchMovies = async (query, page = 1) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "vi-VN",
        query: query,
        page: page,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching movies:", error);
    throw error;
  }
};

/**
 * Get movie genres
 */
export const getGenres = async () => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "vi-VN",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw error;
  }
};

/**
 * Get top rated movies
 */
export const getTopRated = async (language = "vi-VN", page = 1) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        language: language,
        page: page,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching top rated movies:", error);
    throw error;
  }
};

/**
 * Get movies by genre
 */
export const getMoviesByGenre = async (
  genreId,
  language = "vi-VN",
  page = 1
) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: language,
        page: page,
        with_genres: genreId,
        sort_by: "popularity.desc",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching movies by genre:", error);
    throw error;
  }
};

/**
 * Get TMDB image URL
 */
export const getImageUrl = (path, size = "original") => {
  if (!path) return "/assets/placeholder.jpg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export default {
  getPopularMovies,
  getTrending,
  getMovieDetails,
  searchMovies,
  getGenres,
  getTopRated,
  getMoviesByGenre,
  getImageUrl,
};
