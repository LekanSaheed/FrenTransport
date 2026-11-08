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
];

export default links;
