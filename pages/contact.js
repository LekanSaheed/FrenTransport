import React from "react";
import Heading from "../components/typography/Heading";
import Container from "../components/layout/Container";

const Contact = () => {
  return (
    <div>
      <Container>
        <div className="mb-6">
          <Heading level={1}>Contact us</Heading>
          <p className="text-[14px] font-light leading-[140%] text-gray-500 tracking-n-3">
            We are always here to help you! Send us your query via the provided
            means below.
          </p>
        </div>
        <ul>
          <li className="p-4 mb-4 tracking-n-3 text-[14px] bg-gray-100">
            <label className="font-semibold">Email</label>:{" "}
            <a
              className="text-primary font-light"
              href="mailto:hello@frenmotors.com"
            >
              hello@frenmotors.com
            </a>
          </li>
          <li className="p-4 mb-4 tracking-n-3 text-[14px] bg-gray-100">
            <label className="font-semibold">Phone</label>:{" "}
            <a className="text-primary font-light" href="tel:08087644926">
              08087644926
            </a>
          </li>
        </ul>
      </Container>
    </div>
  );
};

export default Contact;
