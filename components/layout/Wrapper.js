import React, { Fragment } from "react";
import Header from "./Header";
import Footer from "./Footer";
import containerClass from "./containerClass";
import { Call, Sms } from "iconsax-react";
import HomeAnimation from "../features/HomeAnimation";

const Wrapper = ({ children }) => {
  const Contact = ({ icon, contact = [], type }) => {
    return (
      <div className="flex items-center first:border-r border-r-emerald-600 first:pr-4 last:ml-4">
        {React.createElement(icon, {
          size: 16,
          className: "mr-2 text-primary",
        })}{" "}
        {contact.map((c, id) => (
          <Fragment key={id}>
            <a
              href={type === "tel" ? `tel:${c}` : `mailto:${c}`}
              className={`${
                id !== 0 && "ml-1"
              } text-gray-600 hover:text-primary transition text-14px`}
            >
              {c}
            </a>
            {id !== contact.length - 1 && ","}
          </Fragment>
        ))}
      </div>
    );
  };
  return (
    <div className="">
      <HomeAnimation />
      <div className="max-md:hidden bg-[#FDFDFD] border-b border-b-border-stroke">
        <div className={`${containerClass} !py-3 flex`}>
          <Contact
            type={"tel"}
            icon={Call}
            contact={["09019724076", "0909358678"]}
          />
          <Contact icon={Sms} contact={["lknsaheed@gmail.com"]} />
        </div>
      </div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default Wrapper;
