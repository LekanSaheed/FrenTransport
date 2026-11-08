import Wrapper from "@/components/layout/Wrapper";
import React from "react";

/** The public website keeps its existing header, footer and intro animation. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Wrapper>{children}</Wrapper>;
}
