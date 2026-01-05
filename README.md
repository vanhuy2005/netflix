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

## PHIÊN BẢN HIỆN TẠI (Unreleased - feat/suggestion-film)

**Tóm tắt các thay đổi gần đây (tạm thời trên branch `feat/suggestion-film`):**

- **fix(player):** Sửa lỗi resume prompt — khi phát hiện điểm dở, component sẽ hiển thị dialog và set `isReadyToPlay = true` để modal không bị che bởi màn hình loading.
- **ui(player):** Loại bỏ/softer các gradient tối trên trang Player để có trải nghiệm video full-bleed sạch hơn.
- **ui(movie-card):** Ẩn phần footer mở rộng khi hover trong `ContinueWatchingRow` (prop: `hideExpandedFooter`) và chuẩn hóa màu progress bar sang theme **Netflix** (`netflix-red`, `netflix-redHover`).
- **ui/rows:** Chuẩn hóa kích thước tiêu đề các row (`text-sm md:text-xl lg:text-2xl font-bold`) và xóa icon tiêu đề ở `ContinueWatching` và `Recommendation` rows.
- **ux:** Chuẩn hóa hiệu ứng hover giữa `Row`, `ContinueWatchingRow` và `RecommendationRow` — loại bỏ transform-based motion wrappers gây sai z-index, thay bằng transition opacity và `flex-shrink-0`.
- **feature(recommendation):** Cập nhật logic tiêu đề đề xuất để ưu tiên hiển thị `Because you watched X` khi có 1-2 phim gốc (hook: `useSmartRecommendations`).
- **hooks:** Thêm/hoàn thiện `useContinueWatching` và `useSmartRecommendations` để tách logic và dễ test hơn.
- **docs:** Bổ sung nhiều tài liệu debug và hướng dẫn nội bộ trong `netflix/docs/` (ví dụ: `DEBUG_CONTINUE_WATCHING.md`, `RESUME_PLAYBACK_GUIDE.md`).

**Hướng dẫn kiểm tra nhanh (Sanity checks):**

1. Xác thực Resume Modal

   - Đăng nhập, chọn 1 profile có phim xem dở (>10s, <95%).
   - Mở trang Player cho phim đó → modal "Tiếp tục xem?" phải hiển thị ngay, kèm thời gian lưu.
   - Chọn "Tiếp tục phát" → player bắt đầu từ thời điểm lưu; chọn "Xem lại từ đầu" → bắt đầu từ 0.

2. Kiểm tra Continue Watching Row

   - Mở trang Browse với Continue Watching → hover lên MovieCard, **không** thấy footer mở rộng; tiến độ hiển thị luôn ở trạng thái non-hover.

3. Kiểm tra Recommendation Title
   - Đảm bảo khi chỉ có 1-2 seed history, tiêu đề hiển thị dạng "Because you watched X".

**Ghi chú phát triển:**

- Các thay đổi liên quan đến hover/z-index được thực hiện để tránh stacking context issues (tránh transform trên wrapper của card).
- Nếu gặp vấn đề autoplay/seek: kiểm tra `Player.jsx` và các biến `initialStartTime`, `isReadyToPlay`, đồng thời kiểm tra log trong console (`[Player]`).

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

## NHỮNG CẬP NHẬT GẦN ĐÂY (feat/suggestion-film)

**Tóm tắt:** Branch `feat/suggestion-film` chứa một tập hợp các cải tiến UI/UX và fixes liên quan tới Player, Continue Watching, Row hover behavior, và hệ thống recommendation. Một số tài liệu hỗ trợ đã được thêm vào `netflix/docs/`.

**Các thay đổi nổi bật:**

- **Player:** Sửa lỗi modal "Tiếp tục xem / Xem lại từ đầu" không hiển thị do loading overlay; khi phát hiện resume point, `isReadyToPlay` bây giờ được set để modal hiển thị đúng; giảm độ đậm của các gradient trên Player và thêm `overflow-hidden` để cắt iframe YouTube overscaled. (Files: `src/pages/Player/Player.jsx`, `Player_NATIVE_START.jsx`, `Player_OLD_SEEK.jsx`)
- **Continue Watching:** Ẩn expanded footer khi hover (`hideExpandedFooter` prop) và giữ progress bar ở trạng thái mặc định khi không hover; cập nhật màu progress bar sang theme Netflix red.
- **Row & MovieCard:** Đồng bộ hiệu ứng hover giữa các Row, loại bỏ transform-based animation wrapper để tránh z-index stacking context issues, chuẩn hóa kích thước tiêu đề và cải thiện hover z-index.
- **Recommendation:** Logic tiêu đề được ưu tiên dựa trên lịch sử xem (1-2 seeds) trước khi fallback sang tiêu đề theo thời điểm ("Perfect for Tonight").
- **Documentation:** Thêm nhiều tài liệu nội bộ (`netflix/docs/`), plus debug guides (`netflix/DEBUG_CONTINUE_WATCHING.md`, `netflix/RESUME_PLAYBACK_GUIDE.md`).

