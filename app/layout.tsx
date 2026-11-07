import Wrapper from "@/components/layout/Wrapper";
import React from "react";
import "./globals.css";

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="en">
      <body>
        <Wrapper>{children}</Wrapper>
      </body>
    </html>
  );
};

export default RootLayout;
