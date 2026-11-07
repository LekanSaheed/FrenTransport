import React from "react";
import containerClass from "./containerClass";

const Container = ({ children, className = "" }) => {
  return <div className={`${containerClass} ${className}`}>{children}</div>;
};

export default Container;
