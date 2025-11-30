/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        netflix: {
          red: "#E50914", // Màu đỏ thương hiệu (Logo, nút CTA)
          redHover: "#C11119", // Màu đỏ tối hơn khi hover
          dark: "#141414", // Màu nền các card
          black: "#000000", // Màu nền chính
          gray: "#8C8C8C", // Màu text phụ
          light: "#F5F5F1", // Màu text chính
        },
      },
      fontFamily: {
        // Chúng ta sẽ dùng Roboto làm font chủ đạo thay cho Netflix Sans
        sans: ["Roboto", "sans-serif"],
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
