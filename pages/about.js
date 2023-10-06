import React from "react";
import Heading from "../components/typography/Heading";
import Container from "../components/layout/Container";

const About = () => {
  return (
    <Container className="mb-6">
      <div>
        <Heading level={1} className="mb-2">
          About Fren<span className="text-primary">Motors</span>
        </Heading>
        <p className="font-light tracking-n-3 text-gray-500 text-[14px] text-gray-500 leading-[160%]">
          FrenMotors is a Nigerian Modern, smart mobility provider which since
          2021, has been changing the way thousands of people in Nigeria are
          traveling, Our vision is to provide anyone who wants to travel in
          Nigeria with smart, sustainable mobility and ease of booking.
          Providing thousands of travelers with a comfortable, affordable, smart
          travel experience is our biggest motivation. The smart long-distance
          buses meet the highest standards of comfort, safety and environmental
          protection, and offers a smart alternative to private transport. We
          are a technology-focused company that harnesses physical and digital
          tools to move you from one place to the other and remain resilient on
          our overarching goal to redefine mobility in Nigeria, one region at a
          time. We think that mobility should be hassle-free and will go the
          mile and extra to give you this experience. In our world, you are the
          VIP, and it is our mission to relentlessly prioritize your
          satisfaction, safety and comfort by leveraging modern technology. With
          technology innovations such as a pioneering booking and ticketing
          system, the FrenBus app, free Wifi, free charging outlets, GPS live
          tracking, and automated punctuality management, we are making a new
          way of traveling possible. Smart grid planning and dynamic price
          management mean we can give our customers the best possible offering.
        </p>
      </div>
    </Container>
  );
};

export default About;
