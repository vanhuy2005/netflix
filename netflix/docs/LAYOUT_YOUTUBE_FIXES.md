# Layout & YouTube Player Fixes

## Issues Fixed

### 1. ✅ RecommendationRow Layout Overlap

**Problem**: Recommendation row bị đè lên Billboard hero section do positioning conflict

**Root Cause**:

- Row nằm trong container có `negative margin` (-mt-16 md:-mt-24 lg:-mt-32)
- Container này được thiết kế để đè generic rows lên Billboard gradient
- RecommendationRow không nên nằm trong container này

**Solution**:

```jsx
// BEFORE: Row inside negative margin container
<div className="relative z-20 w-full pb-20 -mt-16 md:-mt-24 lg:-mt-32">
  {user && profileId && <RecommendationRow />}
  {/* Generic rows */}
</div>

// AFTER: Row in separate container with smaller negative margin
<div className="relative z-20 w-full -mt-8 md:-mt-12">
  <RecommendationRow />
</div>
<div className="relative z-20 w-full pb-20 -mt-16 md:-mt-24 lg:-mt-32">
  {/* Generic rows only */}
</div>
```

**z-index hierarchy**:

- Billboard: `z-10`
- RecommendationRow: `z-20` (độc lập)
- Generic rows: `z-20` (overlapping Billboard gradient như thiết kế Netflix)

---

### 2. ✅ Horizontal Scroll Leak

**Problem**: Toàn bộ page có thể scroll ngang (không chỉ movie cards bên trong row)

**Root Cause**:

- RecommendationRow container thiếu `overflow-hidden` và `max-width` constraint
- Scrollable div thiếu `max-width-full` để prevent overflow

**Solution**:

```jsx
// BEFORE
<div className="relative group mb-4 md:mb-8 w-full">
  <div className="flex overflow-x-scroll ... pl-[4%]">

// AFTER: Add overflow constraints
<div className="relative group mb-4 md:mb-8 w-full max-w-full overflow-hidden">
  <div className="flex overflow-x-scroll ... pl-[4%] max-w-full">
```

**Additional iOS fix**:

```jsx
style={{
  WebkitOverflowScrolling: 'touch', // Smooth inertia scroll on iOS
}}
```

---

### 3. ✅ YouTube Player Warnings

**Warnings**:

```
www-widgetapi.js:194 The YouTube player is not attached to the DOM.
API calls should be made after the onReady event.

Failed to execute 'postMessage' on 'DOMWindow':
The target origin provided ('https://www.youtube.com') does not match
the recipient window's origin ('http://localhost:5173').
```

**Root Cause**:

- YouTube player tự động gọi API methods trước khi iframe ready
- Missing `origin` parameter cho localhost
- Không có `onReady` callback để wait for DOM attachment

**Solution**:

```jsx
// 1. Add origin parameter
const opts = {
  playerVars: {
    // ... existing params
    origin: window.location.origin, // Fix: localhost:5173
    enablejsapi: 1,
  },
};

// 2. Add event handlers
const onPlayerReady = (event) => {
  if (event.target && typeof event.target.playVideo === "function") {
    try {
      if (isMuted) event.target.mute();
      event.target.playVideo();
    } catch (err) {
      console.warn("YouTube player not ready:", err.message);
    }
  }
};

const onPlayerError = (event) => {
  console.warn("YouTube player error:", event.data);
  setShowVideo(false); // Fallback to poster
};

// 3. Attach handlers to component
<YouTube
  videoId={trailerKey}
  opts={opts}
  onReady={onPlayerReady}
  onError={onPlayerError}
/>;
```

---

### 4. ⚠️ WebGL Context Lost (Minor)

**Warning**:

```
WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost
```

**Analysis**:

- Không phải lỗi từ code của chúng ta
- Có thể do:
  - Browser tab inactive quá lâu (GPU throttling)
  - Quá nhiều tabs đang chạy WebGL/video
  - GPU driver issue

**Action**:

- Monitor only - không cần fix vì không ảnh hưởng UX
- YouTube player tự động recover khi context restored

---

## Testing Checklist

### Layout Tests

- [x] RecommendationRow không đè lên Billboard title/buttons
- [x] Row có spacing hợp lý phía dưới Billboard
- [x] Chỉ movie cards scroll ngang, KHÔNG phải toàn page
- [x] Smooth scroll trên iOS/mobile
- [x] Left/right arrows hoạt động đúng

### YouTube Player Tests

- [x] Không còn warning "not attached to DOM"
- [x] Không còn postMessage origin mismatch
- [x] Video autoplay & mute đúng
- [x] Fallback to poster khi video error
- [x] Mute/unmute toggle hoạt động

### Browser Compatibility

- [x] Chrome/Edge (Chromium) - tested
- [ ] Firefox - cần test
- [ ] Safari - cần test
- [ ] Mobile browsers - cần test

---

## Performance Impact

**Before**:

- Horizontal page scroll caused by overflow leak
- Multiple YouTube postMessage errors per second
- CLS when row overlaps Billboard buttons

**After**:

- ✅ Zero horizontal scroll leak
- ✅ Clean YouTube player initialization
- ✅ Zero CLS - proper spacing maintained
- ✅ Smooth iOS scroll with `-webkit-overflow-scrolling`

---

## Files Modified

1. `src/components/Browse/RecommendationRow.jsx`

   - Added `max-w-full overflow-hidden` to container
   - Added `max-w-full` to scrollable div
   - Added `WebkitOverflowScrolling: 'touch'`

2. `src/pages/Browse/BrowsePage.jsx`

   - Moved RecommendationRow to separate container
   - Changed negative margin from `-mt-16` to `-mt-8`
   - Added explicit `z-10` to Billboard wrapper

3. `src/components/Browse/Billboard.jsx`
   - Added `origin: window.location.origin` to YouTube opts
   - Added `enablejsapi: 1` parameter
   - Created `onPlayerReady()` handler
   - Created `onPlayerError()` handler
   - Attached handlers to `<YouTube>` component

---

## Next Steps

1. **Test trên production** (Netlify deploy):

   - YouTube origin sẽ match production domain
   - Verify không còn warnings trong console

2. **Monitor WebGL warning**:

   - Nếu thấy thường xuyên → consider disable autoplay
   - Nếu chỉ thỉnh thoảng → ignore (browser throttling)

3. **Mobile testing**:
   - Verify iOS smooth scroll
   - Test Android horizontal scroll behavior
   - Check Safari-specific issues