**Cách kiểm thử nhanh (Resume Modal):**

1. Đăng nhập, chọn profile có lịch sử xem (progress > 10s và percentage < 95).
2. Mở trang Player cho movie có lịch sử.
3. Modal **Tiếp tục xem?** sẽ xuất hiện với 2 nút: **Tiếp tục phát** / **Xem lại từ đầu**.
4. Chọn **Tiếp tục** → video bắt đầu từ điểm lưu; chọn **Xem lại từ đầu** → bắt đầu từ 0s.

(Thêm: nếu cần debug chi tiết, xem `netflix/DEBUG_CONTINUE_WATCHING.md` và `netflix/RESUME_PLAYBACK_GUIDE.md`)

## KIẾN TRÚC VÀ CẤU TRÚC THƯ MỤC

### Cấu trúc dự án chi tiết

```
netflix/
├── public/                          # Static assets
│   └── assets/                      # Logo, icons, avatars
│       ├── 01_Netflix_Logo/
│       └── 02_Netflix_Symbol/
│
├── src/
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Root component với routing
│   ├── App.css                      # Global styles
│   ├── index.css                    # Tailwind imports + base styles
│   ├── vite-env.d.ts               # TypeScript declarations (module types)
│   │
│   ├── api/
│   │   └── requests.js             # TMDB API endpoint definitions
│   │
│   ├── assets/
│   │   └── cards/
│   │       └── Cards_data.ts       # Static card data (nếu có)
│   │
│   ├── components/                  # UI Components (organized by feature)
│   │   ├── SplashScreen.jsx        # Cinematic intro animation
│   │   │
│   │   ├── Browse/                 # Browse page components
│   │   │   ├── Billboard.jsx       # Hero banner (featured movie)
│   │   │   ├── MovieCard.jsx       # Individual movie card với hover effect
│   │   │   └── Row.jsx             # Horizontal scrollable movie row
│   │   │
│   │   ├── common/
│   │   │   ├── NetflixSpinner.jsx  # Loading spinner
│   │   │   └── NetflixSpinner.css
│   │   │
│   │   ├── Hero/
│   │   │   └── Hero.tsx            # Landing page hero section
│   │   │
│   │   ├── landing/                # Landing page components
│   │   │   ├── HeroSection.jsx
│   │   │   ├── FeatureSection.jsx
│   │   │   ├── FAQSection.jsx
│   │   │   ├── AccordionItem.jsx
│   │   │   ├── FeatureCard.jsx
│   │   │   ├── TrendingSection.jsx
│   │   │   ├── LandingHeader.jsx
│   │   │   └── LandingFooter.jsx
│   │   │
│   │   ├── Modal/
│   │   │   └── MovieModal.jsx      # Movie detail modal overlay
│   │   │
│   │   ├── MovieRow/
│   │   │   └── MovieRow.tsx        # Alternative row implementation
│   │   │
│   │   ├── Navbar/
│   │   │   └── Navbar.tsx          # Main navigation (search, profile menu)
│   │   │                           # 🔧 Recently fixed: search init from URL,
│   │   │                           # avoid setState-in-effect cascading renders
│   │   │
│   │   ├── Profile/                # Profile management
│   │   │   ├── EditProfileModal.jsx
│   │   │   ├── ImmersivePinModal.jsx
│   │   │   ├── PinEntryModal.jsx
│   │   │   ├── PremiumAvatarPicker.jsx
│   │   │   └── PremiumToggleSwitch.jsx
│   │   │
│   │   └── Search/
│   │       └── SearchOverlay.jsx   # Search dropdown overlay
│   │
│   ├── config/
│   │   ├── firebase.js             # Firebase init + auth/firestore helpers
│   │   ├── emailAuth.js            # Email authentication helpers
│   │   └── firebaseTest.js         # Manual Firebase connection test
│   │
│   ├── constants/
│   │   └── avatars.js              # Avatar list for profile selection
│   │
│   ├── context/
│   │   ├── ModalContext.jsx        # Global modal state (movie details)
│   │   └── TransitionContext.jsx   # Cinematic transition state
│   │
│   ├── hooks/
│   │   └── useInfiniteScroll.js    # Infinite scroll hook (nếu dùng)
│   │
│   ├── pages/                       # Page-level components (routed)
│   │   ├── Auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupStep1.jsx     # Multi-step signup
│   │   │   ├── SignupStep2.jsx
│   │   │   ├── SignupStep3.jsx
│   │   │   └── CompleteSignupPage.jsx
│   │   │
│   │   ├── Browse/
│   │   │   └── BrowsePage.jsx      # Main browse page (Billboard + Rows)
│   │   │
│   │   ├── Debug/
│   │   │   └── SignupDebug.jsx     # Debug utility page
│   │   │
│   │   ├── Home/
│   │   │   └── Home.tsx            # Landing/home page
│   │   │
│   │   ├── Landing/
│   │   │   └── LandingPage.jsx     # Alternative landing page
│   │   │
│   │   ├── MyList/
│   │   │   └── MyList.jsx          # User's saved movies (Firestore)
│   │   │
│   │   ├── Player/
│   │   │   ├── Player.jsx          # Video player (YouTube embed)
│   │   │   └── Player_BACKUP.jsx   # Backup version
│   │   │
│   │   ├── Profile/
│   │   │   ├── ProfilePage.jsx     # Profile selection/management
│   │   │   └── ProfileGate.jsx     # Profile auth guard
│   │   │
│   │   └── Search/
│   │       └── Search.jsx          # Search results page
│   │
│   └── utils/
│       ├── tmdbApi.js              # TMDB API utility functions
│       └── testCinematicTransition.js  # Manual test suite for splash
│
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS config
├── postcss.config.js                # PostCSS config
├── tsconfig.json                    # TypeScript config (root)
├── tsconfig.app.json                # TypeScript config (app)
├── tsconfig.node.json               # TypeScript config (Vite)
├── eslint.config.js                 # ESLint configuration
├── package.json                     # Dependencies & scripts
├── netlify.toml                     # Netlify deployment config
└── _redirects                       # SPA routing redirects (Netlify)
```

