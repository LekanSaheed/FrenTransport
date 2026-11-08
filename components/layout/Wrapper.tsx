import React from "react";
import Header from "./Header";
import Footer from "./Footer";

/** Public site chrome: header, page content, footer. */
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20">{children}</main>
      <Footer />
    </div>
  );
};

export default Wrapper;
