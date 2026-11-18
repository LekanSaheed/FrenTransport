import type { PublicConfig } from "./api";
import { naira } from "./format";

/**
 * Obere Transport's legal documents: Terms and Conditions, Refund Policy, Baggage Policy,
 * Customer Privacy Policy and Driver Privacy Policy. Original text written for how this service works (bookings,
 * holds, refunds, date changes, baggage, QR check-in, hire). Have a Nigerian lawyer review
 * them before relying on them. No postal address appears anywhere, by design.
 *
 * Edit the text here; the pages under /legal render it. Bump `updated` when you change one.
 */

export interface LegalSection {
  heading: string;
  /** Paragraphs, in order. */
  body?: string[];
  /** A bulleted list after the paragraphs. */
  list?: string[];
  /** Paragraphs after the list. */
  after?: string[];
}

export interface LegalDocument {
  slug: "terms" | "refunds" | "baggage" | "customer-privacy" | "driver-privacy";
  title: string;
  /** One line for the /legal index and search results. */
  summary: string;
  /** Effective date, ISO (YYYY-MM-DD). */
  updated: string;
  intro: string[];
  sections: LegalSection[];
}

const COMPANY = "Obere Transport Ltd";

export const TERMS: LegalDocument = {
  slug: "terms",
  title: "Terms and Conditions",
  summary: "The rules for booking and travelling with us, hiring a vehicle and using our website.",
  updated: "2026-11-18",
  intro: [
    `These Terms and Conditions ("Terms") apply when you use the Obere Transport website, book a seat on one of our intercity buses, hire a car or bus from us, or travel with us. "Obere Transport", "we", "us" and "our" mean ${COMPANY}. "You" means the person making the booking and, where it applies, each passenger on it.`,
    "By making a booking or using our website you accept these Terms. If you book for other people, you confirm that they have agreed to them too. Please read them together with our Customer Privacy Policy.",
  ],
  sections: [
    {
      heading: "1. Our services",
      body: [
        "We sell seats on scheduled intercity bus trips within Nigeria, and we hire out cars and buses with a driver for private trips. The routes, departure times, vehicles and prices shown on our website are the ones currently on offer and can change.",
        "Photos of vehicles are examples. We may use a different vehicle of the same type, or a comparable one, on any trip.",
      ],
    },
    {
      heading: "2. Booking a seat",
      list: [
        "When you choose your seats and continue to payment, we hold them for you for a limited time, shown at checkout. If payment isn't completed in that time, the hold ends and the seats are released to other customers.",
        "A booking is confirmed only when we have received your payment in full. We then email your confirmation, which includes your booking reference and your boarding pass (QR code).",
        "Online booking for a departure closes shortly before it leaves. After that, please contact us or visit the terminal.",
        "Please check your booking details carefully. Each passenger's name should match the identification they will carry.",
        "Children must travel with an adult and need their own seat unless we state otherwise.",
      ],
    },
    {
      heading: "3. Prices and payment",
      list: [
        "Prices are in Nigerian naira and include the charges shown at checkout. The price you pay is the one shown when you confirm your booking.",
        "Online payments are processed by our payment partner, Paystack. We never see or store your full card details.",
        "If we receive a payment that we can't apply to a booking (for example, because the seats were taken before your payment arrived, or you were charged twice), we refund it in full to the original payment method.",
        "Refunds are returned to the payment method you used. How long they take to appear depends on your bank or card issuer.",
      ],
    },
    {
      heading: "4. Changing your booking",
      body: ["You can make most changes yourself in Manage Booking, using your booking reference and email address, or in your account if you have one."],
      list: [
        "Passenger names and seats can be changed free of charge while online booking for the trip is open. A seat change is only possible if another seat is free.",
        "You can move to a later departure on the same route up to the cut-off shown in Manage Booking. A change charge may apply, and its amount is shown before you confirm. Change charges are not refundable.",
        "Changes can't be made after you've checked in for the trip.",
      ],
      after: ["For anything you can't change online, contact us and we'll help where we can."],
    },
    {
      heading: "5. Cancelling your booking",
      list: [
        "You can cancel a booking in Manage Booking before departure, unless you've already checked in.",
        "The refund you'll receive, if any, depends on how long before departure you cancel. Manage Booking always shows the exact refund before you confirm the cancellation.",
        "Extra baggage paid for online is refunded at the same rate as the fare. Date change charges are not refunded. Our Refund Policy has the full details.",
        "If you don't travel and don't cancel before departure (a \"no-show\"), the fare is not refunded.",
      ],
    },
    {
      heading: "6. Delays, changes and cancellations by us",
      body: [
        "We do our best to run every trip on time, but road, traffic, weather, security and other conditions outside our control can cause delays. Departure and arrival times are estimates and are not guaranteed.",
        "We may need to change a departure time, change the vehicle, or cancel a trip. If we change your departure time, we'll tell you by email. If we cancel your trip, we will refund the fare in full, or move you to another departure if you prefer and one is available.",
        "We are not responsible for onward travel, appointments or other plans affected by a delay, so please allow enough time.",
      ],
    },
    {
      heading: "7. Check-in and travel",
      list: [
        "Please arrive at the terminal at least 30 minutes before departure with a valid photo ID.",
        "Show your boarding pass (QR code) or booking reference at check-in. Each boarding pass can be used once, for the booked trip only.",
        "Vehicles leave on time. If you arrive after boarding has closed, we may not be able to carry you, and the no-show rules in section 5 apply.",
        "Please follow the instructions of our drivers and terminal staff, and wear a seat belt where one is fitted.",
      ],
    },
    {
      heading: "8. Baggage",
      list: [
        "Each passenger's free baggage allowance (number of bags and maximum weight) is shown when you book and on your booking. Bags over the allowance may be accepted for a charge, paid at the terminal or online where we offer it, and only if there is space. Our Baggage Policy has the full details.",
        "Label your bags with your name and phone number. Keep valuables, money, medicines and documents with you: we are not responsible for them in the luggage hold.",
        "You must not carry dangerous, illegal or offensive items. These include weapons, explosives, gas cylinders, flammable or corrosive substances, illegal drugs, and live animals unless we have agreed in advance. We may refuse or remove any item we reasonably believe is unsafe.",
        "If your bag is lost or damaged while in our care, report it to staff before you leave the terminal or as soon as possible afterwards. Our liability for baggage is limited as set out in section 12.",
        "Items left on a vehicle or at a terminal are kept for a reasonable period. Contact us to arrange collection.",
      ],
    },
    {
      heading: "9. Conduct on board",
      body: ["To keep every journey safe and comfortable, you must not:"],
      list: [
        "behave in a violent, threatening, abusive or disorderly way towards passengers or staff;",
        "smoke, vape, or drink alcohol on board;",
        "be under the influence of alcohol or drugs to the extent that you are a risk to yourself or others;",
        "damage the vehicle or interfere with its equipment or the driver;",
        "carry out any illegal activity.",
      ],
      after: [
        "We may refuse to carry, or remove from the vehicle, anyone who breaks these rules, without a refund, and we may report incidents to the authorities.",
      ],
    },
    {
      heading: "10. Car and bus hire",
      list: [
        "Hire bookings must be made at least the minimum notice shown on the booking page.",
        "Some hires are priced instantly; others need a quotation. A quotation is valid until the time stated on it. Your hire is confirmed only when you've accepted the quotation (if there is one) and paid in full.",
        "The vehicle comes with one of our drivers. The hire covers the pickup point, destination, dates and number of passengers you gave us. Changes to the route, duration or passenger numbers need our agreement and may change the price.",
        "The number of passengers must not exceed the vehicle's seating capacity.",
        "You are responsible for the conduct of your passengers and for any damage they cause to the vehicle, beyond normal wear and tear.",
        "Cancellation and refund terms for hire are shown when you book and when you cancel.",
      ],
    },
    {
      heading: "11. Accounts and the website",
      list: [
        "You don't need an account to book. If you create one, keep your password private: you are responsible for activity on your account.",
        "You must not misuse our website or systems, for example by trying to access other people's bookings, interfere with the service, make bookings you don't intend to pay for to block seats, or use automated tools to collect data.",
        "We may suspend or close an account, or cancel bookings, where we reasonably believe there has been fraud or misuse.",
        "The content of our website, including our name and logo, belongs to us. You may not copy or reuse it without our permission.",
      ],
    },
    {
      heading: "12. Our responsibility to you",
      body: [
        "We will provide our services with reasonable care and skill. Nothing in these Terms limits our liability for death or personal injury caused by our negligence, or anything else that cannot be limited under Nigerian law.",
        "Otherwise, our total liability to you for any booking is limited to the amount you paid for it, and we are not liable for indirect losses such as loss of business, earnings or opportunity, or missed connections. Liability for lost or damaged baggage is limited to what is reasonable for ordinary personal belongings, unless you declared higher-value items and we agreed to carry them.",
        "We are not responsible for failures or delays caused by events beyond our reasonable control, such as severe weather, road closures, accidents involving others, civil unrest, security incidents, strikes, or actions of the authorities.",
      ],
    },
    {
      heading: "13. Complaints",
      body: [
        "If something goes wrong, please tell us as soon as possible using the details on our Contact page, quoting your booking reference. We aim to respond promptly and to resolve complaints fairly.",
      ],
    },
    {
      heading: "14. Changes to these Terms",
      body: [
        "We may update these Terms from time to time. The version that applies to your booking is the one published when you made it. The date at the top of this page shows when they were last updated.",
      ],
    },
    {
      heading: "15. Governing law",
      body: [
        "These Terms are governed by the laws of the Federal Republic of Nigeria, and the courts of Nigeria have jurisdiction over any dispute. If any part of these Terms is found to be unenforceable, the rest remains in effect.",
      ],
    },
  ],
};

