import React, { useState } from "react";
import containerClass from "./containerClass";
import LgNav from "./LgNav";
import Image from "next/image";
import { CloseSquare, HambergerMenu } from "iconsax-react";
import { motion } from "framer-motion";
import MobileNav from "./MobileNav";
import { MdClose } from "react-icons/md";
import Link from "next/link";

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`sticky border-b border-b-border-stroke z-[2] top-0 bg-[#F9FAFE] relative`}
      // style={{ boxShadow: "6px 12px 100px -2px rgba(0, 0, 0, 0.05)" }}
    >
      <div
        className={`${containerClass} relative md:py-5 flex justify-between items-center`}
      >
        <Link href={"/"} className="w-[60px] h-[30px] relative">
          <Image
            src={"/logo.png"}
            fill
            className="object-contain"
            quality={100}
            alt="logo"
            priority
          />
        </Link>
        <LgNav />
        <motion.div
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.9 }}
          className="md:hidden relative text-tertiary h-[35px]
           w-[35px] rounded-full bg-primary flex items-center justify-center z-[4] cursor-pointer"
        >
          {React.createElement(open ? MdClose : HambergerMenu, {
            size: 24,
          })}
        </motion.div>
        <MobileNav open={open} setOpen={setOpen} />
        <div className="max-md:hidden"></div>
      </div>
    </header>
  );
};

export default Header;
