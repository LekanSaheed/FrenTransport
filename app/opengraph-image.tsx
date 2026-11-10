import { OG_SIZE, ogCard } from "@/libs/og";

export const alt = "Obere Transport: intercity bus travel, car and bus hire in Nigeria";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Intercity travel in Nigeria",
    title: "Book your seat. Travel in comfort.",
    subtitle: "Bus seats on routes across Nigeria, plus car and bus hire. Pay online, manage your booking anytime.",
  });
}
