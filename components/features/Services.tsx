import React, { FunctionComponent } from "react";
import Container from "../layout/Container";
import { Bus, TruckFast, Car } from "iconsax-react";
import Heading from "../typography/Heading";

interface services {
  title: string;
  description: string;
  bg: string;
  icon: FunctionComponent;
}
const Services: FunctionComponent = () => {
  const services: Array<services> = [
    {
      icon: Bus,
      title: "Transportation",
      description:
        "Streamline your journey with our top-notch transportation service. From point A to B, we ensure reliability, comfort, and punctuality, making every trip a seamless experience.",
      bg: "bg-secondary/10",
    },
    {
      icon: TruckFast,
      title: "Logistics",

      description:
        "Experience hassle-free deliveries for everyone. Our logistics service caters to individuals and businesses alike, ensuring swift and secure transportation of your items to any destination. Reliable solutions, accessible to all.",
      bg: "bg-tertiary",
    },

    {
      icon: Car,
      title: "Charter",
      description:
        "Elevate your travel experience with our bespoke charter services. Whether it's a private event, corporate outing, or special occasion, we provide tailored solutions for a luxurious and personalized journey.",
      bg: "bg-primary/10",
    },
  ];
  return (
    <div id="services" className="py-5 border-b border-b-border-stroke">
      <Heading level={1} className="text-center">
        Our services
      </Heading>
      <Container>
        <ul className="flex gap-4 flex-col sm:flex-row  justify-center">
          {services.map((service, id) => {
            return (
              <li
                key={id}
                className={`${service.bg} md:w-[300px] text-black p-5 rounded-[20px]`}
              >
                <div
                  className="text-primary h-[50px] w-[50px] rounded-full bg-white flex 
                items-center justify-center mb-5"
                >
                  {React.createElement(service.icon, {
                    variant: "Bulk",
                    size: 26,
                  })}
                </div>
                <Heading className="mb-3" level={2}>
                  {service.title}
                </Heading>
                <p className="text-[14px] tracking-n-3 text-gray-600">
                  {service.description}
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </div>
  );
};

export default Services;
