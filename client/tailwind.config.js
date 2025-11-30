/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        netflix: {
          red: "#E50914", // Netflix Red - màu đỏ chính thức
          redHover: "#C11119", // Màu đỏ khi hover
          deepBlack: "#141414", // Deep Black - màu nền chính Netflix 2025
          darkGray: "#181818", // Dark Gray - màu nền card/section
          gray: "#8C8C8C", // Màu text phụ
          lightGray: "#B3B3B3", // Màu text secondary
          white: "#FFFFFF", // Text chính
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"], // Font Poppins như Netflix 2025
        sans: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        // Gradient phủ lên ảnh bìa phim để làm nổi bật chữ trắng
        "gradient-to-b":
          "linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.8) 100%)",
      },
      spacing: {
        "header-height": "70px", // Chiều cao chuẩn của Header Netflix
      },
    },
  },
  plugins: [],
};