export const CUSTOMER_PRIVACY: LegalDocument = {
  slug: "customer-privacy",
  title: "Customer Privacy Policy",
  summary: "What we collect when you book or travel with us, why, who we share it with, and your rights.",
  updated: "2026-11-18",
  intro: [
    `This policy explains how ${COMPANY} ("Obere Transport", "we", "us") collects and uses personal data about customers and passengers when you use our website, book or manage a trip, hire a vehicle or travel with us. We are the data controller for this information, and we process it in line with the Nigeria Data Protection Act 2023 and related regulations.`,
  ],
  sections: [
    {
      heading: "1. What we collect",
      list: [
        "Contact details: the full name, email address and phone number of the person making the booking.",
        "Passenger details: each passenger's name, seat and, if given, gender; and next-of-kin details if you add them.",
        "Booking details: your trips, seats, baggage, hire requests, changes, cancellations, check-in time and booking history.",
        "Payment details: the amount, status and reference of each payment. Card payments are handled by Paystack; we never see or store your full card details.",
        "Account details, if you create an account: your name, email, phone number and a securely hashed password (we never store the password itself).",
        "Technical details: your IP address and basic device and browser information, used to keep the service secure, prevent abuse and keep you signed in (see Cookies below).",
        "Messages you send us, such as change requests and complaints.",
      ],
    },
    {
      heading: "2. How we use it",
      list: [
        "To take and manage your booking: holding seats, taking payment, issuing your confirmation and boarding pass, and checking you in.",
        "To contact you about your trip: confirmations, receipts, reminders, schedule changes, cancellations and refunds.",
        "To let you manage your booking securely, for example by sending one-time verification codes.",
        "To keep passengers, staff and vehicles safe, for example by keeping a passenger list for each trip and contacting next of kin in an emergency.",
        "To prevent fraud and misuse, and to keep our systems secure.",
        "To meet our legal, accounting and regulatory obligations.",
        "To improve our routes and services, using booking information in a form that doesn't identify you where possible.",
      ],
      after: ["We do not sell your personal data. We only send you marketing messages if you have agreed to receive them, and you can opt out at any time."],
    },
    {
      heading: "3. Our legal bases",
      body: ["We process your personal data because:"],
      list: [
        "we need it to provide the service you've booked (performing our contract with you);",
        "the law requires it, for example for tax records or when the authorities make a lawful request;",
        "it is in our legitimate interests to keep our services safe, secure and working well, where those interests are not outweighed by your rights; or",
        "you have given your consent, for example to marketing. You can withdraw consent at any time.",
      ],
    },
    {
      heading: "4. Who we share it with",
      body: ["We share personal data only where needed, with:"],
      list: [
        "Paystack, to process payments and refunds;",
        "our email provider, to send booking emails and verification codes;",
        "our hosting and technology providers, who store and run our systems on our behalf;",
        "our drivers and terminal staff, who see the passenger list and booking details needed to check you in and carry you;",
        "law enforcement, regulators or courts, when the law requires it or to protect the safety of passengers and staff.",
      ],
      after: [
        "Our service providers may only use your data to provide services to us, under contracts that require them to protect it. Some of them process data on servers outside Nigeria; where that happens, we make sure appropriate safeguards are in place as the law requires.",
      ],
    },
    {
      heading: "5. Cookies",
      body: [
        "Our website uses a small number of essential cookies to keep you signed in to your account and to keep the service secure. We don't use advertising cookies. If you block cookies in your browser, you can still book as a guest, but signing in to an account may not work.",
      ],
    },
    {
      heading: "6. How long we keep it",
      body: [
        "We keep booking and payment records for as long as we need them to provide the service and to meet our legal and accounting obligations, which can be several years after your trip. One-time verification codes and sign-in links expire within minutes or hours. If you close your account, we delete or anonymise your account details, but keep booking records we're required to keep.",
      ],
    },
    {
      heading: "7. How we protect it",
      body: [
        "We use technical and organisational measures to protect your data, including encrypted connections, hashed passwords, access limited to staff who need it, and a log of changes staff make to bookings. No system is perfectly secure, so please keep your booking reference, verification codes and password private.",
      ],
    },
    {
      heading: "8. Your rights",
      body: ["Under Nigerian data protection law you can ask us to:"],
      list: [
        "tell you what personal data we hold about you and give you a copy;",
        "correct data that is wrong or incomplete;",
        "delete your data where we no longer need it or have no legal reason to keep it;",
        "restrict or object to certain uses of your data;",
        "give you your data in a portable format; and",
        "stop sending you marketing at any time.",
      ],
      after: [
        "To make a request, contact us using the details on our Contact page. We may need to confirm your identity first. If you're not satisfied with our response, you can complain to the Nigeria Data Protection Commission.",
      ],
    },
    {
      heading: "9. Children",
      body: [
        "Bookings must be made by an adult. We only hold a child's details when an adult includes them as a passenger on a booking.",
      ],
    },
    {
      heading: "10. Changes to this policy",
      body: ["We may update this policy from time to time. The date at the top shows when it was last updated."],
    },
  ],
};

