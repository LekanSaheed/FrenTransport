import React, { Fragment } from "react";
import Header from "./Header";
import Footer from "./Footer";
import containerClass from "./containerClass";
import { Call, Sms } from "iconsax-react";
import HomeAnimation from "../features/HomeAnimation";
import ReadyToBoard from "../features/ReadyToBoard";
import { DefaultSeo } from "next-seo";

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
              } text-gray-600 hover:text-primary transition text-[14px]`}
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
    <>
      <DefaultSeo
        twitter={{
          handle: "@FrenMotors",
          site: "@frenmotors",
          cardType: "summary_large_image",
        }}
        title="FrenMotors: Book Bus Travel Tickets in Nigeria with FrenBus from ₦2,999."
        description="Traveling in Nigeria is hassle-free with FrenBus modern and comfortable buses, frequent connections, and reliable schedules. Our extensive network spans."
      />

      <div className="">
        <HomeAnimation />
        <div className="max-md:hidden bg-[#FDFDFD] border-b border-b-border-stroke">
          <div className={`${containerClass} !py-3 flex`}>
            <Contact type={"tel"} icon={Call} contact={["08087644926"]} />
            <Contact icon={Sms} contact={["hello@frenmotors.com"]} />
          </div>
        </div>
        <Header />
        <main className="min-h-[50vh]">{children}</main>
        <ReadyToBoard />
        <Footer />
      </div>
    </>
  );
};

export default Wrapper;
