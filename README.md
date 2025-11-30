# 🎬 Netflix Clone 2025

Full-stack Netflix Clone với giao diện hiện đại nhất, sử dụng React + Vite + TailwindCSS + Framer Motion + Firebase.

## ✨ Tính năng Hiện có

### 🎯 Authentication & Landing Page

- ✅ **Landing Page** - Trang giới thiệu như Netflix thật với 4 sections chính
- ✅ **Firebase Authentication** - Đăng ký & đăng nhập với Email/Password
- ✅ **Protected Routes** - Bảo vệ trang Browse, redirect thông minh
- ✅ **React Router** - Navigation mượt mà giữa các trang
- ✅ **React Toastify** - Thông báo đẹp cho các actions
- ✅ **Loading Spinner** - Netflix-style spinner khi xử lý

### 🎨 UI/UX Components

- ✅ **Deep Black Background** (#141414) - màu nền chính thức của Netflix
- ✅ **Font Poppins** - font chữ hiện đại như Netflix 2025
- ✅ **Framer Motion** - hiệu ứng chuyển động mượt mà
- ✅ **Responsive Design** - tương thích mọi thiết bị
- ✅ **Feature Cards** - 4 thẻ tính năng với gradient đẹp
- ✅ **FAQ Accordion** - Câu hỏi thường gặp với animation
- ✅ **Floating Labels** - Form inputs như Netflix thật

### 🎬 Browse Page (Sau khi đăng nhập)

- ✅ **Navbar** với hiệu ứng scroll và animation
- ✅ **Hero Section** với gradient overlay đẹp mắt
- ✅ **Movie Row** với scroll ngang và hover effects

## 🎨 Màu sắc Netflix chuẩn

```javascript
colors: {
  netflix: {
    red: "#E50914",          // Netflix Red
    redHover: "#C11119",     // Red Hover
    deepBlack: "#141414",    // Deep Black - nền chính
    darkGray: "#181818",     // Dark Gray - nền card
    gray: "#8C8C8C",         // Text phụ
    lightGray: "#B3B3B3",    // Text secondary
    white: "#FFFFFF",        // Text chính
  }
}
```

## 🚀 Cài đặt

```bash
cd client
npm install
```

## 📦 Dependencies đã cài

- React 18
- TypeScript
- Vite
- TailwindCSS
- Framer Motion
- Autoprefixer
- PostCSS

## 💻 Chạy dự án

```bash
npm run dev
```

## 📁 Cấu trúc thư mục

```
client/
├── src/
│   ├── components/
│   │   ├── Navbar/
│   │   │   └── Navbar.tsx       # Navigation bar với scroll effect
│   │   ├── Hero/
│   │   │   └── Hero.tsx         # Hero banner section
│   │   └── MovieRow/
│   │       └── MovieRow.tsx     # Movie carousel row
│   ├── pages/
│   │   └── Home/
│   │       └── Home.tsx         # Trang chủ
│   ├── App.tsx
│   ├── index.css               # Global styles
│   └── main.tsx
├── public/
│   └── assets/                 # Images & icons
├── tailwind.config.js          # Tailwind configuration
└── package.json
```

## 🎭 Components

### Navbar

- Scroll effect với background transition
- Responsive navigation links
- Icons với hover animation

### Hero

- Full-screen hero banner
- Gradient overlays
- Animated buttons với Framer Motion
- Image title và description

### MovieRow

- Horizontal scroll carousel
- Hover effects với scale animation
- Navigation arrows
- Smooth scrolling

## 🎨 Framer Motion Animations

Tất cả components đều sử dụng Framer Motion cho:

- Fade in/out effects
- Scale animations
- Smooth transitions
- Scroll-based animations

## 📱 Responsive

- Desktop: Full experience
- Tablet: Optimized layout
- Mobile: Touch-friendly interface

## 🔧 Customization

Bạn có thể tùy chỉnh:

- Màu sắc trong `tailwind.config.js`
- Font chữ trong `index.html` và `tailwind.config.js`
- Animations trong từng component

## 📝 Notes

- Font Poppins được load từ Google Fonts
- Tất cả màu sắc tuân theo Netflix Design System 2025
- CSS utilities được tối ưu với Tailwind
- Smooth scrollbar với custom styling

---

Made with ❤️ using React + Vite + TailwindCSS + Framer Motion
