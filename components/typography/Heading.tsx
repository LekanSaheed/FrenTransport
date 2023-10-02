import React, { FunctionComponent } from "react";

interface HeadingProps {
  level: string | number;
  className: string;
  children: any;
}

const Heading: FunctionComponent<HeadingProps> = ({
  level,
  className,
  children,
}) => {
  const levelClassNames = {
    1: "text-[25px] tracking-n-3",
    2: "text-[21px] tracking-n-3",
    3: "text-[18px] tracking-n-2",
    4: "text-[16px] tracking-n-2",
    5: "text-[14px] tracking-n-1",
  };
  return React.createElement(`h${level}`, {
    className: `${className || ""} font-bold ${levelClassNames[level]}`,
    children,
  });
};

export default Heading;
