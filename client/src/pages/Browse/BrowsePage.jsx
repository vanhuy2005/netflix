import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import MovieRow from "../../components/MovieRow/MovieRow";
import NetflixSpinner from "../../components/common/NetflixSpinner";
import {
  getTrending,
  getPopularMovies,
  getTopRated,
  getMoviesByGenre,
} from "../../utils/tmdbApi";

const BrowsePage = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        const [trending, popular, topRated, action, comedy] = await Promise.all(
          [
            getTrending("day"),
            getPopularMovies(),
            getTopRated(),
            getMoviesByGenre(28), // Action genre ID
            getMoviesByGenre(35), // Comedy genre ID
          ]
        );

        setTrendingMovies(trending.results.slice(0, 10));
        setPopularMovies(popular.results.slice(0, 10));
        setTopRatedMovies(topRated.results.slice(0, 10));
        setActionMovies(action.results.slice(0, 10));
        setComedyMovies(comedy.results.slice(0, 10));
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMovies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-deepBlack flex items-center justify-center">
        <NetflixSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-deepBlack">
      <Navbar />
      <Hero />

      {/* Movie Rows */}
      <div className="relative z-20 -mt-32 space-y-8 pb-20">
        <MovieRow title="Thịnh hành hôm nay" movies={trendingMovies} />
        <MovieRow title="Phổ biến trên Netflix" movies={popularMovies} />
        <MovieRow title="Top Rated" movies={topRatedMovies} />
        <MovieRow title="Phim hành động" movies={actionMovies} />
        <MovieRow title="Phim hài" movies={comedyMovies} />
      </div>
    </div>
  );
};

export default BrowsePage;
