import { createContext, useContext, useState } from "react";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null); // Lưu thông tin phim đang mở

  const openModal = (movie) => {
    setContent(movie);
    setIsOpen(true);
    // Khóa cuộn trang web khi mở modal
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    setContent(null);
    // Mở lại cuộn trang
    document.body.style.overflow = "unset";
  };

  return (
    <ModalContext.Provider value={{ isOpen, content, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
