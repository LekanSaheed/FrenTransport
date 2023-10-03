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
    <section id="fleet" className="py-6 md:py-8 lg:py-9 xl:py-10">
      <Heading className="text-center" level={1}>
        Fleet Showcase
      </Heading>
      <Container>
        <ul className="flex snap-mandatory py-5  -mx-4 scroll-px-4 pl-4 snap-x gap-4 overflow-x-scroll ">
          {fleet.map((fl, id) => {
            return (
              <li
                style={{ boxShadow: "0px 0px 15px -2px rgba(0, 0, 0, 0.1)" }}
                key={id}
                className="snap-start overflow-hidden border border-border-stroke shrink-0 w-[260px] min-h-[140px]  rounded-[8px]  bg-white"
              >
                <div className="h-[120px]  bg-[#fdfdfd]"></div>
                <p className="uppercase border-t border-t-border-stroke font-bold tracking-n-5 p-4 text-[20px]">
                  {fl.name}
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
};

export default FleetShowcase;
