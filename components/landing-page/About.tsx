import React from "react";
import Container from "../layout/Container";
import Heading from "../typography/Heading";
import Link from "next/link";

const About = () => {
  return (
    <section id="about" className="py-6 md:py-8 lg:py-9 xl:py-10">
      <Heading className="text-center" level={1}>
        About Obere<span className="text-primary">Transports</span>
      </Heading>
      <Container>
        <p className="text-center font-light md:text-[14px] tracking-n-3 text-[12px] text-gray-500 p-4 border rounded-[8px] border-border-stroke leading-[160%]">
          Obere Transport Ltd is a Nigerian Modern, smart mobility provider
          which since 2021, has been changing the way thousands of people in
          Nigeria are traveling, Our vision is to provide anyone who wants to
          travel in Nigeria with smart, sustainable mobility and ease of
          booking. Providing thousands of travelers with a comfortable,
          affordable, smart travel experience is our biggest motivation.
        </p>
        <p className="text-center my-5">
          <Link
            href={"/about"}
            className="font-semibold text-[13px] text-primary"
          >
            View all
          </Link>
        </p>
      </Container>
    </section>
  );
};

export default About;
