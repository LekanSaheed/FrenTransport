import React from "react";
import Container from "../layout/Container";
import Heading from "../typography/Heading";
import { Eyebrow } from "../ui/layout";

const STEPS = [
  { title: "Search your route", text: "Choose where you're leaving from, where you're going and when. You'll see every departure with live seat counts." },
  { title: "Pick seats & pay", text: "Select seats on the bus map. They're held for you while you pay securely online with Paystack." },
  { title: "Board with your reference", text: "Your confirmation and booking reference arrive by email. Show the reference at the terminal; no printing needed." },
];

const HowItWorks = () => {
  return (
    <section className="bg-canvas py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center">How it works</Eyebrow>
          <Heading level={2} className="mt-3 text-[30px] md:text-[40px]">
            From search to seat in three steps.
          </Heading>
        </div>
        <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
          <span aria-hidden className="lane-line absolute top-[34px] right-[16%] left-[16%] hidden opacity-60 md:block" />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-[24px] border border-border-stroke bg-white p-7 text-center shadow-card">
              <span className="font-display mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent text-[17px] font-black text-white ring-8 ring-accent-soft">
                {i + 1}
              </span>
              <h3 className="font-display mt-5 text-[19px] font-black text-ink">{step.title}</h3>
              <p className="mt-2 text-[14.5px] leading-[165%] text-gray-500">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
};

export default HowItWorks;