### Kiến trúc tổng quan

**1. Frontend Architecture (React SPA)**

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
├─────────────────────────────────────────────────────────────┤
│  React Router DOM (Client-side routing)                     │
│  ├─ / (Landing/Home)                                        │
│  ├─ /login, /signup                                         │
│  ├─ /profiles (Profile selection)                           │
│  ├─ /browse (Main app - Billboard + Rows)                   │
│  ├─ /search?q=...                                           │
│  ├─ /my-list                                                │
│  └─ /player/:id                                             │
├─────────────────────────────────────────────────────────────┤
│  State Management                                           │
│  ├─ React Context (Modal, Transition)                       │
│  ├─ Local State (useState, useReducer)                      │
│  └─ Firebase Real-time subscriptions (Firestore)            │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│  Firebase (BaaS)                                            │
│  ├─ Authentication (Email/Password)                         │
│  ├─ Firestore (User profiles, saved shows)                  │
│  └─ Storage (Avatar images - nếu dùng)                      │
├─────────────────────────────────────────────────────────────┤
│  TMDB API (The Movie Database)                              │
│  ├─ Movie metadata, posters, trailers                       │
│  ├─ Search, trending, genres                                │
│  └─ Video keys (YouTube trailer IDs)                        │
├─────────────────────────────────────────────────────────────┤
│  YouTube Embed API (react-youtube)                          │
│  └─ Trailer/video playback                                  │
└─────────────────────────────────────────────────────────────┘
```

**2. Data Flow (Auth & Saved Shows)**

```
User Login (Firebase Auth)
     ↓
Get UID
     ↓
Load Profiles (Firestore: users/{uid}/profiles/)
     ↓
Select Profile → Store in localStorage("current_profile")
     ↓
Subscribe to Saved Shows (Firestore: users/{uid}/profiles/{profileId}/savedShows/)
     ↓
