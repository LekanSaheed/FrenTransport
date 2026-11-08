import React, { FunctionComponent } from "react";
import { cn } from "@/libs/utils";

interface HeadingProps {
  level: string | number;
  className?: string;
  children: any;
}

const Heading: FunctionComponent<HeadingProps> = ({
  level,
  className,
  children,
}) => {
  const levelClassNames: Record<string | number, string> = {
    1: "font-display text-[26px] leading-[1.1] tracking-n-3 md:text-[32px] lg:text-[36px]",
    2: "font-display text-[21px] leading-[1.15] tracking-n-2",
    3: "text-[18px] tracking-n-2",
    4: "text-[16px] tracking-n-2",
    5: "text-[14px] tracking-n-1",
  };
  return React.createElement(
    `h${level}`,
    {
      className: cn("font-extrabold text-ink", levelClassNames[level], className),
    },
    children,
  );
};

export default Heading;
