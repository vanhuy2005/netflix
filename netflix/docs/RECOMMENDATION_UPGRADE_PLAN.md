
---

# 🚀 Kế hoạch Nâng cấp & Scale-up Hệ thống Gợi ý Phim (Recommendation Engine)

## 📋 Tổng quan

Chuyển đổi logic gợi ý phim từ Client-side (React Hook) sang Serverless (Firebase Cloud Functions) nhằm giải quyết vấn đề bảo mật API Key, tối ưu chi phí Firestore và chuẩn bị hạ tầng cho việc scale lên hàng ngàn người dùng.

| Tiêu chí | Hiện tại (Client-side) | Tương lai (Serverless/Backend) |
| --- | --- | --- |
| **Bảo mật** | Thấp (Lộ API Key, Logic) | Cao (Logic & Key nằm ở Server) |
| **Chi phí DB** | Cao (Read nhiều docs thừa) | Tối ưu (Chỉ read data cần thiết) |
| **Hiệu năng** | Phụ thuộc device người dùng | Ổn định (Server xử lý) |
| **Khả năng Scale** | Rủi ro (Dễ bị Rate Limit) | Tốt (Có Caching layer) |

---

## 📅 Lộ trình Triển khai

### Giai đoạn 1: Tối ưu Chi phí & Performance ngay lập tức (Tuần 1)

**Mục tiêu:** Giảm số lượng Read Operations trên Firestore và giảm tải cho Client mà chưa cần viết Backend mới.

#### 1.1. Denormalize dữ liệu "My List"

* **Vấn đề:** Hiện tại `getDocs(savedRef)` đọc toàn bộ subcollection `savedShows`. Nếu user lưu 100 phim, tốn 100 reads mỗi lần load.
* **Giải pháp:** Lưu thêm một mảng `savedMovieIds` (chỉ chứa ID) ngay trong document `profile`.
* **Schema thay đổi:**
```json
// users/{uid}/profiles/{profileId}
{
  "name": "Huy",
  "avatar": "...",
  "savedMovieIds": [123, 456, 789, ...] // <--- Thêm field này
}

```


* **Hành động:**
* Viết script migration để update các profile cũ.
* Sửa logic nút "Add to My List": Cập nhật đồng thời cả subcollection (để hiển thị chi tiết) và array `savedMovieIds` (để filter nhanh).
* Trong `useSmartRecommendations`: Thay vì `getDocs`, chỉ cần lấy `user.currentProfile.savedMovieIds`.

Đây là hướng dẫn thực hiện chi tiết **Giai đoạn 1.1: Denormalize dữ liệu (Chuẩn hóa lại dữ liệu)**.

Mục tiêu của bước này là giúp bạn **không cần** gọi `getDocs` vào collection `savedShows` mỗi khi cần lọc phim nữa. Thay vào đó, danh sách ID phim đã lưu sẽ có sẵn ngay trong thông tin Profile.

---

### 1. Thay đổi cấu trúc Database (Schema Change)

Chúng ta sẽ không xóa dữ liệu cũ, chỉ thêm một field mới để truy xuất nhanh.

* **Hiện tại:** Bạn phải vào collection con để lấy danh sách.
* `users/{uid}/profiles/{profileId}/savedShows/{movieId}`


* **Mới:** Thêm field `savedMovieIds` vào document Profile.
* `users/{uid}/profiles/{profileId}`
* Data: `{ name: "Huy", avatar: "...", savedMovieIds: [101, 204, 550] }`



---

### 2. Các bước thực hiện (Code Implementation)

#### Bước 1: Chạy Script Migration (Dữ liệu cũ)

Vì bạn đã có user và dữ liệu cũ, bạn cần một script chạy 1 lần duy nhất để "copy" ID từ collection con ra ngoài document cha.

Bạn có thể tạo một file tạm `migrate.js` trong dự án (hoặc chạy logic này trong một `useEffect` tạm thời ở trang Admin nếu lười setup Node script riêng). Dưới đây là logic JS:

```javascript
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";

const migrateSavedShows = async () => {
  const db = getFirestore();
  console.log("🚀 Bắt đầu migrate dữ liệu...");

  // 1. Lấy tất cả users (cẩn thận nếu user quá đông, đây là code cho quy mô nhỏ)
  const usersSnapshot = await getDocs(collection(db, "users"));
  
  for (const userDoc of usersSnapshot.docs) {
    // 2. Lấy tất cả profiles của user đó
    const profilesRef = collection(db, "users", userDoc.id, "profiles");
    const profilesSnapshot = await getDocs(profilesRef);

    for (const profileDoc of profilesSnapshot.docs) {
      // 3. Lấy savedShows của profile này
      const savedShowsRef = collection(db, "users", userDoc.id, "profiles", profileDoc.id, "savedShows");
      const savedSnapshot = await getDocs(savedShowsRef);

      if (!savedSnapshot.empty) {
        // 4. Tạo mảng chỉ chứa ID
        const savedIds = savedSnapshot.docs.map(doc => doc.data().id); // hoặc doc.id tùy cách bạn lưu
        
        // 5. Update ngược lại vào profile doc
        await updateDoc(doc(profilesRef, profileDoc.id), {
          savedMovieIds: savedIds
        });
        
        console.log(`✅ Đã update profile ${profileDoc.id}: ${savedIds.length} phim.`);
      }
    }
  }
  console.log("🏁 Hoàn tất migration!");
};

```

