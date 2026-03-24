// RPM Auto Lab brand constants
export const BRAND = {
  name: "RPM Auto Lab",
  tagline: "Revive • Protect • Maintain",
  phone: "(248) 555-0199", // TODO: get real phone number from client
  email: "info@rpmautolab.com",
  address: {
    street: "4581 S Lapeer Rd, Suite G",
    city: "Orion Township",
    state: "MI",
    zip: "48359",
    full: "4581 S Lapeer Rd, Suite G, Orion Township, MI 48359",
  },
  social: {
    instagram: "https://www.instagram.com/rpmautolab/",
    facebook: "https://www.facebook.com/p/RPM-Auto-Lab-61578777166775/",
  },
  hours: {
    weekdays: "Mon–Fri: 8:00 AM – 6:00 PM",
    saturday: "Sat: 9:00 AM – 3:00 PM",
    sunday: "Sun: Closed",
  },
} as const;

export const SERVICES = [
  {
    id: "ceramic-coating",
    name: "Ceramic Coating",
    shortDesc: "Long-lasting paint protection with a mirror-like finish",
    description:
      "Our professional-grade ceramic coatings bond at the molecular level, creating an impenetrable shield that repels water, UV rays, and contaminants for years — not months.",
    icon: "Shield",
    features: [
      "9H hardness rating",
      "Hydrophobic surface",
      "UV protection",
      "5+ year durability",
      "Self-cleaning effect",
    ],
    startingPrice: 599,
  },
  {
    id: "paint-protection-film",
    name: "Paint Protection Film",
    shortDesc: "Invisible armor against rock chips, scratches & debris",
    description:
      "Military-grade thermoplastic urethane film that self-heals minor scratches and absorbs impacts. Your paint stays factory-fresh, even after years of daily driving.",
    icon: "Layers",
    features: [
      "Self-healing technology",
      "Optically clear finish",
      "Rock chip protection",
      "10-year warranty",
      "Custom precision cut",
    ],
    startingPrice: 799,
  },
  {
    id: "window-tint",
    name: "Window Tint",
    shortDesc: "Premium ceramic tint for style, privacy & UV rejection",
    description:
      "Nano-ceramic window film that blocks 99% of UV rays and up to 85% of infrared heat — keeping your interior cooler and your skin protected without signal interference.",
    icon: "Sun",
    features: [
      "99% UV rejection",
      "Heat reduction up to 85%",
      "No signal interference",
      "Lifetime warranty",
      "Multiple shade options",
    ],
    startingPrice: 249,
  },
  {
    id: "vehicle-wraps",
    name: "Vehicle Wraps",
    shortDesc: "Full color transformations & custom designs",
    description:
      "Transform your vehicle with premium vinyl wraps in any color, finish, or custom design. From satin blacks to chrome deletes — your vision, our execution.",
    icon: "Paintbrush",
    features: [
      "3M & Avery certified",
      "Color change wraps",
      "Chrome delete",
      "Commercial fleet wraps",
      "Removable & reversible",
    ],
    startingPrice: 2499,
  },
  {
    id: "paint-correction",
    name: "Paint Correction",
    shortDesc: "Eliminate swirls, scratches & oxidation",
    description:
      "Multi-stage machine polishing that removes years of damage to reveal the true depth and clarity hiding beneath. The essential step before any coating.",
    icon: "Sparkles",
    features: [
      "Multi-stage polishing",
      "Swirl mark removal",
      "Scratch elimination",
      "Paint depth gauging",
      "Gloss meter verified",
    ],
    startingPrice: 399,
  },
  {
    id: "detailing",
    name: "Detailing",
    shortDesc: "Meticulous interior & exterior restoration",
    description:
      "From hand-wash to full interior extraction — every surface cleaned, conditioned, and protected. Your vehicle leaves looking better than the day you bought it.",
    icon: "Droplets",
    features: [
      "Hand wash & dry",
      "Interior deep clean",
      "Leather conditioning",
      "Engine bay detailing",
      "Odor elimination",
    ],
    startingPrice: 149,
  },
  {
    id: "windshield-protection",
    name: "Windshield Protection",
    shortDesc: "Invisible film that guards against chips & cracks",
    description:
      "Optically clear protection film for your windshield that absorbs rock impacts and reduces the chance of chips turning into expensive cracks.",
    icon: "Eye",
    features: [
      "Impact absorption",
      "Optically clear",
      "Hydrophobic coating",
      "Reduced glare",
      "Easy replacement",
    ],
    startingPrice: 299,
  },
] as const;

export const STATS = [
  { value: 2500, suffix: "+", label: "Vehicles Protected" },
  { value: 15, suffix: "+", label: "Years Experience" },
  { value: 99, suffix: "%", label: "Customer Satisfaction" },
  { value: 5, suffix: "★", label: "Google Rating" },
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/visualizer", label: "Visualizer" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Get a Quote" },
] as const;
