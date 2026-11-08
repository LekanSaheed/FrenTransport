import React from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import ContactCards from "@/components/layout/ContactCards";

export const metadata = { title: "Contact us | Obere Transport" };

const Contact = () => {
  return (
    <Container className="mb-10">
      <PageHeader
        eyebrow="Contact"
        title="We're here to help."
        description="Questions about a trip, a hire request or a payment? Reach our support team on any of these channels."
      />
      <ContactCards />
      <div className="mt-8 rounded-[22px] bg-canvas p-6 text-[14.5px] leading-[165%] text-gray-600 md:p-8">
        <p className="font-display text-[17px] font-black text-ink">Have a booking already?</p>
        <p className="mt-1">
          You can{" "}
          <Link href="/booking-status" className="font-bold text-primary underline-offset-4 hover:underline">
            check its status
          </Link>{" "}
          or{" "}
          <Link href="/manage" className="font-bold text-primary underline-offset-4 hover:underline">
            manage it yourself
          </Link>{" "}
          (pay, cancel or request a change) with your booking reference and email. Please have your reference ready when you contact us.
        </p>
      </div>
    </Container>
  );
};

export default Contact;
