import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import Image from "next/image";

const HomeAnimation = () => {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      // Animate the car in from the left
      await controls.start({ x: "0vw", opacity: 1 });

      // Wait for a second
      await new Promise((resolve) => setTimeout(resolve, 1500));

      //   reverse the car a bit
      await controls.start({ x: "-10vw" });

      // Animate the car out to the right
      await controls.start({ x: "100vw", opacity: 0 });
    };

    sequence();
  }, [controls]);

  return (
    <motion.div
      animate={{ height: "0", opacity: 0 }}
      transition={{ delay: 5.0 }}
      className="h-screen overflow-hidden sticky top-0 z-[8000] flex items-center justify-center relative bg-[#fafafa]"
    >
      <motion.div
        className="relative w-[110px] h-[80px]  "
        initial={{ x: "-100vw", opacity: 0 }}
        animate={controls}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={
          {
            //   position: "absolute",
            //   left: "50%",
            //   top: "50%",
            //   transform: "translate(-40%, -50%)",
          }
        }
      >
        {/* Your car image or component goes here */}
        <Image
          src={"/frenbus.png"}
          fill
          className="object-contain"
          quality={100}
          alt="logo"
          priority
        />
      </motion.div>
    </motion.div>
  );
};

export default HomeAnimation;