Real-time updates when user adds/removes movies
```

**3. Component Hierarchy (Browse Page Example)**

```
BrowsePage.jsx
├─ Navbar.tsx                      # Search, profile menu
├─ Billboard.jsx                   # Featured movie hero
│  ├─ Play button → /player/:id
│  └─ More Info → MovieModal
├─ Row.jsx (multiple instances)    # Horizontal scrollable rows
│  └─ MovieCard.jsx (multiple)     # Individual movie cards
│     ├─ Hover effects (scale, shadow)
│     └─ onClick → MovieModal (detail overlay)
└─ MovieModal.jsx (context-based)  # Modal overlay (details, trailer, add to list)
```

### Logic & Flow chính

**Authentication Flow:**

1. User → `/login` hoặc `/signup`
2. Firebase Auth → tạo user (UID)
3. Redirect → `/profiles` (chọn/tạo profile)
4. Store `current_profile` in localStorage
5. Navigate → `/browse`

**Search Flow (Navbar.tsx):**

1. User types in search input (debounced 300ms)
2. Navigate to `/search?q={query}`
3. `Search.jsx` component reads query from URL params
4. Fetch results from TMDB API
5. Display results in grid/list
6. **Recent fix:** `searchKeyword` state is initialized from URL (`?q=`) on mount → avoids synchronous setState in effect → prevents cascading renders

**Save/Remove Movie (My List):**

1. User clicks "+ My List" button on MovieCard/Modal
2. Call `saveShow(uid, profileId, movieData)` → Firestore write
3. Real-time listener updates local state
4. UI reflects change immediately (icon switch, toast notification)

**Trailer Playback:**

1. Click "Play" or movie card → fetch video key from TMDB
2. If trailer exists → Navigate to `/player/:id`
3. `Player.jsx` embeds YouTube player (react-youtube)
4. If no trailer → show fallback message

### Quản lý State

- **Local State (useState/useReducer):** UI state (modals, search input, scroll, menu visibility)
- **Context API:**
  - `ModalContext`: quản lý movie detail modal (open/close, current movie)
  - `TransitionContext`: cinematic splash state (played, skipped, timeout)
- **Firebase Real-time:** Firestore subscriptions cho saved shows → auto-sync across devices
- **URL State:** Search query (`?q=`) synced with input (React Router's `useSearchParams`)

### TypeScript Migration Status

- **Current:** Partial TypeScript adoption
  - `.tsx` files: `Navbar.tsx`, `App.tsx`, `Hero.tsx`, `MovieRow.tsx`, `Home.tsx`
  - `.jsx` files: Hầu hết components (Search, Billboard, Player, Profile...)
  - Config files (`.js`): `firebase.js`, `requests.js`, `tmdbApi.js`
- **Type Declarations:**
  - `src/vite-env.d.ts` contains quick module declarations for `*.js`/`*.jsx` imports
  - Some imports use `// @ts-expect-error` temporarily (e.g., `firebase`, `SearchOverlay` in Navbar)
- **Goal:** Gradually convert all `.jsx` → `.tsx` and add proper `.d.ts` for JS modules

## ĐÓNG GÓP

Mong nhận PR hợp lệ:

- Fork repository → Tạo branch `feat/your-feature` hoặc `fix/issue-xxx`
- Viết test nếu có thể và đảm bảo lint pass
- Mô tả rõ thay đổi trong PR

---

## TÌNH TRẠNG DỰ ÁN & HẠN CHẾ HIỆN TẠI

### ✅ Đã hoàn thành (Recent Updates)

- **TypeScript Fixes (Navbar.tsx):**

  - ✅ Fixed "Could not find a declaration file" errors cho imports `.js`/`.jsx`
  - ✅ Khởi tạo `searchKeyword` từ URL (`?q=`) để tránh setState synchronously trong effect
  - ✅ Thêm proper dependencies vào useEffect (avoid React Hook warnings)
  - ✅ Async setState scheduling để tránh cascading renders
  - ✅ Quick module declarations trong `vite-env.d.ts`

- **UI/UX Enhancements:**
  - ✅ MovieCard hover effect không bị tràn lề
  - ✅ Navbar gradient tinh chỉnh cho scrolled state
  - ✅ Billboard "next section" support
  - ✅ Mobile-responsive search input width
  - ✅ Profile menu tap behavior cho mobile

### ⚠️ Hạn chế & Known Issues

