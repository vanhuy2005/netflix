import React from "react";

const LandingFooter = () => {
  const footerLinks = [
    [
      "Câu hỏi thường gặp",
      "Quan hệ nhà đầu tư",
      "Quyền riêng tư",
      "Kiểm tra tốc độ",
    ],
    ["Trung tâm trợ giúp", "Việc làm", "Tùy chọn cookie", "Thông báo pháp lý"],
    [
      "Tài khoản",
      "Các cách xem",
      "Thông tin doanh nghiệp",
      "Chỉ có trên Netflix",
    ],
    ["Trung tâm đa phương tiện", "Điều khoản sử dụng", "Liên hệ với chúng tôi"],
  ];

  return (
    <footer className="bg-netflix-deepBlack py-16 px-4 md:px-16 border-t-8 border-[#222]">
      <div className="max-w-5xl mx-auto">
        {/* Contact */}
        <p className="text-gray-400 mb-8">
          Bạn có câu hỏi? Gọi{" "}
          <a href="tel:1800-000-000" className="hover:underline">
            1800-000-000
          </a>
        </p>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {footerLinks.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col space-y-3">
              {column.map((link, linkIndex) => (
                <a
                  key={linkIndex}
                  href="#"
                  className="text-gray-400 text-sm hover:underline"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Language Selector */}
        <div className="mb-8">
          <select className="bg-black/50 text-white border border-gray-500 px-4 py-2 rounded-md cursor-pointer hover:border-gray-400 transition-colors">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Copyright */}
        <p className="text-gray-400 text-sm">Netflix Việt Nam</p>
      </div>
    </footer>
  );
};

export default LandingFooter;
