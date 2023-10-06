import React from "react";
import Container from "./Container";

const Footer = () => {
  return (
    <footer className="bg-[#192136] text-white min-h-[200px]">
      <Container>
        <div className="mt-[100px] text-[10px] text-center tracking-n-2">
          Copyright &copy; 2021 - {new Date().getFullYear()}{" "}
          <span className="font-semibold">
            <span className="text-gray-300">Fren</span>Motors Ltd
          </span>
          . All rights reserved.
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