**1. TypeScript / Types**

- ❌ Một số imports vẫn dùng `@ts-expect-error` (firebase, SearchOverlay) — cần viết `.d.ts` chính thức hoặc convert sang `.tsx`
- ❌ Nhiều components vẫn là `.jsx` chưa có type safety
- ❌ Config files (`firebase.js`, `tmdbApi.js`) chưa có type definitions

**2. Performance**

- ❌ Chưa lazy-load movie posters → có thể lag khi nhiều rows
- ❌ Chưa có virtualization cho long lists (react-window/react-virtual)
- ❌ Animations có thể stutter trên low-end devices

**3. Responsive & Layout**

- ⚠️ Đã tối ưu cho desktop 16:9, nhưng tablet/mobile cần test kỹ hơn
- ❌ Hover effects không thân thiện với touch devices (cần tap-to-expand alternative)
- ❌ Một số modals/overlays chưa có mobile-specific behaviors

**4. Accessibility (a11y)**

- ❌ Thiếu ARIA labels cho interactive elements
- ❌ Keyboard navigation chưa hoàn chỉnh (search, modals, movie cards)
- ❌ Focus traps cho overlays/menus chưa implement
- ❌ Screen reader support chưa test

**5. Testing**

- ❌ Chưa có unit tests cho components
- ❌ Chưa có E2E tests (search flow, auth, profile management)
- ❌ Chỉ có manual test suite cho cinematic transition
- ❌ No CI/CD pipeline với auto tests

**6. Security & Best Practices**

- ⚠️ `.env` đã được gitignore nhưng cần document rõ setup process
- ❌ Firestore security rules cần review (hiện tại chưa document trong README)
- ❌ API keys có thể bị expose trong client (TMDB key) — cần proxy server cho production

**7. Code Quality & Maintainability**

- ❌ Một số components quá lớn (cần refactor thành smaller pieces)
- ❌ Thiếu Storybook/component documentation
- ❌ Duplicate logic giữa `Row.jsx` và `MovieRow.tsx` (cần consolidate)
- ❌ Hardcoded strings (cần i18n cho multi-language)

---

## ROADMAP & KẾ HOẠCH PHÁT TRIỂN

### 🔥 Ưu tiên cao (1-3 ngày)

**Phase 1: Type Safety & Code Quality**

- [ ] Viết `.d.ts` chính thức cho `firebase.js` và các config modules
- [ ] Convert `SearchOverlay.jsx` → `SearchOverlay.tsx`
- [ ] Loại bỏ tất cả `@ts-expect-error` comments
- [ ] Setup ESLint strict rules + fix all warnings
- **Acceptance Criteria:** `npm run build` pass without type errors

**Phase 2: Testing Foundation**

- [ ] Setup Jest + React Testing Library
- [ ] Viết unit tests cho `Navbar.tsx` (search logic, debounce, URL sync)
- [ ] Viết unit tests cho `firebase.js` helpers
- [ ] Target coverage: ≥70% cho critical paths
- **Acceptance Criteria:** `npm run test` pass, coverage report generated

### 📅 Ngắn hạn (3-7 ngày)

**Phase 3: Responsive & Mobile Polish**

- [ ] Mobile QA checklist (iPhone, Android, các breakpoints)
- [ ] Touch-friendly movie card interactions (tap-to-expand thay vì hover)
- [ ] Profile menu mobile behavior
- [ ] Search overlay mobile layout
- **Acceptance Criteria:** Manual QA pass trên ≥3 devices, visual regression tests

**Phase 4: Accessibility (a11y)**

- [ ] Add ARIA labels cho buttons, inputs, modals
- [ ] Implement keyboard navigation (Tab, Enter, Esc)
- [ ] Focus trap cho modals/overlays
- [ ] Run axe-core audit và fix critical issues
- **Acceptance Criteria:** Axe score ≤5 violations (low severity), keyboard nav working

**Phase 5: E2E Testing**

- [ ] Setup Playwright hoặc Cypress
- [ ] E2E test: Auth flow (signup → login → logout)
- [ ] E2E test: Search flow (input → results → navigation)
- [ ] E2E test: My List (add → verify → remove)
- **Acceptance Criteria:** E2E suite pass trên CI

### 🗓️ Trung hạn (1-3 tuần)

**Phase 6: Performance Optimization**