#### Bước 2: Cập nhật hàm "Toggle My List" (Logic Ghi)

Khi người dùng bấm nút "Lưu phim" hoặc "Bỏ lưu", bạn phải cập nhật **cả 2 nơi** cùng lúc.
Sử dụng `arrayUnion` và `arrayRemove` của Firestore là cách an toàn nhất.

Tìm hàm xử lý việc lưu phim của bạn và sửa như sau:

```javascript
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";

// Hàm toggle (Lưu/Bỏ lưu)
const handleToggleMyList = async (movie) => {
  const db = getFirestore();
  const profileRef = doc(db, "users", user.uid, "profiles", profileId);
  const savedShowRef = doc(db, "users", user.uid, "profiles", profileId, "savedShows", movie.id.toString());

  try {
    if (isSaved) {
      // TRƯỜNG HỢP: XÓA KHỎI LIST
      await Promise.all([
        // 1. Xóa chi tiết trong subcollection
        deleteDoc(savedShowRef),
        // 2. Xóa ID khỏi mảng ở profile (Rất quan trọng)
        updateDoc(profileRef, {
          savedMovieIds: arrayRemove(movie.id) 
        })
      ]);
      setIsSaved(false);
    } else {
      // TRƯỜNG HỢP: THÊM VÀO LIST
      await Promise.all([
        // 1. Lưu chi tiết vào subcollection (để hiển thị trang My List)
        setDoc(savedShowRef, {
            id: movie.id,
            title: movie.title || movie.name,
            backdrop_path: movie.backdrop_path,
            // ...các field khác
        }),
        // 2. Thêm ID vào mảng ở profile (để filter nhanh)
        updateDoc(profileRef, {
          savedMovieIds: arrayUnion(movie.id)
        })
      ]);
      setIsSaved(true);
    }
  } catch (error) {
    console.error("Lỗi cập nhật My List:", error);
  }
};

```

#### Bước 3: Cập nhật Hook `useSmartRecommendations` (Logic Đọc)

Đây là phần quan trọng nhất giúp tối ưu chi phí.

Trong file `useSmartRecommendations.js`:

1. **Xóa** đoạn code `getDocs(savedRef)`.
2. **Thay thế** bằng logic lấy từ `user` object (hoặc `currentProfile`).

```javascript
// ... import bỏ bớt getDocs, query, collection ...

export const useSmartRecommendations = (user, profileId) => {
  // ... state ...

  useEffect(() => {
    // ... validation ...

    const executeRecommendationEngine = async () => {
        // ... Step 1: Get History ...
        // ... Step 2: Check Cache ...
        // ... Step 3: Decay ...
        
        // ========================================
        // TỐI ƯU HÓA Ở ĐÂY (PHASE 1.1)
        // ========================================
        // Thay vì gọi API Firestore tốn tiền:
        // const savedSnapshot = await getDocs(savedRef); 
        
        // Chúng ta lấy trực tiếp từ data Profile đã load sẵn ở App Context
        // Giả sử object `user` hoặc `profile` bạn truyền vào đã có field `savedMovieIds`
        // (Bạn cần đảm bảo lúc login/chọn profile, bạn đã fetch field này về)
        
        const savedIds = new Set(user?.currentProfile?.savedMovieIds || []);
        
        console.log(
          `📋 [Recs] Filter nhanh bằng Profile Data: ${savedIds.size} phim trong Blacklist.`
        );

        // ... Step 4: Fetch TMDB ...
        // ... Step 5: Scoring (Giữ nguyên logic check savedIds.has(movie.id)) ...
    }
  }, [user, profileId]);
};

```

---

### 3. Checklist kiểm tra sau khi làm

Để đảm bảo giai đoạn 1.1 thành công, hãy kiểm tra 3 điều sau:

