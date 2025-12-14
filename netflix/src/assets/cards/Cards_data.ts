import card_img1 from "./card1.jpg";
import card_img2 from "./card2.jpg";
import card_img3 from "./card3.jpg";
import card_img4 from "./card4.jpg";
import card_img5 from "./card5.jpg";
import card_img6 from "./card6.jpg";
import card_img7 from "./card7.jpg";
import card_img8 from "./card8.jpg";
import card_img9 from "./card9.jpg";
import card_img10 from "./card10.jpg";
import card_img11 from "./card11.jpg";
import card_img12 from "./card12.jpg";
import card_img13 from "./card13.jpg";
import card_img14 from "./card14.jpg";

export interface MovieData {
  id: number;
  image: string;
  name: string;
}

const cards_data: MovieData[] = [
  {
    id: 1,
    image: card_img1,
    name: "Kung Fu Panda",
  },
  {
    id: 2,
    image: card_img2,
    name: "Squid Game",
  },
  {
    id: 3,
    image: card_img3,
    name: "Squid Challange",
  },
  {
    id: 4,
    image: card_img4,
    name: "Jawan",
  },
  {
    id: 5,
    image: card_img5,
    name: "The Ghost",
  },
  {
    id: 6,
    image: card_img6,
    name: "Lucifer",
  },
  {
    id: 7,
    image: card_img7,
    name: "The Railway MEN",
  },
  {
    id: 8,
    image: card_img8,
    name: "Young Sheldon",
  },
  {
    id: 9,
    image: card_img9,
    name: "Sacred Games",
  },
  {
    id: 10,
    image: card_img10,
    name: "Adipurush",
  },
  {
    id: 11,
    image: card_img11,
    name: "Sukhee",
  },
  {
    id: 12,
    image: card_img12,
    name: "Mission Ganj",
  },
  {
    id: 13,
    image: card_img13,
    name: "Leo",
  },
  {
    id: 14,
    image: card_img14,
    name: "All of Us Are Dead",
  },
];

export default cards_data;