- [ ] Implement lazy loading cho movie posters (Intersection Observer)
- [ ] Add virtualization cho long rows (react-window)
- [ ] Optimize images (WebP, lazy loading, placeholders)
- [ ] Code splitting (React.lazy cho routes)
- [ ] Lighthouse audit + performance improvements
- **Acceptance Criteria:** Lighthouse performance score ≥85, FCP <2s

**Phase 7: Component Library & Documentation**

- [ ] Setup Storybook
- [ ] Extract reusable components (Button, Card, Modal base)
- [ ] Add stories cho main components
- [ ] Snapshot tests với Storybook
- [ ] Component API documentation
- **Acceptance Criteria:** Storybook deployed, ≥80% components documented

**Phase 8: Feature Enhancements**

- [ ] Billboard "next section" animation polish
- [ ] Advanced search filters (genre, year, rating)
- [ ] Movie detail page (thay vì chỉ modal)
- [ ] Watch history tracking
- [ ] Recommendations based on watch history
- **Acceptance Criteria:** Features tested và documented

### 🚀 Dài hạn (>3 tuần)

**Phase 9: Internationalization (i18n)**

- [ ] Setup i18next hoặc react-intl
- [ ] Extract hardcoded strings
- [ ] Add language switcher (EN, VI)
- [ ] RTL support (nếu cần)
- **Acceptance Criteria:** App hoạt động ≥2 languages

**Phase 10: Backend & Advanced Features**

- [ ] Build proxy server cho TMDB API (hide API keys)
- [ ] Implement real video streaming (thay vì chỉ trailers)
- [ ] User analytics (view tracking, engagement metrics)
- [ ] A/B testing framework
- [ ] Social features (share, comments, ratings)
- **Acceptance Criteria:** Backend deployed, features documented

**Phase 11: DevOps & CI/CD**

- [ ] Setup GitHub Actions pipeline
  - Lint → Type check → Unit tests → E2E tests
- [ ] Staging environment (preview deployments)
- [ ] Production deployment automation
- [ ] Monitoring & error tracking (Sentry)
- [ ] Performance monitoring (Lighthouse CI)
- **Acceptance Criteria:** Zero-touch deployment, auto-rollback on failures

---

## HƯỚNG DẪN PHÁT TRIỂN (Development Guide)

### Quy ước code (Code Conventions)

**File Naming:**

- Components: PascalCase (e.g., `MovieCard.jsx`, `Navbar.tsx`)
- Utilities: camelCase (e.g., `tmdbApi.js`, `useInfiniteScroll.js`)
- Pages: PascalCase (e.g., `BrowsePage.jsx`, `LoginPage.jsx`)

**Component Structure:**

```jsx
// Imports (React, libraries, components, utils, types)
import { useState } from 'react';
import { motion } from 'framer-motion';
import SomeComponent from './SomeComponent';

// Types/Interfaces (nếu TypeScript)
interface Props { ... }

// Component
const MyComponent = ({ prop1, prop2 }: Props) => {
  // Hooks (order: state, refs, router, custom)
  const [state, setState] = useState();
  const ref = useRef();

  // Effects
  useEffect(() => { ... }, []);

  // Handlers
  const handleClick = () => { ... };

  // Render
  return (
    <div>...</div>
  );
};

export default MyComponent;
```

**CSS/Styling:**

- Dùng TailwindCSS utility classes (ưu tiên)
- Framer Motion cho animations
- Tránh inline styles trừ khi dynamic (e.g., gradient based on scroll)

**State Management:**

- Local state: `useState` cho UI state (toggle, input values)
- Shared state: Context API (Modal, Transition)
- Server state: Firebase subscriptions + local cache
- URL state: `useSearchParams` cho search/filters

### Branching Strategy

```
master (main)                    # Production-ready code
  ├─ feat/feature-name           # New features
  ├─ fix/issue-description       # Bug fixes
  ├─ chore/task-name             # Refactoring, dependencies
  └─ docs/update-readme          # Documentation updates
```

**Branch Naming:**

- `feat/` — new features (e.g., `feat/advanced-search`)
- `fix/` — bug fixes (e.g., `fix/navbar-search-state`)
- `chore/` — maintenance (e.g., `chore/upgrade-dependencies`)
- `docs/` — documentation (e.g., `docs/add-api-guide`)

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation
- `style`: formatting, CSS
- `refactor`: code restructure (no behavior change)
- `test`: add/update tests
- `chore`: build, dependencies, tools

