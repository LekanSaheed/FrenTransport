/** Main navigation (header). */
const links = [
  { label: "Book a seat", path: "/book" },
  { label: "Hire a car", path: "/hire/car" },
  { label: "Hire a bus", path: "/hire/bus" },
  { label: "Booking status", path: "/booking-status" },
  { label: "Manage booking", path: "/manage" },
];

/** Footer columns. */
export const footerLinks = [
  {
    title: "Travel",
    items: [
      { label: "Book a seat", path: "/book" },
      { label: "Bus routes", path: "/routes" },
      { label: "Hire a car", path: "/hire/car" },
      { label: "Hire a bus", path: "/hire/bus" },
    ],
  },
  {
    title: "Your trip",
    items: [
      { label: "Booking status", path: "/booking-status" },
      { label: "Manage booking", path: "/manage" },
      { label: "My account", path: "/account" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About us", path: "/about" },
      { label: "Contact", path: "/contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms and Conditions", path: "/legal/terms" },
      { label: "Refund Policy", path: "/legal/refunds" },
      { label: "Baggage Policy", path: "/legal/baggage" },
      { label: "Customer Privacy Policy", path: "/legal/customer-privacy" },
      { label: "Driver Privacy Policy", path: "/legal/driver-privacy" },
    ],
  },
];

export default links;