1. [ ] **Dữ liệu cũ:** Vào Firebase Console, xem thử document Profile của user cũ đã xuất hiện field `savedMovieIds: [...]` chưa?
2. [ ] **Chức năng mới:** Bấm lưu 1 phim mới, reload lại Firebase Console, field mảng đó có thêm ID mới không?
3. [ ] **Performance:** Mở tab Network hoặc Console log, reload trang chủ. Dòng log `📋 [Recs] My List has...` phải hiện ra số lượng đúng **mà không** sinh ra request `Firestore (GetDocs)` nào trong tab Network cho việc lấy saved shows.


#### 1.2. Client-side Optimization

* **Lazy Execution:** Sử dụng `IntersectionObserver` để wrap component `RecommendationRow`. Chỉ khi user cuộn chuột gần tới nơi mới bắt đầu chạy hook `useSmartRecommendations`.
* **Tăng Cache Time:** Sửa hằng số `CACHE_DURATION` từ 15 phút lên 3 tiếng (hoặc lưu vào `sessionStorage` thay vì `localStorage` để clear khi đóng tab).
Chào bạn, đây là hướng dẫn chi tiết cho **Giai đoạn 1.2: Client-side Optimization**.

Mục tiêu của giai đoạn này là **"Không làm thì không tốn"**. Chúng ta sẽ ngăn chặn việc chạy thuật toán tính toán và gọi API khi người dùng chưa thực sự cuộn xuống phần "Gợi ý phim". Đồng thời, chúng ta sẽ tối ưu bộ nhớ đệm để giảm số lần gọi lại API trong ngày.

---

### 1. Nâng cấp Lazy Loading (Tải khi cần thiết)

Hiện tại, ngay khi trang chủ load, `RecommendationRow` được render và Hook `useSmartRecommendations` chạy ngay lập tức. Nếu user chỉ xem Banner rồi tắt máy, bạn đã lãng phí tài nguyên tính toán và API quota.

Chúng ta sẽ sử dụng `IntersectionObserver` để chỉ kích hoạt Hook khi người dùng cuộn đến gần khu vực hiển thị.

#### Bước 1: Sửa Hook `useSmartRecommendations.js`

Chúng ta cần thêm tham số `enabled` vào hook. Nếu `enabled = false`, hook sẽ "ngủ đông".

```javascript
// hooks/useSmartRecommendations.js

// Thêm tham số isEnabled (mặc định là true để tương thích ngược nếu cần)
export const useSmartRecommendations = (user, profileId, isEnabled = true) => {
  const [data, setData] = useState({
    movies: [],
    reason: "",
    loading: false, // Mặc định là false để không hiện Skeleton khi chưa scroll tới
  });

  useEffect(() => {
    // 1. Validation cơ bản
    if (!user || !profileId) return;

    // 2. CHẶN VÀNG: Nếu chưa được phép chạy thì return ngay
    if (!isEnabled) {
      return;
    }

    // Nếu đã enabled, set loading = true để bắt đầu quy trình
    setData(prev => ({ ...prev, loading: true }));

    const executeRecommendationEngine = async () => {
       // ... (Giữ nguyên toàn bộ logic cũ của bạn ở đây) ...
    };

    executeRecommendationEngine();
    
  // Thêm isEnabled vào dependency array
  }, [user, profileId, isEnabled]);

  return data;
};

```

#### Bước 2: Sửa Component `RecommendationRow.jsx`

Sử dụng một ref để theo dõi xem component đã lọt vào khung hình chưa.

```javascript
// components/RecommendationRow.jsx
import { useRef, useState, useEffect } from "react";
// ... imports cũ ...

const RecommendationRow = ({ user, profileId }) => {
  // State để kiểm soát khi nào được phép fetch
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Ref để gắn vào thẻ div bao ngoài
  const containerRef = useRef(null);

  // Truyền shouldFetch vào hook
  const { movies, reason, loading } = useSmartRecommendations(user, profileId, shouldFetch);

  // Logic Intersection Observer
  useEffect(() => {
    // Nếu đã fetch rồi thì không cần observe nữa (để tránh trigger lại không cần thiết)
    if (shouldFetch) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Nếu phần tử xuất hiện trong viewport (hoặc cách 200px)
        if (entry.isIntersecting) {
          console.log("👀 [UI] User đã cuộn tới phần Gợi ý -> Kích hoạt Engine!");
          setShouldFetch(true);
          observer.disconnect(); // Ngắt kết nối ngay để tiết kiệm tài nguyên
        }
      },
      {
        rootMargin: "200px", // Fetch trước khi user cuộn tới 200px để trải nghiệm mượt hơn
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [shouldFetch]);

  // Nếu chưa fetch và chưa có phim, render một placeholder rỗng có chiều cao
  // để Observer có thể bắt được
  if (!shouldFetch) {
    return <div ref={containerRef} className="w-full h-40" />; // Chiều cao ảo
  }

  // Nếu đang loading (sau khi đã scroll tới) -> Hiện Skeleton
  if (loading) return <RecommendationRowSkeleton />;
  
  // Nếu fetch xong mà không có phim -> Ẩn luôn
  if (movies.length === 0) return null;

  return (
    // Giữ nguyên code UI cũ của bạn
    <div className="relative w-full mb-4 md:mb-8 z-30 hover:z-50 group/row">
       {/* ... Nội dung UI ... */}
    </div>
  );
};

```

