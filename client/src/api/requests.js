// TMDB API Requests Configuration
// Netflix 2025 Browse Page Categories

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;

const requests = {
  // Trending - Phim đang thịnh hành
  fetchTrending: `${BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=vi-VN`,

  // Netflix Originals (giả lập bằng phim có rating cao)
  fetchNetflixOriginals: `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=vi-VN&with_networks=213`,

  // Top Rated - Phim được đánh giá cao
  fetchTopRated: `${BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=vi-VN`,

  // Action Movies - Phim hành động
  fetchActionMovies: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=28&sort_by=popularity.desc&page=1`,

  // Comedy Movies - Phim hài
  fetchComedyMovies: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=35&sort_by=popularity.desc&page=1`,

  // Horror Movies - Phim kinh dị
  fetchHorrorMovies: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=27&sort_by=popularity.desc&page=1`,

  // Romance Movies - Phim lãng mạn
  fetchRomanceMovies: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=10749&sort_by=popularity.desc&page=1`,

  // Documentaries - Phim tài liệu
  fetchDocumentaries: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=99&sort_by=popularity.desc&page=1`,

  // Sci-Fi Movies - Phim khoa học viễn tưởng
  fetchSciFiMovies: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=878&sort_by=popularity.desc&page=1`,

  // Animation - Phim hoạt hình
  fetchAnimation: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=16&sort_by=popularity.desc&page=1`,

  // Thriller - Phim ly kỳ
  fetchThriller: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=53&sort_by=popularity.desc&page=1`,

  // Drama - Phim chính kịch
  fetchDrama: `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&with_genres=18&sort_by=popularity.desc&page=1`,

  // Search - Tìm kiếm phim & TV shows
  search: (query) =>
    `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
      query
    )}&page=1`,
};

export default requests;
