import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Billboard from "../../components/Browse/Billboard";
import Row from "../../components/Browse/Row";
import requests from "../../api/requests";

const BrowsePage = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-netflix-deepBlack">
      {/* Navbar với scroll behavior */}
      <Navbar />

      {/* Billboard Hero Section - Full Bleed Video */}
      {/* Wrapper div ensures Billboard occupies space in document flow */}
      <div className="relative w-full">
        <Billboard />
      </div>

      {/* Movie Rows với TMDB Categories - Cinematic Overlap */}
      {/* Negative margin creates layering effect over Billboard gradient */}
      <div className="relative z-20 -mt-20 md:-mt-32 w-full pb-20 space-y-8 md:space-y-12">
        {/* Netflix Originals - Poster lớn */}
        <Row
          title="Netflix Originals"
          fetchUrl={requests.fetchNetflixOriginals}
          isLarge={true}
        />

        {/* Trending Now */}
        <Row title="Thịnh hành" fetchUrl={requests.fetchTrending} />

        {/* Top Rated */}
        <Row title="Được đánh giá cao" fetchUrl={requests.fetchTopRated} />

        {/* Action */}
        <Row title="Phim hành động" fetchUrl={requests.fetchActionMovies} />

        {/* Comedy */}
        <Row title="Phim hài" fetchUrl={requests.fetchComedyMovies} />

        {/* Horror */}
        <Row title="Phim kinh dị" fetchUrl={requests.fetchHorrorMovies} />

        {/* Romance */}
        <Row title="Phim lãng mạn" fetchUrl={requests.fetchRomanceMovies} />

        {/* Documentaries */}
        <Row title="Phim tài liệu" fetchUrl={requests.fetchDocumentaries} />

        {/* Sci-Fi */}
        <Row title="Khoa học viễn tưởng" fetchUrl={requests.fetchSciFiMovies} />

        {/* Animation */}
        <Row title="Hoạt hình" fetchUrl={requests.fetchAnimation} />

        {/* Thriller */}
        <Row title="Phim ly kỳ" fetchUrl={requests.fetchThriller} />

        {/* Drama */}
        <Row title="Phim chính kịch" fetchUrl={requests.fetchDrama} />
      </div>
    </div>
  );
};

export default BrowsePage;
