import React from "react";
import Container from "../layout/Container";
import Button from "../Button";
import Link from "next/link";

const ReadyToBoard = () => {
  return (
    <section className="-mb-[70px] relative z-[1]">
      <Container className="!py-0">
        <div className="bg-[#F3EFFE] ready-to-join p-8 md:p-10 md:flex justify-between lg:p-12 xl:p-14 rounded-[10px]">
          <h1 className="text-[25px] md:text-[34px] lg:text-[39px] leading-[110%] tracking-n-3 text-[#9574F2]">
            Ready to Board with us? <br />
            <span className="text-[#6653BB]">Book a ticket now.</span>
          </h1>
          <div className="flex justify-end mt-6">
            <Link target="_blank" href={"https://wa.me/2348087644926"}>
              <Button
                className="!border-primary !text-primary"
                variant="secondary"
                label="Book ticket"
              />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ReadyToBoard;
