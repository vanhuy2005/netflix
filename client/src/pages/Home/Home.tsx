import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import MovieRow from "../../components/MovieRow/MovieRow";
import cards_data from "../../assets/cards/Cards_data";

const Home = () => {
  return (
    <div className="min-h-screen bg-netflix-deepBlack">
      <Navbar />
      <Hero />

      {/* Movie Rows */}
      <div className="relative z-20 -mt-32">
        <MovieRow
          title="Phim đang thịnh hành"
          movies={cards_data.slice(0, 7)}
        />
        <MovieRow title="Netflix Originals" movies={cards_data.slice(7, 14)} />
      </div>
    </div>
  );
};

export default Home;
