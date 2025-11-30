import React from "react";
import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";
import { MdTv, MdDownload, MdDevices, MdChildFriendly } from "react-icons/md";

const FeatureSection = () => {
  const features = [
    {
      title: "Thưởng thức trên TV",
      description:
        "Xem trên TV thông minh, Playstation, Xbox, Chromecast, Apple TV, đầu phát Blu-ray và nhiều thiết bị khác.",
      icon: MdTv,
      gradient: "bg-gradient-to-br from-[#192133] to-[#0a0a0a]",
    },
    {
      title: "Tải xuống nội dung",
      description:
        "Lưu lại những nội dung yêu thích của bạn một cách dễ dàng để luôn có thứ để xem.",
      icon: MdDownload,
      gradient: "bg-gradient-to-br from-[#1a1f33] to-[#0a0a0a]",
    },
    {
      title: "Xem mọi nơi",
      description:
        "Phát trực tiếp không giới hạn phim và chương trình truyền hình trên điện thoại, máy tính bảng, máy tính xách tay và TV.",
      icon: MdDevices,
      gradient: "bg-gradient-to-br from-[#241933] to-[#0a0a0a]",
    },
    {
      title: "Tạo hồ sơ cho trẻ em",
      description:
        "Gửi các bé đi phiêu lưu cùng các nhân vật yêu thích trong không gian riêng dành cho các bé—miễn phí khi kèm theo tư cách thành viên của bạn.",
      icon: MdChildFriendly,
      gradient: "bg-gradient-to-br from-[#331922] to-[#0a0a0a]",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-netflix-deepBlack border-t-8 border-netflix-gray/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Section Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 md:mb-12"
        >
          Thêm lý do để tham gia
        </motion.h2>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
