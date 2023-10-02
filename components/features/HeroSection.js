import React from "react";
import Container from "../layout/Container";
import Image from "next/image";
import { motion } from "framer-motion";
import Button from "../Button";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section
      className="bg-[#FAFAFA] overflow-x-hidden 
    h-[calc(100vh-70px)] md:h-[calc(100vh-100px)] bg-city pt-[30px] md:pt-[50px]
     lg:pt-[60px] xl:pt-[80px] bg-contain  bg-no-repeat bg-bottom relative"
    >
      <Container>
        <div className="md:flex">
          <div className="flex-1">
            <h1 className="font-bold text-black text-center text-[30px] md:text-left md:text-[43px] sm:text-[40px]">
              Hop On, Be Amazed:
              <br /> <span className="text-primary">FrenBus</span>, Your Travel{" "}
              <br />
              {`"Fren."`}
            </h1>
            <div className="flex gap-4 items-center justify-center mt-[30px] pb-[30px] md:justify-start">
              <Button variant="secondary" label="Book ticket" />
              <Link href="#fleet">
                {" "}
                <Button label="View fleet" />
              </Link>
            </div>
          </div>
          <div className="mt-[40px] flex-1 md:mt-0">
            <div className="relative h-[300px] mx-auto w-[260px]">
              <Image src="/travel.svg" className="object-contain " fill />
            </div>
          </div>
        </div>
      </Container>
      <div className="absolute overflow-hidden w-[100vw] right-0 left-0 bottom-0">
        <motion.div
          initial={{ x: "-50vw" }}
          animate={{ x: "100vw" }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1,
            duration: 12,
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
