"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SERVICES, SERVICE_TIERS, HIDE_PRICE_SERVICES } from "@/lib/constants";
import VehicleSearch from "./VehicleSearch";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  sendWelcomeQuote,
  sendAdminQuoteAlert,
  CUSTOMER_PORTAL_URL,
  SHOP_INBOX,
} from "@/lib/email-client";

interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  trim: string;
  color: string;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const STEPS = ["Vehicle", "Services", "Contact", "Review"];

const inputClasses =
  "w-full rounded-lg bg-rpm-charcoal border border-rpm-gray px-4 py-3 text-rpm-white placeholder:text-rpm-silver focus:border-rpm-red focus:ring-2 focus:ring-rpm-red/20 focus:outline-none transition-all duration-200";

const MOST_POPULAR_SERVICE = "ceramic-coating";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export default function QuoteForm() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [vehicle, setVehicle] = useState<VehicleInfo>({
    year: 0,
    make: "",
    model: "",
    trim: "",
    color: "",
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  // serviceId -> tier id for services that have tier choices
  const [serviceTiers, setServiceTiers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<ContactInfo>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estimated total excludes services we don't disclose pricing for (PPF).
  const estimatedTotal = selectedServices.reduce((sum, id) => {
    if (HIDE_PRICE_SERVICES.has(id)) return sum;
    const service = SERVICES.find((s) => s.id === id);
    return sum + (service?.startingPrice ?? 0);
  }, 0);

  const handleVehicleChange = useCallback(
    (v: { year: number; make: string; model: string; trim?: string }) => {
      setVehicle((prev) => ({ ...prev, ...v, trim: v.trim || prev.trim }));
    },
    []
  );

  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const adding = !prev.includes(id);
      // Default-pick the most popular tier so someone can hit Continue without
      // touching the radios. Cleared when the service itself is unchecked.
      if (adding && SERVICE_TIERS[id] && !serviceTiers[id]) {
        const popular = SERVICE_TIERS[id][1] ?? SERVICE_TIERS[id][0];
        setServiceTiers((t) => ({ ...t, [id]: popular.id }));
      }
      if (!adding) {
        setServiceTiers((t) => {
          const { [id]: _drop, ...rest } = t;
          return rest;
        });
      }
      return adding ? [...prev, id] : prev.filter((s) => s !== id);
    });
  };

  const setTier = (serviceId: string, tierId: string) => {
    setServiceTiers((t) => ({ ...t, [serviceId]: tierId }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!vehicle.year || !vehicle.make || !vehicle.model) {
        newErrors.vehicle = "Please select your vehicle year, make, and model";
      }
    }

    if (step === 1) {
      if (selectedServices.length === 0) {
        newErrors.services = "Please select at least one service";
      } else {
        const missingTier = selectedServices.find(
          (id) => SERVICE_TIERS[id] && !serviceTiers[id]
        );
        if (missingTier) {
          const svc = SERVICES.find((s) => s.id === missingTier);
          newErrors.services = `Pick an option for ${svc?.name ?? "your service"}`;
        }
      }
    }

    if (step === 2) {
      if (!contact.name.trim()) newErrors.name = "Name is required";
      if (!contact.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!contact.phone.trim()) {
        newErrors.phone = "Phone number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);

  // Capture UTM + referrer at mount so we know where the lead came from.
  const utm = (() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"];
    const out: Record<string, string> = {};
    for (const k of keys) {
      const v = params.get(k);
      if (v) out[k] = v;
    }
    if (document.referrer) out["referrer"] = document.referrer;
    return Object.keys(out).length > 0 ? out : null;
  })();

  const inferredSource = (() => {
    if (!utm) return "web";
    if (utm["utm_source"]) return utm["utm_source"];
    if (utm["ref"]) return "referral";
    if (utm["referrer"]) {
      try {
        const host = new URL(utm["referrer"]).hostname;
        if (host.includes("instagram")) return "instagram";
        if (host.includes("facebook")) return "facebook";
        if (host.includes("google")) return "google";
        return host;
      } catch {}
    }
    return "web";
  })();

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const payload = {
      vehicle: {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim || undefined,
        color: vehicle.color || undefined,
      },
      services: selectedServices,
      tiers: serviceTiers,
      contact: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        notes: contact.notes || undefined,
      },
      estimatedTotal,
      source: inferredSource,
      utmJson: utm,
    };
    const res = await api.post<{
      ok: boolean;
      quoteId: string;
      accountCreated: boolean;
      setPasswordUrl?: string | null;
    }>("/api/quotes/submit", payload);
    if (!res.ok || !res.data?.ok) {
      setSubmitError(res.error || "We couldn't submit your quote. Please try again or call us directly.");
      setSubmitting(false);
      return;
    }
    setAccountCreated(Boolean(res.data.accountCreated));

    // Fire transactional emails from the browser. Web3Forms blocks server-side
    // sends on the free plan, so all mail originates here.
    const vehicleStr = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
      .filter(Boolean)
      .join(" ");
    const serviceLines = selectedServices.map((id) => {
      const svc = SERVICES.find((s) => s.id === id);
      const tierId = serviceTiers[id];
      const tier = tierId
        ? SERVICE_TIERS[id]?.find((t) => t.id === tierId)
        : null;
      return tier ? `${svc?.name} — ${tier.name}` : svc?.name ?? id;
    });
    const quoteSummary = `${vehicleStr}\nServices:\n  - ${serviceLines.join("\n  - ")}\nEstimated: $${estimatedTotal.toLocaleString()}+`;

    const welcome = sendWelcomeQuote({
      to: contact.email,
      name: contact.name,
      setPasswordUrl: res.data.setPasswordUrl ?? null,
      quoteSummary,
      portalUrl: CUSTOMER_PORTAL_URL,
    }).catch((e) => console.error("[email] customer welcome failed:", e));

    const alert = sendAdminQuoteAlert({
      to: SHOP_INBOX,
      customerName: contact.name,
      customerEmail: contact.email,
      customerPhone: contact.phone,
      vehicle: vehicleStr,
      services: selectedServices,
      estimatedTotal,
      notes: contact.notes || undefined,
    }).catch((e) => console.error("[email] admin alert failed:", e));

    await Promise.allSettled([welcome, alert]);

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rpm-red/10 border border-rpm-red/30"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="h-10 w-10 text-rpm-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </motion.div>
        <h3 className="text-2xl font-bold text-rpm-white mb-2">
          Quote Request Submitted!
        </h3>
        <p className="text-rpm-silver text-lg">
          We&apos;ll be in touch within 24 hours with your custom quote.
        </p>
        <p className="text-rpm-silver mt-4 text-sm">
          {vehicle.year} {vehicle.make} {vehicle.model} &mdash;{" "}
          {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} selected
        </p>
        {accountCreated && (
          <p className="text-rpm-silver/80 mt-6 text-sm max-w-md mx-auto leading-relaxed">
            We&apos;ve also emailed you a link to set up your customer portal account.
            Check <span className="text-rpm-white font-medium">{contact.email}</span> (and spam/promotions) &mdash; the link expires in 48 hours.
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => {
                if (i < step) {
                  setDirection(-1);
                  setStep(i);
                }
              }}
              className={cn(
                "text-xs font-semibold uppercase tracking-wider transition-colors",
                i <= step ? "text-rpm-red" : "text-rpm-silver/50",
                i < step && "cursor-pointer hover:text-rpm-red-glow"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="h-1 rounded-full bg-rpm-gray overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-rpm-red to-rpm-orange rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Estimated total (visible when services selected) */}
      {selectedServices.length > 0 && step >= 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between rounded-lg bg-rpm-red/5 border border-rpm-red/20 px-4 py-3"
        >
          <span className="text-sm text-rpm-silver">Estimated Starting At</span>
          <span className="text-xl font-bold text-rpm-red">
            ${estimatedTotal.toLocaleString()}+
          </span>
        </motion.div>
      )}

      {/* Step content */}
      <div className="relative overflow-hidden min-h-[320px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 0 && (
              <StepVehicle
                vehicle={vehicle}
                setVehicle={setVehicle}
                onVehicleSearch={handleVehicleChange}
                errors={errors}
              />
            )}
            {step === 1 && (
              <StepServices
                selected={selectedServices}
                toggle={toggleService}
                tiers={serviceTiers}
                setTier={setTier}
                errors={errors}
              />
            )}
            {step === 2 && (
              <StepContact
                contact={contact}
                setContact={setContact}
                errors={errors}
              />
            )}
            {step === 3 && (
              <StepReview
                vehicle={vehicle}
                services={selectedServices}
                tiers={serviceTiers}
                contact={contact}
                total={estimatedTotal}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {submitError && (
        <p className="mt-4 rounded-lg bg-rpm-red/10 border border-rpm-red/30 px-4 py-3 text-sm text-rpm-red">
          {submitError}
        </p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex gap-4 justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={prevStep}>
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <Button onClick={nextStep}>Continue</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </span>
            ) : (
              "Submit Quote Request"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Step Components ─── */

function StepVehicle({
  vehicle,
  setVehicle,
  onVehicleSearch,
  errors,
}: {
  vehicle: VehicleInfo;
  setVehicle: React.Dispatch<React.SetStateAction<VehicleInfo>>;
  onVehicleSearch: (v: { year: number; make: string; model: string }) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-rpm-white mb-1">
          Tell us about your vehicle
        </h3>
        <p className="text-sm text-rpm-silver">
          Select your vehicle to get an accurate estimate
        </p>
      </div>

      <VehicleSearch onChange={onVehicleSearch} />
      {errors.vehicle && (
        <p className="text-sm text-rpm-red mt-1">{errors.vehicle}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-rpm-silver mb-1.5">
          Vehicle Color <span className="text-rpm-silver/50">(optional)</span>
        </label>
        <input
          type="text"
          value={vehicle.color}
          onChange={(e) =>
            setVehicle((v) => ({ ...v, color: e.target.value }))
          }
          placeholder="e.g. Black, Pearl White, Midnight Blue"
          className={inputClasses}
        />
      </div>
    </div>
  );
}

function StepServices({
  selected,
  toggle,
  tiers,
  setTier,
  errors,
}: {
  selected: string[];
  toggle: (id: string) => void;
  tiers: Record<string, string>;
  setTier: (serviceId: string, tierId: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-rpm-white mb-1">
          What services are you interested in?
        </h3>
        <p className="text-sm text-rpm-silver">
          Select all that apply. We&apos;ll bundle pricing for you.
        </p>
      </div>

      {errors.services && (
        <p className="text-sm text-rpm-red">{errors.services}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map((service) => {
          const isSelected = selected.includes(service.id);
          const isPopular = service.id === MOST_POPULAR_SERVICE;
          const hidePrice = HIDE_PRICE_SERVICES.has(service.id);
          const serviceTiers = SERVICE_TIERS[service.id];
          const hasTiers = Boolean(serviceTiers && serviceTiers.length > 0);
          const selectedTierId = tiers[service.id];

          return (
            <div
              key={service.id}
              className={cn(
                "relative rounded-lg border transition-all duration-200",
                isSelected
                  ? "bg-rpm-red/10 border-rpm-red"
                  : "bg-rpm-charcoal border-rpm-gray hover:border-rpm-silver/50",
                isSelected && hasTiers && "sm:col-span-2"
              )}
            >
              {isPopular && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rpm-red text-white rounded-full">
                  Most Popular
                </span>
              )}

              {/* Selection header */}
              <button
                type="button"
                onClick={() => toggle(service.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all",
                        isSelected
                          ? "bg-rpm-red border-rpm-red"
                          : "border-rpm-silver/40"
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={cn(
                        "font-medium truncate",
                        isSelected ? "text-rpm-white" : "text-rpm-silver"
                      )}
                    >
                      {service.name}
                    </span>
                  </div>
                  {!hidePrice && (
                    <span
                      className={cn(
                        "text-sm font-semibold flex-shrink-0",
                        isSelected ? "text-rpm-red" : "text-rpm-silver"
                      )}
                    >
                      From ${service.startingPrice}
                    </span>
                  )}
                </div>
                <p className="mt-1 ml-8 text-xs text-rpm-silver/70">
                  {service.shortDesc}
                </p>
              </button>

              {/* Tier picker (slides open when service is checked) */}
              <AnimatePresence initial={false}>
                {isSelected && hasTiers && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-rpm-red/20 px-4 pt-3 pb-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rpm-silver mb-2">
                        Choose your option
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {serviceTiers!.map((tier) => {
                          const tierSelected = selectedTierId === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => setTier(service.id, tier.id)}
                              className={cn(
                                "text-left rounded-md border px-3 py-2.5 transition-all duration-150 flex items-start gap-3",
                                tierSelected
                                  ? "bg-rpm-red/15 border-rpm-red"
                                  : "bg-rpm-dark/50 border-rpm-gray/60 hover:border-rpm-silver/60"
                              )}
                            >
                              <div
                                className={cn(
                                  "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all",
                                  tierSelected
                                    ? "border-rpm-red"
                                    : "border-rpm-silver/40"
                                )}
                              >
                                {tierSelected && (
                                  <span className="block h-2 w-2 rounded-full bg-rpm-red" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span
                                  className={cn(
                                    "block text-sm font-semibold",
                                    tierSelected ? "text-rpm-white" : "text-rpm-silver"
                                  )}
                                >
                                  {tier.name}
                                </span>
                                {tier.description && (
                                  <span className="block text-[11px] text-rpm-silver/70 leading-snug mt-0.5">
                                    {tier.description}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepContact({
  contact,
  setContact,
  errors,
}: {
  contact: ContactInfo;
  setContact: React.Dispatch<React.SetStateAction<ContactInfo>>;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-rpm-white mb-1">
          How can we reach you?
        </h3>
        <p className="text-sm text-rpm-silver">
          We&apos;ll send your custom quote directly to your inbox
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-rpm-silver mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            value={contact.name}
            onChange={(e) =>
              setContact((c) => ({ ...c, name: e.target.value }))
            }
            placeholder="John Smith"
            className={cn(inputClasses, errors.name && "border-rpm-red")}
          />
          {errors.name && (
            <p className="text-xs text-rpm-red mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-rpm-silver mb-1.5">
            Email Address *
          </label>
          <input
            type="email"
            value={contact.email}
            onChange={(e) =>
              setContact((c) => ({ ...c, email: e.target.value }))
            }
            placeholder="john@example.com"
            className={cn(inputClasses, errors.email && "border-rpm-red")}
          />
          {errors.email && (
            <p className="text-xs text-rpm-red mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-rpm-silver mb-1.5">
            Phone Number *
          </label>
          <input
            type="tel"
            value={contact.phone}
            onChange={(e) =>
              setContact((c) => ({ ...c, phone: e.target.value }))
            }
            placeholder="(248) 555-0199"
            className={cn(inputClasses, errors.phone && "border-rpm-red")}
          />
          {errors.phone && (
            <p className="text-xs text-rpm-red mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-rpm-silver mb-1.5">
            Additional Notes{" "}
            <span className="text-rpm-silver/50">(optional)</span>
          </label>
          <textarea
            value={contact.notes}
            onChange={(e) =>
              setContact((c) => ({ ...c, notes: e.target.value }))
            }
            placeholder="Tell us about any specific areas of concern, your timeline, or any questions you have..."
            rows={4}
            className={cn(inputClasses, "resize-none")}
          />
        </div>
      </div>
    </div>
  );
}

function StepReview({
  vehicle,
  services,
  tiers,
  contact,
  total,
}: {
  vehicle: VehicleInfo;
  services: string[];
  tiers: Record<string, string>;
  contact: ContactInfo;
  total: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-rpm-white mb-1">
          Review your quote request
        </h3>
        <p className="text-sm text-rpm-silver">
          Double-check everything looks good before submitting
        </p>
      </div>

      {/* Vehicle */}
      <div className="rounded-lg bg-rpm-charcoal border border-rpm-gray p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-rpm-silver mb-2">
          Vehicle
        </h4>
        <p className="text-rpm-white font-medium">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim && ` ${vehicle.trim}`}
        </p>
        {vehicle.color && (
          <p className="text-sm text-rpm-silver">Color: {vehicle.color}</p>
        )}
      </div>

      {/* Services */}
      <div className="rounded-lg bg-rpm-charcoal border border-rpm-gray p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-rpm-silver mb-2">
          Services
        </h4>
        <ul className="space-y-2">
          {services.map((id) => {
            const service = SERVICES.find((s) => s.id === id);
            if (!service) return null;
            const tierId = tiers[id];
            const tier = tierId
              ? SERVICE_TIERS[id]?.find((t) => t.id === tierId)
              : null;
            const hidePrice = HIDE_PRICE_SERVICES.has(id);
            return (
              <li
                key={id}
                className="flex items-center justify-between text-sm gap-3"
              >
                <span className="text-rpm-white min-w-0">
                  {service.name}
                  {tier && (
                    <span className="text-rpm-silver"> - {tier.name}</span>
                  )}
                </span>
                <span className="text-rpm-silver flex-shrink-0">
                  {hidePrice ? "Custom Quote" : `From $${service.startingPrice}`}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 pt-3 border-t border-rpm-gray flex items-center justify-between">
          <span className="font-semibold text-rpm-white">Estimated Total</span>
          <span className="text-lg font-bold text-rpm-red">
            ${total.toLocaleString()}+
          </span>
        </div>
        {services.some((id) => HIDE_PRICE_SERVICES.has(id)) && (
          <p className="mt-2 text-[11px] text-rpm-silver/70 leading-relaxed">
            Estimate excludes paint protection film. We&apos;ll send a custom PPF
            quote based on your vehicle and selected coverage.
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="rounded-lg bg-rpm-charcoal border border-rpm-gray p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-rpm-silver mb-2">
          Contact
        </h4>
        <div className="space-y-1 text-sm">
          <p className="text-rpm-white">{contact.name}</p>
          <p className="text-rpm-silver">{contact.email}</p>
          <p className="text-rpm-silver">{contact.phone}</p>
          {contact.notes && (
            <p className="text-rpm-silver/70 mt-2 italic">
              &quot;{contact.notes}&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