export const DRIVER_PRIVACY: LegalDocument = {
  slug: "driver-privacy",
  title: "Driver Privacy Policy",
  summary: "How we collect, use and protect the personal data of the drivers who work with us.",
  updated: "2026-11-18",
  intro: [
    `This policy explains how ${COMPANY} ("Obere Transport", "we", "us") collects and uses personal data about drivers who apply to work with us, or who drive for us as employees or contractors. We process this data in line with the Nigeria Data Protection Act 2023 and related regulations.`,
  ],
  sections: [
    {
      heading: "1. What we collect",
      list: [
        "Identity and contact details: name, date of birth, photograph, phone number, email address and emergency contact.",
        "Identification and licensing: government-issued ID, National Identification Number (NIN), driver's licence details, and any other permits needed for the work.",
        "Background and suitability: work history, references, guarantor details, and the results of checks we're permitted to carry out, such as licence and identity verification, medical fitness and, where lawful, criminal record checks.",
        "Work records: the trips and hires you're assigned, vehicles you drive, schedules, attendance, training, performance and any incidents, complaints or accidents.",
        "Vehicle and trip data: where our vehicles are fitted with tracking, telematics or cameras, data such as location, speed and driving events while you are on duty.",
        "Payment details: bank account details and records of pay, allowances and deductions.",
      ],
    },
    {
      heading: "2. How we use it",
      list: [
        "To assess your application and confirm your identity, licence and fitness to drive.",
        "To assign trips and hires, schedule work and manage our fleet.",
        "To pay you and keep the records the law requires.",
        "To keep passengers, you and the public safe, including by monitoring driving standards and investigating incidents, accidents and complaints.",
        "To provide training and manage performance.",
        "To meet our legal obligations and to respond to lawful requests from the authorities, insurers or courts.",
      ],
    },
    {
      heading: "3. Our legal bases",
      body: [
        "We process driver data because we need it to enter into and perform your contract, because the law requires it, because it is in our legitimate interests to run a safe and reliable service (where those interests are not outweighed by your rights), or, for anything else, with your consent. Sensitive data, such as health information or criminal record checks, is processed only where the law allows and with appropriate safeguards.",
      ],
    },
    {
      heading: "4. Who we share it with",
      list: [
        "Passengers and hire customers may be given your first name and the vehicle's details so they can find their vehicle.",
        "Verification providers that check identity, licences or backgrounds on our behalf.",
        "Our insurers, and the authorities after an accident or incident.",
        "Banks and payroll providers, to pay you.",
        "Our hosting and technology providers, who store and run our systems on our behalf.",
        "Law enforcement, regulators or courts, when the law requires it.",
      ],
      after: [
        "Anyone who processes driver data for us must protect it and use it only for the purpose we've given them. We do not sell driver data.",
      ],
    },
    {
      heading: "5. How long we keep it",
      body: [
        "We keep application data for unsuccessful applicants only as long as needed to complete the recruitment process and handle any questions about it. For drivers who work with us, we keep records for the duration of the engagement and afterwards for as long as the law requires (for example for tax, employment and insurance purposes) or as needed to handle claims. Tracking and camera data is kept only for a limited period unless it's needed to investigate an incident.",
      ],
    },
    {
      heading: "6. How we protect it",
      body: [
        "Driver data is stored securely and only staff who need it for their role can see it. We use encrypted connections and access controls.",
      ],
    },
    {
      heading: "7. Your rights",
      body: [
        "You can ask to see the personal data we hold about you, to correct it, to delete it where we no longer need it, to restrict or object to certain uses, or to receive it in a portable format. To make a request, contact us using the details on our Contact page. If you're not satisfied with our response, you can complain to the Nigeria Data Protection Commission.",
      ],
    },
    {
      heading: "8. Changes to this policy",
      body: ["We may update this policy from time to time. The date at the top shows when it was last updated."],
    },
  ],
};

