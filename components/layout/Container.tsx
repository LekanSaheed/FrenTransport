import React from "react";
import containerClass from "./containerClass";

const Container = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return <div className={`${containerClass} ${className}`}>{children}</div>;
};

export default Container;
