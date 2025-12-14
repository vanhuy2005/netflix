//Icon Đóng (Close) - Dùng cho Input Search và Modal
export const CloseIcon = ({ className = "w-6 h-6", strokeWidth = 2 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    className={className}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={strokeWidth} 
      d="M6 18L18 6M6 6l12 12" 
    />
  </svg>
);