**Example:**

```
feat(search): initialize searchKeyword from URL query

- Initialize state from useSearchParams to avoid setState in effect
- Add proper dependencies to useEffect
- Schedule async state updates to prevent cascading renders
- Fixes ts(7016) and eslint(react-hooks/set-state-in-effect)
```

### Pull Request Template

```markdown
### Tóm tắt

(Mô tả ngắn gọn về PR)

### Thay đổi chính (Changelog)

- [ ] Feature 1
- [ ] Fix issue X
- [ ] Refactor component Y

### Nhược điểm / Trade-offs

(Nếu có)

### Checklist

- [ ] Code pass lint (`npm run lint`)
- [ ] TypeScript pass (`npm run build`)
- [ ] Manual testing completed
- [ ] Tests added/updated (if applicable)
- [ ] Documentation updated (if applicable)

### Preview

(Screenshots/GIFs)

### Testing Steps

1. Step 1
2. Step 2
3. Expected result
```

### Debug & Troubleshooting Tips

**Firebase Connection Issues:**

```bash
# Test Firebase connection
node src/config/firebaseTest.js
```

**TMDB API Issues:**

```javascript
// Check API key và network
console.log("TMDB Key:", import.meta.env.VITE_TMDB_API_KEY);
// Expected: string (not undefined)
```

**TypeScript Errors:**

```bash
# Check types without building
npx tsc --noEmit

# Specific file
npx tsc --noEmit src/components/Navbar/Navbar.tsx
```

**Search State Issues (Navbar):**

```javascript
// Debug URL sync
useEffect(() => {
  console.log("URL query:", urlSearchQuery);
  console.log("State:", searchKeyword);
  console.log("Match:", searchKeyword === urlSearchQuery);
}, [urlSearchQuery, searchKeyword]);
```

**Firestore Security Rules (Development):**

```javascript
// Test mode (UNSAFE for production)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Performance Profiling:**

```javascript
// React DevTools Profiler
// Or manual timing
const start = performance.now();
// ... code
console.log("Duration:", performance.now() - start);
```

---

## API REFERENCE & INTEGRATION

### Firebase Helpers (`src/config/firebase.js`)

**Authentication:**

```javascript
// Sign up
await signup(email, password);
// Returns: { user, error }

// Log in
await login(email, password);
// Returns: { user, error }

// Log out
await logout();
```

**Profile Management:**

```javascript
// Create profile
await createProfile(uid, { name, avatar, isPinProtected, pin, isKidsProfile });

// Update profile
await updateProfile(uid, profileId, updates);

// Delete profile
await deleteProfile(uid, profileId);

// Get profiles
const profiles = await getProfiles(uid);
```

**Saved Shows:**

```javascript
// Save movie to My List
await saveShow(uid, profileId, movieData);
// movieData: { id, title, poster_path, ... }

// Remove from My List
await removeShow(uid, profileId, movieId);

// Real-time subscription
const unsubscribe = subscribeToSavedShows(uid, profileId, (shows) => {
  console.log("Saved shows updated:", shows);
});
// Remember to call unsubscribe() on cleanup
```

### TMDB API (`src/utils/tmdbApi.js`)

**Endpoints (from `src/api/requests.js`):**

```javascript
const requests = {
  fetchTrending: "/trending/all/week",
  fetchNetflixOriginals: "/discover/tv?with_networks=213",
  fetchTopRated: "/movie/top_rated",
  fetchActionMovies: "/discover/movie?with_genres=28",
  fetchComedyMovies: "/discover/movie?with_genres=35",
  fetchHorrorMovies: "/discover/movie?with_genres=27",
  fetchRomanceMovies: "/discover/movie?with_genres=10749",
  fetchDocumentaries: "/discover/movie?with_genres=99",
};
```

**Common Patterns:**

```javascript
// Fetch movies
const response = await axios.get(
  `${TMDB_BASE_URL}${requests.fetchTrending}?api_key=${TMDB_API_KEY}`
);
const movies = response.data.results;

// Get movie details
const details = await axios.get(
  `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`
);

// Get trailer
const videos = await axios.get(
  `${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`
);
const trailer = videos.data.results.find((v) => v.type === "Trailer");
```

**Image URLs:**

```javascript
// Poster
const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

