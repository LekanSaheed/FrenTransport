import React from "react";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import ReadyToBoard from "@/components/landing-page/ReadyToBoard";

export const metadata = { title: "About us | Obere Transport" };

const VALUES = [
  { title: "Safety first", text: "Trained, professional drivers and well-maintained vehicles on every trip." },
  { title: "Comfort", text: "Free Wi-Fi and charging outlets so the journey is time well spent." },
  { title: "Easy booking", text: "Choose your seat, pay online and manage your trip without a queue." },
];

const About = () => {
  return (
    <>
      <Container className="mb-16">
        <PageHeader eyebrow="About us" title={<>Redefining how Nigeria travels, one region at a time.</>} />
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5 text-[16px] leading-[175%] text-gray-600">
            <p>
              Obere Transport Ltd is a modern, smart mobility provider which, since 2021, has been changing the way thousands of people in
              Nigeria travel. Our vision is to provide anyone who wants to travel in Nigeria with smart, sustainable mobility and ease of
              booking. Providing thousands of travellers with a comfortable, affordable, smart travel experience is our biggest motivation.
            </p>
            <p>
              Our long-distance buses meet the highest standards of comfort, safety and environmental protection, and offer a smart
              alternative to private transport. We are a technology-focused company that harnesses physical and digital tools to move you
              from one place to the other, and we remain resilient on our overarching goal to redefine mobility in Nigeria.
            </p>
            <p>
              We think that mobility should be hassle-free, and we will go the extra mile to give you this experience. In our world, you
              are the VIP, and it is our mission to relentlessly prioritise your satisfaction, safety and comfort by leveraging modern
              technology.
            </p>
          </div>
          <ul className="space-y-4">
            {VALUES.map((v, i) => (
              <li key={v.title} className="flex gap-4 rounded-[20px] border border-border-stroke bg-white p-5 shadow-card">
                <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary text-[15px] font-black text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="font-display block text-[17px] font-black text-ink">{v.title}</span>
                  <span className="mt-1 block text-[14.5px] leading-[160%] text-gray-500">{v.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <ReadyToBoard />
    </>
  );
};

export default About;
