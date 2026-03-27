// Base path for static assets (must match next.config.ts basePath)
export const BASE_PATH = "/rpm-auto-lab";

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

// Extended service data for individual landing pages
export const SERVICE_DETAILS: Record<string, {
  heroSubtitle: string;
  longDescription: string;
  process: { step: string; description: string }[];
  faqs: { question: string; answer: string }[];
  whyUs: string[];
  image: string;
}> = {
  "ceramic-coating": {
    heroSubtitle: "The ultimate paint protection with a showroom finish that lasts for years",
    longDescription: "Our professional-grade ceramic coatings create a permanent bond with your vehicle's paint at the molecular level. Unlike traditional waxes and sealants that wash away in weeks, ceramic coatings form an ultra-hard, glass-like shell (9H hardness) that repels water, dirt, UV rays, bird droppings, tree sap, and chemical contaminants. The result? A mirror-like, hydrophobic finish that makes your car look freshly detailed every single day — for 5+ years.",
    process: [
      { step: "Inspection & Wash", description: "Thorough decontamination wash, clay bar treatment, and iron fallout removal to create a perfectly clean surface." },
      { step: "Paint Correction", description: "Multi-stage machine polishing to remove swirls, scratches, and imperfections. The coating amplifies everything — so we start with perfection." },
      { step: "Surface Preparation", description: "IPA wipedown and panel preparation to ensure zero residues remain. The surface must be chemically clean for proper bonding." },
      { step: "Coating Application", description: "Hand-applied in a controlled environment with proper lighting. Each panel is coated individually with precise, overlapping passes." },
      { step: "Curing & Inspection", description: "Infrared curing followed by a full inspection under LED swirl-finder lights. We don't release your vehicle until it's flawless." },
    ],
    faqs: [
      { question: "How long does ceramic coating last?", answer: "Our professional-grade coatings last 5-7 years with proper maintenance. We also offer lifetime coating packages with annual inspections." },
      { question: "Is ceramic coating worth it?", answer: "Absolutely. It eliminates the need for waxing, makes washing effortless, protects against UV damage and chemical stains, and preserves your vehicle's resale value." },
      { question: "Can I wash my car normally after coating?", answer: "Yes — in fact, washing becomes much easier. Dirt and grime slide right off the hydrophobic surface. We recommend a pH-neutral car wash soap." },
      { question: "Does it protect against rock chips?", answer: "Ceramic coating protects against chemical damage and minor scratches, but not rock chips. For impact protection, we recommend pairing it with Paint Protection Film (PPF)." },
    ],
    whyUs: ["Certified Ceramic Pro & Gtechniq installers", "Climate-controlled application bay", "Paint correction included in every package", "5-year warranty with annual inspection option"],
    image: "/rpm-auto-lab/images/services/ceramic-coating.jpg",
  },
  "paint-protection-film": {
    heroSubtitle: "Invisible, self-healing armor that keeps your paint factory-fresh",
    longDescription: "Paint Protection Film (PPF) is a virtually invisible thermoplastic urethane film applied to your vehicle's most vulnerable surfaces. It absorbs the impact of rock chips, road debris, bug acids, and minor scratches — then self-heals with heat. Your paint stays pristine underneath, preserving both the appearance and resale value of your vehicle for a decade or more.",
    process: [
      { step: "Design & Template", description: "We use precision-cut software templates specific to your exact year, make, and model. Every curve and contour is mapped digitally." },
      { step: "Surface Prep", description: "Thorough wash, clay bar decontamination, and light polish of the areas to be filmed. Any imperfections under the film are permanent." },
      { step: "Film Installation", description: "Wet-applied by hand with surgical precision. We stretch, tuck, and wrap edges for invisible seams that won't peel." },
      { step: "Edge Sealing", description: "All edges are wrapped or sealed to prevent lifting. We tuck film into body gaps for a factory-invisible finish." },
      { step: "Final Cure & QC", description: "48-hour cure period followed by a full inspection. We check every edge, every corner, every transition point." },
    ],
    faqs: [
      { question: "Will the film be visible?", answer: "When properly installed, PPF is virtually invisible. Our premium film has an optically clear finish that doesn't alter your paint color or depth." },
      { question: "Does PPF really self-heal?", answer: "Yes. Our film uses advanced elastomeric polymer technology. Light scratches and swirl marks disappear with heat — from the sun, hot water, or a heat gun." },
      { question: "How long does PPF last?", answer: "Our premium PPF comes with a 10-year manufacturer warranty against yellowing, cracking, peeling, and staining. Many installations last well beyond that." },
      { question: "What areas should I protect?", answer: "At minimum: hood, front bumper, fenders, and mirrors (the 'full front'). For maximum protection, we recommend adding rocker panels, door edges, and the rear bumper." },
    ],
    whyUs: ["XPEL & SunTek certified installers", "DAP (Design Access Program) precision templates", "Lifetime edge-seal guarantee", "10-year manufacturer warranty"],
    image: "/rpm-auto-lab/images/services/ppf.jpg",
  },
  "window-tint": {
    heroSubtitle: "Premium ceramic window film for heat rejection, UV protection & privacy",
    longDescription: "Our nano-ceramic window tint is engineered to block up to 99% of harmful UV rays and reject up to 85% of infrared heat — all while maintaining crystal-clear visibility and zero signal interference. Unlike cheap dyed films that fade and bubble, our ceramic tint uses non-metallic, non-conductive nano-technology that won't interfere with GPS, cell signals, or satellite radio.",
    process: [
      { step: "Shade Consultation", description: "We'll help you choose the perfect VLT (Visible Light Transmission) percentage based on your style preference and Michigan's legal limits." },
      { step: "Glass Preparation", description: "Each window is meticulously cleaned and prepped. Even microscopic dust particles can cause bubbles — we eliminate them all." },
      { step: "Precision Cutting", description: "Film is computer-cut to your exact window dimensions. No hand-trimming on the vehicle — cleaner edges, no blade marks on your glass." },
      { step: "Application", description: "Wet-applied and squeegeed to remove every air pocket. Our technicians have thousands of installs of experience." },
      { step: "Inspection & Care Guide", description: "Every window inspected for imperfections. You'll receive a care guide with curing timeline and maintenance tips." },
    ],
    faqs: [
      { question: "Is window tint legal in Michigan?", answer: "Michigan allows any darkness on rear windows and the back windshield. Front side windows must allow more than 4 inches of non-tinted area at the top (the AS-1 line). We'll guide you through the legal options." },
      { question: "Will tint interfere with my electronics?", answer: "No. Our ceramic tint is completely non-metallic, so it won't affect Bluetooth, GPS, cell signals, satellite radio, or toll transponders." },
      { question: "How long until I can roll my windows down?", answer: "We recommend waiting 3-5 days for the adhesive to fully cure. In cooler weather, allow up to 7 days." },
      { question: "What's the difference between ceramic and regular tint?", answer: "Ceramic tint uses nano-ceramic particles instead of dyes or metals. It blocks significantly more heat, won't fade or turn purple, and doesn't interfere with electronics. It costs more but lasts much longer." },
    ],
    whyUs: ["Ceramic-only — we don't install cheap dyed film", "Computer-cut precision for every window", "Lifetime warranty against bubbling, peeling, and fading", "Same-day service available"],
    image: "/rpm-auto-lab/images/services/window-tint.jpg",
  },
  "vehicle-wraps": {
    heroSubtitle: "Transform your vehicle's entire appearance with premium vinyl wraps",
    longDescription: "A vehicle wrap lets you completely change your car's color and finish without touching the factory paint. Choose from hundreds of colors and finishes — satin, matte, gloss, metallic, chrome delete, carbon fiber, and more. Wraps also protect the paint underneath, and they're fully reversible. When you're ready for a change, we remove it to reveal the original paint in perfect condition.",
    process: [
      { step: "Design Consultation", description: "Choose your color, finish, and any custom design elements. We'll show you physical samples and help you visualize the final result." },
      { step: "Disassembly", description: "We remove door handles, mirrors, trim pieces, and badges for a seamless wrap with no visible edges or cut lines." },
      { step: "Surface Preparation", description: "Complete wash, clay bar, and IPA wipedown. The surface must be perfectly clean for the vinyl to adhere properly." },
      { step: "Wrap Application", description: "Each panel is wrapped individually, stretched and heated to conform perfectly to every curve, recess, and body line." },
      { step: "Reassembly & QC", description: "All trim and hardware reinstalled. Every edge inspected, every seam checked. Post-heat treatment to ensure long-term adhesion." },
    ],
    faqs: [
      { question: "How long does a vehicle wrap last?", answer: "With proper care, a quality wrap lasts 5-7 years. We use premium 3M and Avery Dennison vinyl with manufacturer warranties." },
      { question: "Will a wrap damage my paint?", answer: "No — in fact, it protects it. When removed properly, your factory paint is revealed in the same condition it was in before the wrap." },
      { question: "Can I wrap a leased vehicle?", answer: "Absolutely. Wraps are one of the best modifications for leased vehicles because they're fully reversible. Remove before return with zero penalty." },
      { question: "How much does a full wrap cost?", answer: "Full wraps typically range from $2,499 to $5,500+ depending on vehicle size, color choice, and complexity. Partial wraps and chrome deletes start lower." },
    ],
    whyUs: ["3M & Avery Dennison certified installers", "Full panel disassembly for seamless edges", "Commercial fleet wrap specialists", "500+ color and finish options"],
    image: "/rpm-auto-lab/images/services/vehicle-wraps.jpg",
  },
  "paint-correction": {
    heroSubtitle: "Restore your paint to better-than-new with multi-stage machine polishing",
    longDescription: "Over time, your vehicle's paint accumulates swirl marks from improper washing, micro-scratches from daily driving, water spots, bird dropping etchings, and oxidation from UV exposure. Paint correction is the art and science of machine polishing these defects away — layer by layer — to reveal the true depth, clarity, and gloss hiding beneath. It's the essential foundation before any coating or protection.",
    process: [
      { step: "Paint Assessment", description: "We measure paint thickness with a digital gauge on every panel. This tells us exactly how much clear coat we have to work with — safety first." },
      { step: "Decontamination", description: "Full wash, clay bar treatment, iron fallout removal, and tar/sap removal. Every contaminant must be eliminated before polishing." },
      { step: "Test Spot", description: "We polish a small section to determine the exact compound, pad, and technique needed for your specific paint system." },
      { step: "Multi-Stage Polish", description: "Compounding to remove defects, followed by finishing polish to refine the surface. Some paints require 3+ stages for perfection." },
      { step: "Gloss Meter Verification", description: "We measure gloss levels before and after with a digital gloss meter. You'll see the exact improvement in numbers — not just visually." },
    ],
    faqs: [
      { question: "What's the difference between a detail and paint correction?", answer: "Detailing cleans and protects. Paint correction actually removes defects from the clear coat through machine polishing. It's a much more intensive (and transformative) process." },
      { question: "Will paint correction remove all scratches?", answer: "It removes scratches and swirls that are within the clear coat layer. Deep scratches that reach the base coat or primer may be improved but not fully eliminated." },
      { question: "How often should I get paint correction?", answer: "Ideally, once — followed by ceramic coating or PPF to keep it perfect. If you maintain your coating properly, you shouldn't need correction again for years." },
      { question: "Can paint correction damage my paint?", answer: "Not when done by trained professionals. We measure paint thickness before and during the process to ensure we never remove too much clear coat." },
    ],
    whyUs: ["Digital paint depth measurement on every panel", "Gloss meter verification before and after", "Rupes & Flex professional polishing systems", "Perfect preparation for ceramic coating"],
    image: "/rpm-auto-lab/images/services/paint-correction.jpg",
  },
  "detailing": {
    heroSubtitle: "Meticulous hand detailing that makes your vehicle look better than new",
    longDescription: "Our detailing services go far beyond a basic car wash. We meticulously clean, restore, and protect every surface of your vehicle — inside and out. From hot water extraction on carpets to leather conditioning, engine bay detailing to wheel and tire restoration — we leave no surface untouched. Your vehicle leaves our lab looking, feeling, and smelling like the day it rolled off the showroom floor.",
    process: [
      { step: "Exterior Wash", description: "Foam cannon pre-soak, two-bucket hand wash, wheel and tire cleaning, and full rinse. We never use automated brushes that cause swirls." },
      { step: "Decontamination", description: "Clay bar treatment to remove bonded contaminants, iron fallout spray, and tar removal for a glass-smooth surface." },
      { step: "Interior Deep Clean", description: "Full vacuum, steam cleaning of all surfaces, leather cleaning and conditioning, dashboard and trim restoration, glass cleaning inside and out." },
      { step: "Protection", description: "Spray sealant on paint, tire dressing, trim protectant, and interior UV protectant applied to all surfaces." },
      { step: "Final Inspection", description: "Full walkthrough under proper lighting. Every surface checked, every detail perfected." },
    ],
    faqs: [
      { question: "How long does a full detail take?", answer: "A full interior and exterior detail typically takes 4-6 hours. Our most comprehensive packages can take a full day." },
      { question: "How often should I detail my car?", answer: "We recommend a full detail every 3-4 months, with maintenance washes in between. If you have ceramic coating, every 6 months is usually sufficient." },
      { question: "Do you offer mobile detailing?", answer: "Currently, all detailing is performed at our Orion Township facility where we have proper lighting, water filtration, and a controlled environment for the best results." },
      { question: "What's included in your packages?", answer: "We offer three tiers: Essential (exterior wash + interior vacuum), Premium (full interior/exterior detail), and Ultimate (includes engine bay, paint decontamination, and spray sealant)." },
    ],
    whyUs: ["Hand wash only — never automated", "pH-neutral, paint-safe products", "Filtered water system for spot-free rinse", "Climate-controlled detailing bay"],
    image: "/rpm-auto-lab/images/services/detailing.jpg",
  },
  "windshield-protection": {
    heroSubtitle: "Optically clear protection that prevents chips from becoming cracks",
    longDescription: "Michigan roads are brutal on windshields. Salt trucks, gravel, construction debris — one rock chip can turn into a full crack that costs $500+ to replace. Our windshield protection film is a thin, optically clear layer that absorbs the impact of road debris, dramatically reducing the chance of chips and cracks. It also adds a hydrophobic layer that sheds rain and improves visibility in bad weather.",
    process: [
      { step: "Windshield Inspection", description: "We inspect for existing chips or cracks. Small chips can be repaired before film installation; large cracks may require replacement first." },
      { step: "Deep Clean", description: "The windshield is meticulously cleaned and decontaminated. Any debris under the film would be permanently visible." },
      { step: "Film Application", description: "Precision-cut clear film applied with specialized solution. The film is optically clear — you won't even notice it's there." },
      { step: "Squeegee & Cure", description: "All air and moisture removed. The film bonds to the glass surface over 24-48 hours." },
    ],
    faqs: [
      { question: "Will the film affect visibility?", answer: "Not at all. Our windshield protection film is optically clear with 99%+ light transmission. It's virtually invisible once installed." },
      { question: "Does it work with wipers?", answer: "Yes — the hydrophobic surface actually improves wiper performance. Water beads up and sheets off more effectively." },
      { question: "How long does it last?", answer: "Windshield protection film typically lasts 2-3 years depending on driving conditions. It's easily replaceable when worn." },
      { question: "Does it affect my windshield sensors?", answer: "Our film is compatible with rain sensors, ADAS cameras, and heads-up displays. We carefully cut around sensor zones during installation." },
    ],
    whyUs: ["99%+ optical clarity", "Hydrophobic rain-repelling surface", "Compatible with ADAS and sensors", "Quick 1-2 hour installation"],
    image: "/rpm-auto-lab/images/services/windshield-protection.jpg",
  },
};

export const STATS = [
  { value: 1000, suffix: "+", label: "Vehicles Protected" },
  { value: 10, suffix: "+", label: "Years Experience" },
  { value: 99, suffix: "%", label: "Customer Satisfaction" },
  { value: 5, suffix: "★", label: "Google Rating" },
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/#configurator", label: "Configurator" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Get a Quote" },
] as const;