---

### 2. Tối ưu Chiến lược Cache (Caching Strategy)

Hiện tại bạn để cache 15 phút. Điều này hơi ngắn cho một hệ thống gợi ý phim (thường user không thay đổi gu phim nhanh thế trong 1 phiên xem).

#### Thay đổi trong `useSmartRecommendations.js`

```javascript
const CACHE_KEY_PREFIX = "netflix_recs_";

// CŨ: 15 phút
// const CACHE_DURATION = 1000 * 60 * 15; 

// MỚI: 3 Tiếng (Hoặc 4 tiếng tùy ý)
// Logic: Giảm thiểu việc user F5 trang web liên tục làm gọi lại API TMDB.
// User xem hết 1 phim (trung bình 2 tiếng) quay lại trang chủ vẫn thấy list cũ là OK.
const CACHE_DURATION = 1000 * 60 * 60 * 3; 

// BỔ SUNG: Max Age cho localStorage (Dọn rác)
// Nếu cache quá 24h thì coi như hỏng hẳn, cần xóa key để tránh đầy bộ nhớ
const MAX_CACHE_AGE = 1000 * 60 * 60 * 24; 

```

**Cập nhật logic check cache (trong hàm `executeRecommendationEngine`):**

```javascript
// ... trong đoạn check cached ...
if (cached) {
  try {
    const parsed = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    
    // Nếu cache quá cũ (trên 24h) -> Xóa luôn cho sạch localStorage
    if (age > MAX_CACHE_AGE) {
         localStorage.removeItem(cacheKey);
         // ... chạy logic fetch mới ...
    }
    
    // Logic Freshness như cũ, nhưng với CACHE_DURATION mới dài hơn
    const isFresh = age < CACHE_DURATION;
    // ...
  }
}

```

---

### 3. Checklist kiểm tra sau khi làm Giai đoạn 1.2

Sau khi code xong, hãy test như sau để đảm bảo hiệu quả:

1. **Test Lazy Loading:**
* Mở DevTools, tab **Network**. Clear hết log.
* Reload trang chủ, **đừng cuộn chuột**.
* Đảm bảo **không có** request nào gọi tới TMDB (endpoint `/recommendations`) hoặc log `🎬 [Recs] Fetching...`.
* Từ từ cuộn xuống dưới. Khi gần tới nơi, log Console `👀 [UI] User đã cuộn tới...` phải hiện ra, và lúc đó Network mới bắt đầu nhảy request.
* **Kết quả:** Tiết kiệm 100% request cho những user chỉ vào xem Banner rồi thoát.


2. **Test Cache:**
* Sau khi list hiện ra, thử F5 lại trang.
* Cuộn xuống lại chỗ đó.
* Log phải báo `✅ [Recs] Using fresh cache` và **không** có request mạng nào (trừ ảnh).
* Thời gian hiển thị phải gần như tức thì (Instant).



---

### Giai đoạn 2: Migration sang Cloud Functions (Tuần 2-3)

**Mục tiêu:** Chuyển logic tính toán về Backend, ẩn TMDB API Key.

#### 2.1. Thiết lập Firebase Cloud Functions

* Tạo function `getSmartRecommendations` (Callable Function).
* Di chuyển toàn bộ logic: Time Decay, Time-of-day Context, Weighted Scoring từ React sang Node.js environment.

#### 2.2. Xây dựng Caching Layer trên Firestore

Thay vì cache ở LocalStorage của trình duyệt (dễ mất), ta cache kết quả tính toán vào Firestore.

* **Logic Flow:**
1. **Client:** Gọi `functions.httpsCallable('getSmartRecommendations')({ profileId })`.
2. **Function:**
* Check doc `users/{uid}/profiles/{profileId}/recommendations/feed`.
* Nếu data tồn tại và `timestamp` < 4 tiếng -> Trả về data (Cost: 1 Read).
* Nếu không -> Gọi TMDB API -> Tính điểm -> Ghi đè vào Firestore (Cost: 1 Write) -> Trả về data.





#### 2.3. Refactor Client

* Hook `useSmartRecommendations` bây giờ sẽ cực kỳ gọn nhẹ, chỉ gọi Cloud Function và handle loading state.
⚠️ LƯU Ý QUAN TRỌNG VỀ BILLING: Để sử dụng Cloud Functions gọi ra API bên ngoài (như TMDB), dự án Firebase của bạn phải ở gói Blaze (Pay as you go).

