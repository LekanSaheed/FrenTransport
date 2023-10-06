import React from "react";
import links from "./links";
import Link from "next/link";

const LgNav = () => {
  return (
    <nav className="max-md:hidden">
      {links.map((link, id) => {
        return (
          <Link
            className="mr-9 text-[12px] font-semibold hover:text-primary last:mr-0"
            key={id}
            href={link.path}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default LgNav;