type Config = PublicConfig | null;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Refund Policy. Built from the live settings (Admin → Settings) so the numbers always
 * match what Manage Booking does; with no settings available it uses general wording.
 */
export function refundPolicy(cfg: Config): LegalDocument {
  const c = cfg?.cancellation;
  const window = c ? plural(c.refundWindowHours, "hour") : null;
  const dateCut = cfg ? plural(cfg.amendments.dateChangeCutoffHours, "hour") : null;
  return {
    slug: "refunds",
    title: "Refund Policy",
    summary: "When you can get money back if you cancel, if we cancel, or if a payment can't be used.",
    updated: "2026-11-18",
    intro: [
      `This policy explains when ${COMPANY} ("Obere Transport", "we", "us") refunds payments, how much, and how refunds reach you. It forms part of our Terms and Conditions. Manage Booking always shows the exact refund for your booking before you confirm a cancellation.`,
    ],
    sections: [
      {
        heading: "1. If you cancel a seat booking",
        list: c
          ? [
              `Cancel ${window} or more before departure: we refund ${c.refundPercent}% of what you paid for the booking.`,
              `Cancel less than ${window} before departure: no refund.`,
              "You can't cancel online after departure or after you've checked in.",
            ]
          : [
              "Cancel early enough before departure and we refund most of what you paid; cancel late and there's no refund. Manage Booking shows the exact amount and cut-off for your booking.",
              "You can't cancel online after departure or after you've checked in.",
            ],
        after: [
          "Cancel in Manage Booking (with your booking reference and email) or in your account. If you cancel before paying, nothing is charged and your held seats are released.",
        ],
      },
      {
        heading: "2. No-shows",
        body: ["If you don't travel and didn't cancel before departure, the booking is not refunded. Please arrive at the terminal at least 30 minutes before departure."],
      },
      {
        heading: "3. If we cancel or change your trip",
        list: [
          "If we cancel your trip, we refund everything you paid for the booking in full, including any extra bags, and email you. If you'd rather travel on another departure, contact us and we'll move you where seats are available.",
          "If we change your departure time, we email you. Your booking stays valid at the new time; if it no longer suits you, you can change to a later trip or cancel under section 1.",
          "Delays caused by traffic, weather, road or security conditions are not refunded, but we always do our best to get you there safely.",
        ],
      },
      {
        heading: "4. Extra baggage",
        body: [
          "Extra bags paid for online are refunded at the same rate as the fare: if you're refunded a percentage of your fare, you're refunded the same percentage of your extra-bag fees. If we cancel the trip, they're refunded in full.",
        ],
      },
      {
        heading: "5. Date changes",
        list: [
          `Moving your booking to a later departure costs a change charge${dateCut ? `, and closes ${dateCut} before your original departure` : ""}. The charge is shown before you pay.`,
          "Change charges are not refundable, including if you cancel the new trip later.",
          "If the seats on your new trip are taken before your change charge reaches us, the change doesn't happen and we refund the charge in full. Your booking stays on its original trip.",
        ],
      },
      {
        heading: "6. Car and bus hire",
        list: [
          "Hire bookings follow the same cancellation rules as seat bookings, counted from the pickup time.",
          "For hires priced by quotation, a cancellation request is reviewed by our team, who confirm the outcome by email.",
          "If you decline a quotation, or let it expire without paying, nothing is charged.",
        ],
      },
      {
        heading: "7. Payments we can't use",
        body: ["We refund the payment in full, automatically, if:"],
        list: [
          "your seats were released (for example, the hold ran out) and taken before your payment reached us;",
          "you were charged twice for the same booking or change; or",
          "the booking had been cancelled or had expired by the time the payment arrived.",
        ],
      },
      {
        heading: "8. How refunds are paid",
        list: [
          "Card and online payments are refunded through Paystack to the card or account you paid with. We start the refund straight away; how long it takes to show depends on your bank or card issuer.",
          "Payments made in cash, by bank transfer or at a POS terminal are refunded by our team, who may ask for your account details.",
          "Refunds are made in naira.",
          "We email you about your refund. If you haven't received it after a reasonable time, contact us with your booking reference.",
        ],
      },
      {
        heading: "9. Questions and disputes",
        body: [
          "If you think a refund is wrong, contact us through our Contact page with your booking reference and we'll look into it. Please contact us before raising a chargeback with your bank, as that can delay the refund.",
        ],
      },
    ],
  };
}

