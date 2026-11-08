import React from "react";
import Container from "../layout/Container";
import Button from "../Button";

const ReadyToBoard = () => {
  return (
    <section className="pb-4">
      <Container className="!py-0">
        <div className="relative overflow-hidden rounded-[28px] bg-accent px-8 py-12 md:px-14 md:py-16">
          <svg aria-hidden viewBox="0 0 400 200" className="pointer-events-none absolute -right-10 -bottom-6 h-[240px] w-[480px] opacity-25">
            <path d="M0 200 C 120 150, 240 90, 420 0" fill="none" stroke="#fff" strokeWidth="70" />
            <path d="M0 200 C 120 150, 240 90, 420 0" fill="none" stroke="#f26b1d" strokeWidth="3" strokeDasharray="14 12" />
          </svg>
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <h2 className="font-display max-w-xl text-[30px] leading-[1.05] font-black tracking-n-3 text-white md:text-[44px]">
              Ready to board?
              <br />
              <span className="text-ink">Your seat is waiting.</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button href="/book" label="Book a seat" className="h-12 bg-ink px-7 shadow-none hover:bg-black" />
              <Button href="/hire/bus" variant="secondary" label="Hire a bus" className="h-12 border-white/0 px-7" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ReadyToBoard;