Tuy nhiên, Google cho miễn phí 2 triệu lượt gọi function/tháng.

Với dự án cá nhân/portfolio, bạn sẽ không mất tiền thực tế (0đ), nhưng bạn cần thẻ VISA/Mastercard để kích hoạt gói này.

Bước 1: Thiết lập môi trường Backend
Khác với code React nằm ở thư mục gốc, code Backend sẽ nằm trong thư mục functions.

Cài đặt Firebase Tools (nếu chưa có):

Bash

npm install -g firebase-tools
Khởi tạo Functions: Tại thư mục gốc dự án:

Bash

firebase login
firebase init functions
Chọn: Javascript (hoặc TypeScript nếu bạn thạo).

Chọn: Use ESLint? -> No (để đỡ phức tạp lúc đầu).

Install dependencies? -> Yes.

Cài đặt thư viện cho Backend: Di chuyển vào thư mục functions và cài axios:

Bash

cd functions
npm install axios
Cấu hình API Key (Bảo mật): Thay vì để key trong .env ở React, ta set vào biến môi trường của Firebase.

Bash

firebase functions:config:set tmdb.key="YOUR_TMDB_API_KEY_HERE" tmdb.base_url="https://api.themoviedb.org/3"
Bước 2: Viết Code Cloud Function
Mở file functions/index.js. Chúng ta sẽ viết hàm getSmartRecommendations.

Logic ở đây giống 90% logic JS cũ của bạn, nhưng dùng firebase-admin để đọc DB và axios để gọi TMDB.

JavaScript

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// Config lấy từ command line ở Bước 1
const TMDB_KEY = functions.config().tmdb.key;
const TMDB_URL = functions.config().tmdb.base_url;

// Hàm hỗ trợ: Time Context
const getTimeContext = () => {
  const hour = new Date().getHours() + 7; // Giờ VN (UTC+7)
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
};

const TIME_GENRE_BOOST = {
  morning: [16, 10751, 99],
  afternoon: [28, 12, 35],
  evening: [27, 53, 18],
};

// ==========================================
// MAIN FUNCTION: onCall (Gọi từ Client)
// ==========================================
exports.getSmartRecommendations = functions.https.onCall(async (data, context) => {
  // 1. Bảo mật: Check xem user đã login chưa
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in."
    );
  }

  const userId = context.auth.uid;
  const { profileId } = data; // Client gửi profileId lên

  try {
    const db = admin.firestore();
    
    // ===========================
    // BƯỚC A: CHECK CACHE
    // ===========================
    const cacheRef = db.doc(`users/${userId}/profiles/${profileId}/recs/feed`);
    const cacheSnap = await cacheRef.get();
    
    // Cache 4 tiếng
    const CACHE_DURATION = 1000 * 60 * 60 * 4; 

    if (cacheSnap.exists) {
      const cacheData = cacheSnap.data();
      const age = Date.now() - cacheData.timestamp.toMillis();
      
      if (age < CACHE_DURATION) {
        console.log("✅ Serving from Firestore Cache");
        return cacheData.payload; // Trả về luôn, không gọi TMDB
      }
    }

    // ===========================
    // BƯỚC B: NẾU CACHE CŨ -> TÍNH TOÁN LẠI
    // ===========================
    console.log("🔄 Cache stale. Calculating new recs...");

    // 1. Lấy Profile Data (để lấy savedMovieIds - Kết quả của Giai đoạn 1.1)
    const profileRef = db.doc(`users/${userId}/profiles/${profileId}`);
    const profileSnap = await profileRef.get();
    const savedIds = new Set(profileSnap.data().savedMovieIds || []);

    // 2. Lấy Watch History (Seed)
    const historyRef = db.collection(`users/${userId}/profiles/${profileId}/watchHistory`);
    // Lấy 3 phim xem gần nhất
    const historySnap = await historyRef.orderBy("last_watched", "desc").limit(3).get();

    if (historySnap.empty) {
      return { movies: [], reason: "Hãy xem vài phim để nhận gợi ý nhé!" };
    }

    const seeds = historySnap.docs.map(doc => doc.data());
    const seedIds = new Set(seeds.map(s => s.id));

    // 3. Gọi TMDB API (Song song)
    const requests = seeds.map((seed) =>
      axios.get(`${TMDB_URL}/movie/${seed.id}/recommendations`, {
        params: { api_key: TMDB_KEY, language: "vi-VN" },
      })
    );

    const responses = await Promise.allSettled(requests);

    // 4. Scoring Algorithm (Logic cũ của bạn)
    const moviePool = {};
    const timeContext = getTimeContext();
    const boostedGenres = TIME_GENRE_BOOST[timeContext];

    responses.forEach((res, index) => {
      if (res.status === "fulfilled") {
        const results = res.value.data.results || [];
        // Tính Decay weight cho seed này
        const seedWeight = 1.0 - index * 0.2; 

        results.forEach((movie) => {
          // Filter: Bỏ phim đã lưu, bỏ phim seed, bỏ phim thiếu ảnh
          if (savedIds.has(movie.id) || seedIds.has(movie.id) || !movie.backdrop_path) return;

          if (!moviePool[movie.id]) {
            moviePool[movie.id] = { ...movie, score: 0 };
          }

          // Scoring đơn giản hóa cho demo
          let score = (movie.vote_average || 0) + (seedWeight * 2);
          
          // Boost theo giờ
          if (movie.genre_ids?.some(id => boostedGenres.includes(id))) {
            score += 2;
          }
          
          moviePool[movie.id].score += score;
        });
      }
    });

    // 5. Sort & Finalize
    const finalMovies = Object.values(moviePool)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Tạo Reason title
    let reason = "Gợi ý hàng đầu cho bạn";
    if (timeContext === "evening") reason = "Phim hay cho buổi tối";
    else if (historySnap.size > 0) reason = `Vì bạn đã xem ${seeds[0].title}`;

    const payload = { movies: finalMovies, reason };

    // ===========================
    // BƯỚC C: LƯU CACHE MỚI
    // ===========================
    await cacheRef.set({
      payload: payload,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return payload;

  } catch (error) {
    console.error("Lỗi Recommendation:", error);
    // Throw error để Client bắt được
    throw new functions.https.HttpsError("internal", "Lỗi hệ thống gợi ý.");
  }
});
Bước 3: Deploy lên Firebase
Chạy lệnh sau tại thư mục gốc:

