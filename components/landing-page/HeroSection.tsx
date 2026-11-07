"use client";
import React from "react";
import Container from "../layout/Container";
import Image from "next/image";
import { motion } from "framer-motion";
import Button from "../Button";
import Link from "next/link";

const HeroSection = () => {
  const BookingOptions: { label: string }[] = [
    { label: "Book a seat" },
    { label: "Hire a car" },
    { label: "Hire a bus" },
    { label: "Booking Status" },
  ];
  return (
    <section
      className="bg-[#F9FAFE] overflow-x-hidden 
    h-[calc(100vh-70px)] md:h-[calc(100vh-100px)] bg-city pt-7.5 md:pt-12.5
     lg:pt-15 xl:pt-20 bg-contain  bg-no-repeat bg-bottom relative"
    >
      <Container>
        <div className="">
          <div className="flex-1">
            <div className="max-w-125 mx-auto md:max-w-[unset] text-center ">
              <h1 className="font-bold text-black tracking-n-5 text-[30px] md:text-[43px] sm:text-[40px]">
                Move Safely and Arrive in Comfort.
              </h1>
              <p className="text-[13px] md:text-[14px] text-gray-500 leading-[160%]">
                Book buses, Taxi and more with Obere Transport trusted by
                millions of travellers in Nigeria.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 p-4 bg-gray-700 rounded-[10px] mt-4">
              {BookingOptions.map((option, id) => {
                return <Button key={id} label={option.label} className="" />;
              })}
              {/* <div className="flex gap-4 items-center justify-center mt-7.5 pb-7.5 md:justify-start">
                <Link target="_blank" href={"https://wa.me/2348087644926"}>
                  {" "}
                  <Button
                    variant="secondary"
                    label="Book ticket"
                    className="border-primary! text-primary!"
                  />
                </Link>

                <Link href="#fleet">
                  {" "}
                  <Button label="View fleet" />
                </Link>
              </div> */}
            </div>
          </div>
          <div className="mt-10 flex-1 md:mt-0">
            <div className="relative h-75 mx-auto w-65">
              <Image
                src="/travel.svg"
                className="object-contain "
                fill
                alt="Travel"
              />
            </div>
          </div>
        </div>
      </Container>
      <div className="absolute overflow-hidden w-screen right-0 left-0 bottom-0">
        <motion.div
          initial={{ x: "-50vw" }}
          animate={{ x: "100vw" }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1,
            duration: 18,
            type: "tween",
            ease: "linear",
          }}
          className="relative max-sm:h-[50px] max-sm:w-[130px] sm:h-[70px] sm:w-[150px] md:h-[90px] md:w-[170px] lg:h-[100px] lg:w-[220px] "
        >
          <Image
            quality={100}
            priority
            alt="frenbus"
            src="/frenbus.png"
            fill
            className="object-contain"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
