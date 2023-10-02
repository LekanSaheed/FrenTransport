import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import links from "./links";
import Link from "next/link";

const MobileNav = ({ open, setOpen }) => {
  return (
    <motion.div
      className={`bg-primary absolute top-0 right-0 mobile-nav
        text-white rounded-bl-full h-[50vh] p-5 w-[50vh] z-[2] ${
          open ? "scale-1" : "scale-0"
        }`}
    >
      <ul className="text-right pt-14">
        {links.map((link, id) => {
          return (
            <li
              className="font-semibold mb-3 text-[14px] tracking-n-2 text-tertiary"
              key={id}
            >
              <Link onClick={() => setOpen(false)} href={link.path} key={id}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
};

export default MobileNav;
