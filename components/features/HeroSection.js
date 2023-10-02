import React from "react";
import Container from "../layout/Container";
import Image from "next/image";
import { motion } from "framer-motion";
import Button from "../Button";

const HeroSection = () => {
  return (
    <section className="bg-[#FAFAFA] overflow-x-hidden h-[calc(100vh-120px)] bg-city pt-[30px]  bg-contain  bg-no-repeat bg-bottom relative">
      <Container>
        <h1 className="font-bold text-black text-center text-[30px] ">
          Hop On, Be Amazed:
          <br /> <span className="text-primary">FrenBus</span>, Your Travel
          "Fren."
        </h1>
        <div className="flex gap-4 items-center justify-center mt-[30px] pb-[30px]">
          <Button variant="secondary" label="Book ticket" />
          <Button label="View fleet" />
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
          <Image src="/frenbus.png" fill className="object-contain" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