/** Baggage Policy, built from the live baggage settings (Admin → Settings → Baggage). */
export function baggagePolicy(cfg: Config): LegalDocument {
  const b = cfg?.baggage;
  const allowance = b
    ? b.freeBagsPerPassenger
      ? `${plural(b.freeBagsPerPassenger, "bag")} of up to ${b.maxBagWeightKg} kg${b.freeBagsPerPassenger > 1 ? " each" : ""}`
      : "no free checked bags"
    : null;
  const price = b
    ? b.extraBagCharge === "flat"
      ? `${naira(b.extraBagFlatKobo)} per extra bag`
      : `${b.extraBagPercent}% of the seat fare per extra bag (at least ${naira(b.extraBagMinKobo)})`
    : null;
  const inApp = b?.extraBagPayment === "in_app";
  return {
    slug: "baggage",
    title: "Baggage Policy",
    summary: "What you can bring for free, how extra bags are charged, what you can't carry, and lost or damaged bags.",
    updated: "2026-11-18",
    intro: [
      `This policy explains what passengers can bring on ${COMPANY} intercity trips. It forms part of our Terms and Conditions. Your booking always shows the allowance that applies to it.`,
    ],
    sections: [
      {
        heading: "1. Free allowance",
        body: [
          allowance
            ? `Each passenger can bring ${allowance} in the luggage hold, at no extra cost.${b?.note ? ` ${b.note}` : ""}`
            : "Each passenger has a free baggage allowance, shown when you book and on your booking.",
          "The allowance shown on your booking is the one you were sold; later changes to this policy don't reduce it.",
        ],
      },
      {
        heading: "2. Extra bags",
        list: inApp
          ? [
              `You can buy extra bags online at ${price}, up to ${plural(b!.maxExtraBagsPerPassenger, "extra bag")} per passenger: before you pay for your booking, or later from Manage Booking until online booking for the trip closes.`,
              `Each extra bag can weigh up to ${b!.maxBagWeightKg} kg.`,
              "More bags than that can be paid for at the terminal, if there's space in the vehicle.",
            ]
          : [
              "Extra bags are paid for at the terminal before boarding, and are accepted only if there's space in the vehicle. Please arrive early so they can be weighed and tagged.",
            ],
        after: inApp ? ["Extra bags paid for online are refunded on the same terms as the fare (see our Refund Policy)."] : [],
      },
      {
        heading: "3. Size, weight and packing",
        list: [
          ...(b ? [`Bags over ${b.maxBagWeightKg} kg may be refused, or charged as an extra bag.`] : ["Bags over the weight limit may be refused or charged as an extra bag."]),
          "Bags must fit in the luggage hold and be closed securely. Wrap fragile items well; we can't accept responsibility for damage to fragile or poorly packed items.",
          "Label each bag with your name and phone number.",
          "Staff may weigh bags at check-in, and may ask to see inside a bag where safety requires it.",
        ],
      },
      {
        heading: "4. Keep these with you",
        body: [
          "Don't put money, jewellery, phones, laptops, medicines, keys, travel or identity documents, or other valuables in the luggage hold. Keep them with you. We are not responsible for them if they are packed in the hold.",
        ],
      },
      {
        heading: "5. Items you can't carry",
        list: [
          "weapons, ammunition, explosives and fireworks;",
          "gas cylinders, fuel and other flammable, corrosive or toxic substances;",
          "illegal drugs and any item that is illegal to carry or transport;",
          "live animals, unless we have agreed in advance;",
          "goods carried for trade or delivery on someone else's behalf, unless we have agreed in advance;",
          "anything with a strong smell, or that leaks, or that could damage other passengers' belongings or the vehicle.",
        ],
        after: [
          "We may refuse to carry, or remove, any item we reasonably believe is unsafe or not allowed, and may report illegal items to the authorities.",
        ],
      },
      {
        heading: "6. Lost, damaged or delayed bags",
        list: [
          "Check your bags when you collect them. Report any loss or damage to our staff before you leave the arrival terminal, or as soon as possible afterwards through our Contact page, with your booking reference.",
          "Where we're responsible for loss or damage, our liability is limited to what is reasonable for ordinary personal belongings, unless you declared higher-value items before travel and we agreed to carry them.",
          "We aren't responsible for wear and tear, or for items in section 4 packed in the hold.",
        ],
      },
      {
        heading: "7. Left behind",
        body: [
          "Items left on a vehicle or at a terminal are kept for a reasonable period. Contact us with your booking reference and a description to arrange collection. Perishable or unsafe items may be disposed of.",
        ],
      },
      {
        heading: "8. Car and bus hire",
        body: [
          "For hires, luggage must fit safely in the vehicle together with your passengers. Tell us when you book if you're carrying a lot of luggage or anything unusual, so we can provide a suitable vehicle. Section 5 applies to hires too.",
        ],
      },
    ],
  };
}

/** Index of all documents (titles and summaries don't depend on settings). */
export const LEGAL_DOCUMENTS: Pick<LegalDocument, "slug" | "title" | "summary">[] = [
  TERMS,
  refundPolicy(null),
  baggagePolicy(null),
  CUSTOMER_PRIVACY,
  DRIVER_PRIVACY,
].map(({ slug, title, summary }) => ({ slug, title, summary }));

/** Documents that show the operator's current settings. */
export const LIVE_DOCUMENTS = new Set(["refunds", "baggage"]);

export function legalDocument(slug: string, cfg: Config = null): LegalDocument | null {
  if (slug === "refunds") return refundPolicy(cfg);
  if (slug === "baggage") return baggagePolicy(cfg);
  return [TERMS, CUSTOMER_PRIVACY, DRIVER_PRIVACY].find((d) => d.slug === slug) ?? null;
}