// Backdrop (for Billboard)
const backdropUrl = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
```

### YouTube Player (`react-youtube`)

```javascript
import YouTube from "react-youtube";

<YouTube
  videoId={trailerKey}
  opts={{
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
    },
  }}
  onReady={handleReady}
  onError={handleError}
/>;
```

---

## FIRESTORE DATA SCHEMA

### Structure

```
users/
  {uid}/                           # Firebase Auth UID
    profiles/                      # Subcollection
      {profileId}/                 # Auto-generated ID
        name: string
        avatar: string             # URL or path
        isPinProtected: boolean
        pin: string (hashed)       # Nếu có
        isKidsProfile: boolean
        createdAt: timestamp

        savedShows/                # Subcollection
          {movieId}/               # TMDB movie ID
            id: number
            title: string
            poster_path: string
            backdrop_path: string
            overview: string
            release_date: string
            vote_average: number
            savedAt: timestamp
```

### Security Rules (Production - Example)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User must be authenticated
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Profiles belong to user
      match /profiles/{profileId} {
        allow read, write: if request.auth.uid == userId;

        // Saved shows belong to profile
        match /savedShows/{movieId} {
          allow read, write: if request.auth.uid == userId;
        }
      }
    }
  }
}
```

---

## DEPLOYMENT

### Netlify (Current Setup)

**Configuration (`netlify.toml`):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Environment Variables (Netlify Dashboard):**

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_TMDB_API_KEY`
- `VITE_TMDB_BASE_URL`

**Deploy Steps:**

1. Push to `master` branch
2. Netlify auto-builds and deploys
3. Check build logs for errors
4. Preview deploy at provided URL

### Alternative Deployment (Vercel, Firebase Hosting)

**Vercel:**

```bash
npm install -g vercel
vercel --prod
```

**Firebase Hosting:**

```bash
npm run build
firebase deploy --only hosting
```

---

## MONITORING & ANALYTICS

### Recommended Tools

**Error Tracking:**

- Sentry (React integration)
- LogRocket (session replay)

**Performance:**

- Lighthouse CI
- Web Vitals tracking
- Firebase Performance Monitoring

**Analytics:**

- Google Analytics 4
- Firebase Analytics
- Mixpanel (user behavior)

**Example Integration (Sentry):**

```bash
npm install @sentry/react
```

```javascript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

---

## FAQ & COMMON QUESTIONS

**Q: Tại sao một số components là `.jsx` và một số là `.tsx`?**
A: Đang trong quá trình migration từ JS sang TypeScript. Ưu tiên convert các components phức tạp/critical trước (Navbar, App), sau đó dần chuyển toàn bộ.

**Q: `@ts-expect-error` trong Navbar là gì?**
A: Tạm thời bỏ qua lỗi TypeScript cho imports `.js`/`.jsx` chưa có type definitions. Roadmap: viết `.d.ts` chính thức hoặc convert sang `.tsx`.

**Q: Làm sao biết Firebase đã connect?**
A: Chạy `node src/config/firebaseTest.js` hoặc check Network tab (XHR requests tới `firebaseio.com`).

**Q: TMDB API rate limit là bao nhiêu?**
A: Free tier: 40 requests/10 seconds. Production nên cache hoặc dùng backend proxy.

**Q: Tại sao có cả `Row.jsx` và `MovieRow.tsx`?**
A: Legacy code. `MovieRow.tsx` là version TypeScript mới hơn. Nên consolidate về 1 version.

**Q: Saved shows có sync across devices không?**
A: Có, vì dùng Firestore real-time subscriptions. Khi add/remove movie trên device A, device B tự động update.

**Q: Làm sao test cinematic transition?**
A: Dùng manual test suite trong `src/utils/testCinematicTransition.js`. Follow instructions để test slow network, autoplay block, rapid clicks, etc.

**Q: Profile PIN có bảo mật không?**
A: Hiện tại chưa hash đủ mạnh. Roadmap: dùng bcrypt hoặc Firebase Auth custom claims cho production.

**Q: Responsive design tối ưu cho breakpoints nào?**
A: Desktop (≥1024px) đã polish. Mobile (<768px) và tablet (768-1024px) cần test/improve thêm.

---

## LICENSE

- Mã nguồn này được cung cấp cho mục đích học tập/demo. (Bạn có thể thêm license như MIT nếu muốn)

---

Made with ❤️ by vanhuy2005
