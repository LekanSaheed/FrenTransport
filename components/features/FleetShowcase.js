import React from "react";
import Heading from "../typography/Heading";
import Container from "../layout/Container";
const FleetShowcase = () => {
  const fleet = [
    { name: "Toyota Hiace", desc: "Lorem Ipsum sitdet armor" },
    { name: "Sienna 2002", desc: "Lorem Ipsum sitdet armor" },
    { name: "Sienna 2002", desc: "Lorem Ipsum sitdet armor" },
    { name: "Sienna 2002", desc: "Lorem Ipsum sitdet armor" },
    { name: "Sienna 2002", desc: "Lorem Ipsum sitdet armor" },
    { name: "Sienna 2002", desc: "Lorem Ipsum sitdet armor" },
  ];
  return (
    <section id="fleet" className="py-5">
      <Heading className="text-center" level={1}>
        Fleet Showcase
      </Heading>
      <Container>
        <ul className="flex snap-mandatory -mx-4 scroll-px-4 pl-4 snap-x gap-4 overflow-x-scroll ">
          {fleet.map((fl, id) => {
            return (
              <li
                key={id}
                className="snap-start shrink-0 w-[260px] h-[140px]  rounded-[15px] p-4 bg-primary"
              >
                {fl.name}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
};

export default FleetShowcase;
