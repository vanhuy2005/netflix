<div align="center">
  <img src="netflix/public/favicon.png" alt="Netflix Logo" width="120" />
  
  # Netflix Clone
  
  <p>Netflix Clone — giao diện xem phim tương tự Netflix, viết bằng React + Vite + TailwindCSS + Framer Motion, dùng Firebase cho xác thực và lưu dữ liệu người dùng.</p>
</div>

---

## TỔNG QUAN

**Netflix Clone** là một bản sao giao diện và trải nghiệm xem phim (front-end focused) được xây dựng để minh họa các kỹ thuật UI/UX hiện đại: cinematic transition, profile management, danh sách "My List", trình phát trailer (YouTube), và tích hợp với The Movie Database (TMDB) + Firebase (Auth & Firestore). Mục tiêu: học tập, demo kỹ thuật và làm cơ sở cho các dự án media.

## TÍNH NĂNG CHÍNH

- Firebase Authentication (Email/Password) với xử lý lỗi thân thiện
- Hệ thống Profiles (nhiều hồ sơ trong 1 tài khoản)
- Lưu phim theo từng profile (Firestore), real-time updates
- Cinematic Splash (intro video) với cơ chế fallback/timeout và test suite
- Trailer playback qua YouTube (react-youtube)
- Tìm kiếm, Browse, Billboard, Movie Rows, và Movie Detail/Player
- Responsive UI, TailwindCSS theme (Netflix-like colors)
- Chuyển động mượt với Framer Motion
- Manual tests & utilities (ví dụ: `src/utils/testCinematicTransition.js`)
  
## CÁCH SỬ DỤNG

- Tạo tài khoản, bắt buộc xài gmail thật vì dùng firebase để authentication
- Và bạn đã có thể trải nghiệm toàn bộ tính năng của hệ thống

## TECH-STACK

- Frontend: React 19, TypeScript (một số file .jsx vẫn còn), Vite
- UI: TailwindCSS, Framer Motion
- State & Routing: React Router DOM, clsx
- Network: axios, TMDB API
- Auth & DB: Firebase (Auth + Firestore)
- Misc: react-toastify, react-icons, react-youtube

## ENVIRONMENT SET UP

### Yêu cầu tối thiểu

- Node.js >= 18 (khuyến nghị)
- npm hoặc pnpm
- Tài khoản Firebase (đã cấu hình Authentication + Firestore)
- API key TMDB (https://www.themoviedb.org)

### Cài đặt nhanh

1. Clone repository

```bash
git clone https://github.com/vanhuy2005/netflix.git
cd netflix/netflix
```

2. Cài dependencies

```bash
npm install
```

3. Tạo file môi trường

Sao chép `.env.example` thành `.env` và điền các biến:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_TMDB_API_KEY=
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
```

4. Chạy local server

```bash
npm run dev
```

---

## CẤU HÌNH FIREBASE & FIRESTORE GỢI Ý

- Bật Authentication → Email/Password (important)
- Tạo Firestore database (in native mode)
- Các collection/hierarchy dùng trong code:
  - users/{uid}/profiles/{profileId}/savedShows/{movieId}

Một số điểm lưu ý (xem `src/config/firebase.js`):

- File sẽ đọc biến môi trường bắt đầu bằng `VITE_FIREBASE_*`
- Có helper: `signup`, `login`, `logout`, `saveShow`, `removeShow`, `subscribeToSavedShows`, `updateProfile`, `deleteProfile`
- Nếu gặp lỗi `auth/configuration-not-found`, hãy kiểm tra trong Firebase Console rằng Email/Password đã được bật.

## TEST & MANUAL QA

- Cinematic transition có bộ test hướng dẫn thủ công trong `src/utils/testCinematicTransition.js` (Slow 3G, autoplay block, rapid clicks, cleanup, v.v.)
- Có helper `src/config/firebaseTest.js` để kiểm tra kết nối Firebase

## MỘT SỐ LỆNH HỮU ÍCH

- `npm run dev` — chạy dev server (Vite)
- `npm run build` — build (TypeScript + vite build)
- `npm run preview` — preview production build
- `npm run lint` — chạy eslint
- `npm run tl-init` — khởi tạo Tailwind (nếu cần)

## CÁC VẤN ĐỀ THƯỜNG GẶP

- "Firebase API Key missing" → kiểm tra `.env` và biến `VITE_FIREBASE_API_KEY`
- "Autoplay blocked" trên iOS → cinematic splash có fallback: video sẽ bị bỏ qua và app vẫn điều hướng
- Trailer không tìm thấy → kiểm tra `VITE_TMDB_API_KEY` và hạn chế API của TMDB
- Lỗi khi lưu phim → kiểm tra security rules của Firestore và đường dẫn `users/{uid}/profiles/...`

## KIẾN TRÚC VÀ CẤU TRÚC THƯ MỤC

- `src/` — mã nguồn chính
  - `components/` — các UI component (Navbar, MovieRow, Billboard, Player,...)
  - `pages/` — các page (Home, Browse, Profile, Auth...)
  - `config/` — cấu hình Firebase và helper
  - `utils/` — helper & test utilities (ví dụ cinematic transition test)
  - `assets/` — static assets

## ĐÓNG GÓP

Mong nhận PR hợp lệ:

- Fork repository → Tạo branch `feat/your-feature` hoặc `fix/issue-xxx`
- Viết test nếu có thể và đảm bảo lint pass
- Mô tả rõ thay đổi trong PR

## LICENSE

- Mã nguồn này được cung cấp cho mục đích học tập/demo. (Bạn có thể thêm license như MIT nếu muốn)

---

Made with ❤️ by vanhuy2005
