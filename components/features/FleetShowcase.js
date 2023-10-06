import React from "react";
import Heading from "../typography/Heading";
import Container from "../layout/Container";
import Image from "next/image";
import { PiPlugLight, PiWifiHigh } from "react-icons/pi";
const FleetShowcase = () => {
  const fleet = [
    {
      name: "Economy Buses",
      desc: "Lorem Ipsum sitdet armor",
      img: "hiace.png",
    },
    {
      name: "Priority",
      desc: "Lorem Ipsum sitdet armor",
      img: "sienna.jpg",
    },
    {
      name: "VIP Charter",
      desc: "Lorem Ipsum sitdet armor",
      img: "spider.jpg",
    },
  ];
  return (
    <section
      id="fleet"
      className="py-6 md:py-8 lg:py-9 xl:py-10 border-b border-b-border-stroke"
    >
      <Heading className="text-center" level={1}>
        Fleet Showcase
      </Heading>
      <Container>
        <ul className="flex snap-mandatory py-5  -mx-4 scroll-px-4 px-4 snap-x gap-4 overflow-x-scroll ">
          {fleet.map((fl, id) => {
            return (
              <li
                style={{ boxShadow: "0px 0px 15px -2px rgba(0, 0, 0, 0.1)" }}
                key={id}
                className="snap-start overflow-hidden border border-border-stroke shrink-0 w-[260px] min-h-[140px]  rounded-[8px]  bg-white"
              >
                <div className="h-[160px]  bg-[#fdfdfd] relative">
                  <Image
                    className="object-cover"
                    src={`/fleet/${fl.img}`}
                    fill
                    quality={100}
                  />
                </div>
                <div className="flex justify-between items-center text-gray-600 border-t border-t-border-stroke font-bold tracking-n-5 p-4 text-[20px]">
                  <p>{fl.name}</p>
                  <div className="flex gap-3 text-secondary">
                    <PiWifiHigh size={16} />
                    <PiPlugLight size={16} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mx-auto font-light bg-tertiary/10 text-[12px] border border-border-stroke tracking-n-2 text-gray-500 rounded-[8px] p-4">
          <p>
            {" "}
            Each of these vehicles is equipped with WiFi connectivity, providing
            you with free internet access throughout your journey.
          </p>
        </div>
      </Container>
    </section>
  );
};

export default FleetShowcase;