Bash

firebase deploy --only functions
Quá trình này mất khoảng 2-3 phút. Nếu thành công, nó sẽ hiện URL (nhưng ta không dùng URL, ta dùng SDK).

Bước 4: Sửa Client (React Hook)
Bây giờ Hook của bạn sẽ cực kỳ gọn nhẹ. Nó không còn logic tính toán, chỉ gọi Server.

JavaScript

// hooks/useSmartRecommendations.js
import { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../config/firebase"; // File config firebase của bạn

export const useSmartRecommendations = (user, profileId, isEnabled = true) => {
  const [data, setData] = useState({ movies: [], reason: "", loading: false });

  useEffect(() => {
    if (!user || !profileId || !isEnabled) return;

    const fetchRecs = async () => {
      setData(prev => ({ ...prev, loading: true }));
      
      try {
        const functions = getFunctions(app);
        // Tên function phải khớp với tên trong exports.getSmartRecommendations ở backend
        const getRecsFunc = httpsCallable(functions, 'getSmartRecommendations');
        
        // Gọi hàm (truyền tham số profileId)
        const result = await getRecsFunc({ profileId: profileId });
        
        // Kết quả nằm trong result.data
        setData({ ...result.data, loading: false });
        
      } catch (error) {
        console.error("❌ Recs Error:", error);
        setData({ movies: [], reason: "", loading: false });
      }
    };

    fetchRecs();
  }, [user, profileId, isEnabled]);

  return data;
};
Bước 5: Dọn dẹp (Security)
Sau khi test thấy chạy ổn:

Vào file .env (hoặc .env.local) ở Client.

Xóa dòng VITE_TMDB_API_KEY.

Commit code.
---

### Giai đoạn 3: Nâng cao & Vector Search (Tương lai/Scale lớn)

**Mục tiêu:** Thoát khỏi sự phụ thuộc vào logic "Similar" của TMDB, tự xây dựng logic AI riêng.

#### 3.1. Tích hợp Vector Database (Pinecone/Typesense)

* Khi import phim vào hệ thống, tạo Vector Embedding cho phim đó (dựa trên Overview, Genre, Cast).
* Lưu Vector này vào Pinecone hoặc Typesense Cloud.

#### 3.2. Logic "More Like This" nâng cao

* Thay vì gọi TMDB, Cloud Function sẽ query Vector DB: "Tìm cho tôi 20 phim có nội dung *gần giống nhất* với 3 phim user vừa xem".
* Kết quả sẽ chính xác hơn rất nhiều vì nó dựa trên ngữ nghĩa nội dung, không chỉ là trùng genre.

---

## 🛠 Checklist Kỹ thuật chi tiết (Cho Giai đoạn 2)

### A. Backend (Cloud Function)

* [ ] Cài đặt môi trường: `firebase init functions`.
* [ ] Cài đặt dependencies: `axios`, `dayjs` (xử lý giờ giấc cho Time Context).
* [ ] Config Environment Variables: `firebase functions:config:set tmdb.key="YOUR_KEY"`.
* [ ] Implement `getSmartRecommendations`:
* [ ] Input validation (kiểm tra `profileId`).
* [ ] Firestore Cache Check.
* [ ] Fetch User Watch History (limit 3-5 items).
* [ ] Parallel Fetch TMDB (Promise.all).
* [ ] Scoring Logic (giữ nguyên logic JS hiện tại).
* [ ] Cache Update & Return.



### B. Frontend (React)

* [ ] Update `useSmartRecommendations`:
* [ ] Xóa logic axios gọi TMDB trực tiếp.
* [ ] Import `httpsCallable` từ Firebase SDK.
* [ ] Handle error states từ Function trả về.


* [ ] Xóa biến môi trường `VITE_TMDB_API_KEY` khỏi file `.env` (Security best practice).

---

## 💰 Ước tính rủi ro & Chi phí

| Hạng mục | Rủi ro / Chi phí | Giải pháp |
| --- | --- | --- |
| **Firestore Read/Write** | Tăng Write cost do caching ở server. | Chi phí Write rẻ hơn nhiều so với việc Read hàng loạt data thừa. Cache TTL 4 tiếng là cân bằng hợp lý. |
| **Cloud Function Invocations** | 2 triệu lần gọi miễn phí/tháng. | Với quy mô < 10,000 users, bạn vẫn nằm trong gói Free Tier (Spark/Blaze) của Firebase. |
| **Độ trễ (Latency)** | Cold start của Cloud Function (lần gọi đầu hơi chậm). | Set `minInstances: 0` (tiết kiệm) hoặc `minInstances: 1` (nhanh nhưng tốn tiền). Với App giải trí, user chấp nhận chờ 1-2s loading lần đầu. |

Đây là bản thiết kế chi tiết cho Giai đoạn 3: AI-Driven Recommendations (Vector Search).Đây là cấp độ "Senior Developer". Nếu bạn làm được phần này, project của bạn sẽ vượt xa các đồ án Clone Netflix thông thường. Bạn sẽ không còn phụ thuộc vào API "Similar" có sẵn của TMDB nữa, mà tự xây dựng "trí tuệ" riêng cho hệ thống.🧠 Khái niệm cốt lõi: Vector EmbeddingsTrước khi code, bạn cần hiểu cơ chế hoạt động.Thay vì so sánh từ khóa (Action = Action), chúng ta biến nội dung phim (Tóm tắt, thể loại, diễn viên) thành một dãy số (Vector).Phim A (Iron Man): [0.1, 0.5, 0.9, ...] (Vector mang ý nghĩa: Công nghệ, Giàu có, Anh hùng)Phim B (Batman): [0.1, 0.4, 0.8, ...] (Vector mang ý nghĩa: Công nghệ, Giàu có, Anh hùng, Tối tăm)Phim C (Notebook): [0.9, 0.1, 0.0, ...] (Vector mang ý nghĩa: Lãng mạn, Khóc, Tình yêu)=> Máy tính sẽ tính khoảng cách (Distance). Phim A và B nằm gần nhau trong không gian số -> Gợi ý cho nhau.🛠 Tech Stack cần thêmOpenAI API (Embeddings): Dùng model text-embedding-3-small (Rất rẻ, khoảng $0.02 cho 1 triệu token - gần như miễn phí với quy mô demo).Pinecone (Vector Database): Database chuyên dụng để lưu và tìm kiếm vector. (Gói Free Tier cho phép lưu ~100.000 vectors, quá đủ cho phim).🚀 Lộ trình triển khaiBước 3.1: Chuẩn bị dữ liệu (Data Ingestion Script)Bạn cần viết một script chạy 1 lần (Offline Script) để lấy dữ liệu phim từ TMDB, chuyển thành Vector và nạp vào Pinecone.Setup:Đăng ký tài khoản Pinecone, tạo Index tên netflix-movies, Dimension 1536 (chuẩn của OpenAI), Metric cosine.Cài thư viện: npm install @pinecone-database/pinecone openai dotenvCode mẫu (run-indexing.js):JavaScriptrequire('dotenv').config();
const axios = require('axios');
const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

async function indexMovies() {
  const index = pinecone.index('netflix-movies');
  
  // 1. Lấy danh sách phim Popular từ TMDB (Lấy khoảng 100-200 phim demo)
  console.log("Fetching movies from TMDB...");
  const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_KEY}&language=vi-VN&page=1`);
  const movies = tmdbRes.data.results;

  // 2. Tạo Vector cho từng phim
  const vectors = [];
  
  for (const movie of movies) {
    // Kết hợp thông tin để tạo ngữ nghĩa
    const textToEmbed = `Tiêu đề: ${movie.title}. Thể loại: ${movie.genre_ids.join(', ')}. Nội dung: ${movie.overview}.`;

    // Gọi OpenAI tạo embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: textToEmbed,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // Chuẩn bị record để đẩy lên Pinecone
    vectors.push({
      id: movie.id.toString(), // ID phim làm ID vector
      values: embedding,
      metadata: { // Lưu thêm thông tin để hiển thị luôn, đỡ phải query lại DB
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average
      }
    });
    console.log(`Processed: ${movie.title}`);
  }

  // 3. Upload lên Pinecone (Batch upload)
  await index.upsert(vectors);
  console.log("✅ Indexing complete!");
}

indexMovies();
Bước 3.2: Nâng cấp Cloud Function (Logic thông minh)Bây giờ chúng ta sửa lại hàm getSmartRecommendations trong Firebase Functions.Thay vì gọi TMDB API, ta sẽ gọi Pinecone.Kịch bản: User vừa xem phim có ID 123. Ta hỏi Pinecone: "Tìm cho tao 20 vector nằm gần vector số 123 nhất".Cập nhật functions/package.json:Thêm @pinecone-database/pinecone vào dependencies.Cập nhật functions/index.js:JavaScript// ... imports cũ
const { Pinecone } = require('@pinecone-database/pinecone');

// Init Pinecone (Lấy key từ env config)
const pinecone = new Pinecone({ apiKey: functions.config().pinecone.key });

exports.getSmartRecommendations = functions.https.onCall(async (data, context) => {
    // ... (Giữ logic Auth và Cache cũ) ...
    // ... (Giữ logic lấy Watch History cũ) ...

    // Giả sử lấy được seedMovies từ history
    const seedMovie = seeds[0]; // Lấy phim xem gần nhất làm gốc

    try {
        const index = pinecone.index('netflix-movies');

        // LOGIC MỚI: Vector Search
        // Chúng ta query tìm các vector gần ID của phim seed nhất
        const queryResponse = await index.query({
            id: seedMovie.id.toString(), // Tìm hàng xóm của thằng này
            topK: 20, // Lấy 20 thằng gần nhất
            includeMetadata: true // Lấy luôn thông tin title, ảnh...
        });

        // Map kết quả từ Pinecone sang format frontend cần
        const aiMovies = queryResponse.matches.map(match => ({
            id: parseInt(match.id),
            title: match.metadata.title,
            backdrop_path: match.metadata.backdrop_path,
            vote_average: match.metadata.vote_average,
            score: match.score // Độ giống nhau (0.0 - 1.0)
        }));
        
        // Vẫn có thể giữ lại Logic Time Context để filter lại list này nếu muốn
        // Ví dụ: Buổi sáng thì filter bỏ phim kinh dị ra khỏi list AI gợi ý

        const payload = { 
            movies: aiMovies, 
            reason: `Vì bạn đã xem ${seedMovie.title} (AI Matching)` 
        };

        // ... (Lưu Cache và Return như cũ) ...

    } catch (error) {
        console.error("Pinecone Error:", error);
        // Fallback: Nếu Pinecone lỗi hoặc phim chưa có trong index -> Quay về gọi TMDB cũ
        // return fallbackToTMDBLogic();
    }
});
🎓 So sánh Sự khác biệt (Before & After)Đặc điểmGiai đoạn 2 (TMDB Logic)Giai đoạn 3 (Vector AI)Cơ chếDựa trên keywords & genre trùng nhau.Dựa trên ngữ nghĩa (Meaning) và bối cảnh.Ví dụPhim "Interstellar" sẽ gợi ý "Star Wars" (vì cùng Sci-Fi)."Interstellar" sẽ gợi ý "Arrival" hoặc "Ad Astra" (vì cùng nói về sự cô đơn, triết lý không gian, dù genre có thể khác).Độ phụ thuộcPhụ thuộc hoàn toàn thuật toán của TMDB.Bạn làm chủ thuật toán. Bạn có thể chỉnh sửa mô tả phim để lái gợi ý theo ý mình.Tốc độChậm hơn (gọi HTTP request tới TMDB).Cực nhanh (Pinecone phản hồi trong mili giây).💡 Gợi ý nâng cao (Bonus)Nếu bạn muốn gây ấn tượng mạnh hơn nữa trong CV:Hybrid Search: Kết hợp cả Vector Search (AI) và Keyword Search (Truyền thống). Ví dụ: "Tìm phim giống Iron Man (AI) nhưng phải là phim năm 2024 (Filter)".User Vector: Thay vì tìm phim giống 1 phim gần nhất, bạn lấy 3 phim user vừa xem, cộng vector của chúng lại rồi chia trung bình => Ra "Vector Gu Của User". Dùng vector đó để query. Kết quả sẽ phản ánh gu tổng hợp của người đó cực kỳ chính xác.
---
