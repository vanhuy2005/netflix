import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaChevronRight } from "react-icons/fa";
import AccordionItem from "./AccordionItem";

const FAQSection = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Netflix là gì?",
      answer:
        "Netflix là dịch vụ phát trực tuyến cung cấp nhiều loại chương trình truyền hình, phim, anime, phim tài liệu đoạt giải thưởng và nhiều nội dung khác trên hàng nghìn thiết bị kết nối Internet. Bạn có thể xem bao nhiêu tùy thích, bất cứ lúc nào bạn muốn mà không có một quảng cáo nào – tất cả chỉ với một mức giá thấp hàng tháng.",
    },
    {
      question: "Netflix có giá bao nhiêu?",
      answer:
        "Xem Netflix trên điện thoại thông minh, máy tính bảng, TV thông minh, máy tính xách tay hoặc thiết bị phát trực tuyến của bạn, tất cả chỉ với một khoản phí cố định hàng tháng. Các gói từ 74.000 ₫ đến 260.000 ₫ một tháng. Không có thêm chi phí, không có hợp đồng.",
    },
    {
      question: "Tôi có thể xem ở đâu?",
      answer:
        "Xem bất cứ nơi đâu, bất cứ lúc nào. Đăng nhập bằng tài khoản Netflix của bạn để xem ngay lập tức trên web tại netflix.com từ máy tính cá nhân của bạn hoặc trên bất kỳ thiết bị nào được kết nối Internet hỗ trợ ứng dụng Netflix, bao gồm TV thông minh, điện thoại thông minh, máy tính bảng, đầu phát truyền thông và bảng điều khiển trò chơi.",
    },
    {
      question: "Làm cách nào để hủy?",
      answer:
        "Netflix rất linh hoạt. Không có hợp đồng khó chịu và không có cam kết. Bạn có thể dễ dàng hủy tài khoản của mình trực tuyến bằng hai cú nhấp chuột. Không có phí hủy – bắt đầu hoặc dừng tài khoản của bạn bất cứ lúc nào.",
    },
    {
      question: "Tôi có thể xem gì trên Netflix?",
      answer:
        "Netflix có một thư viện phong phú các bộ phim truyện, phim tài liệu, chương trình truyền hình, anime, phim gốc được trao giải thưởng và nhiều nội dung khác. Xem bao nhiêu tùy thích, bất cứ lúc nào bạn muốn.",
    },
    {
      question: "Netflix có phù hợp với trẻ em không?",
      answer:
        "Trải nghiệm Netflix Kids được bao gồm trong tư cách thành viên của bạn để cung cấp cho phụ huynh quyền kiểm soát trong khi trẻ em thưởng thức các chương trình truyền hình và phim thân thiện với gia đình trong không gian riêng của chúng. Hồ sơ Kids đi kèm với các điều khiển của phụ huynh được bảo vệ bằng PIN cho phép bạn hạn chế xếp hạng độ tuổi của nội dung mà trẻ em có thể xem và chặn các tựa phim cụ thể mà bạn không muốn trẻ em xem.",
    },
  ];

  const handleGetStarted = (e) => {
    e.preventDefault();
    if (email) {
      navigate("/login", { state: { email } });
    }
  };

  return (
    <section className="py-16 md:py-24 px-4 md:px-16 bg-netflix-deepBlack border-t-8 border-[#222]">
      <div className="max-w-5xl mx-auto">
        {/* Section Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-white mb-8 md:mb-12 text-center"
        >
          Câu hỏi thường gặp
        </motion.h2>

        {/* FAQ Accordion */}
        <div className="mb-12">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* Email Form */}
        <div className="text-center">
          <p className="text-lg md:text-xl text-white mb-6">
            Bạn đã sẵn sàng xem chưa? Nhập email để tạo hoặc kích hoạt lại tư
            cách thành viên của bạn.
          </p>

          <form
            onSubmit={handleGetStarted}
            className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-3xl mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Địa chỉ email"
              className="w-full md:flex-1 bg-black/50 backdrop-blur-sm border border-gray-500 text-white px-6 py-4 md:py-5 rounded-md text-lg focus:outline-none focus:border-white transition-colors"
              required
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto bg-netflix-red hover:bg-netflix-redHover text-white font-bold px-8 py-4 md:py-5 rounded-md text-xl md:text-2xl flex items-center justify-center gap-2 transition-colors"
            >
              Bắt đầu
              <FaChevronRight className="text-lg" />
            </motion.button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
