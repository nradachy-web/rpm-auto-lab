"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SERVICES } from "@/lib/constants";
import VehicleSearch from "./VehicleSearch";
import Button from "@/components/ui/Button";

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
  const [contact, setContact] = useState<ContactInfo>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const estimatedTotal = selectedServices.reduce((sum, id) => {
    const service = SERVICES.find((s) => s.id === id);
    return sum + (service?.startingPrice ?? 0);
  }, 0);

  const handleVehicleChange = useCallback(
    (v: { year: number; make: string; model: string }) => {
      setVehicle((prev) => ({ ...prev, ...v }));
    },
    []
  );

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        vehicle: {
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim || undefined,
          color: vehicle.color || undefined,
        },
        services: selectedServices,
        contact: {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          notes: contact.notes || undefined,
        },
        estimatedTotal,
      };

      console.log("Submitting quote:", payload);

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Failed to submit quote:", err);
    } finally {
      setSubmitting(false);
    }
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
                contact={contact}
                total={estimatedTotal}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-rpm-silver mb-1.5">
            Trim <span className="text-rpm-silver/50">(optional)</span>
          </label>
          <input
            type="text"
            value={vehicle.trim}
            onChange={(e) =>
              setVehicle((v) => ({ ...v, trim: e.target.value }))
            }
            placeholder="e.g. Sport, Limited"
            className={inputClasses}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-rpm-silver mb-1.5">
            Color <span className="text-rpm-silver/50">(optional)</span>
          </label>
          <input
            type="text"
            value={vehicle.color}
            onChange={(e) =>
              setVehicle((v) => ({ ...v, color: e.target.value }))
            }
            placeholder="e.g. Black, Pearl White"
            className={inputClasses}
          />
        </div>
      </div>
    </div>
  );
}

function StepServices({
  selected,
  toggle,
  errors,
}: {
  selected: string[];
  toggle: (id: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-rpm-white mb-1">
          What services are you interested in?
        </h3>
        <p className="text-sm text-rpm-silver">
          Select all that apply — we&apos;ll bundle pricing for you
        </p>
      </div>

      {errors.services && (
        <p className="text-sm text-rpm-red">{errors.services}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map((service) => {
          const isSelected = selected.includes(service.id);
          const isPopular = service.id === MOST_POPULAR_SERVICE;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggle(service.id)}
              className={cn(
                "relative text-left rounded-lg border p-4 transition-all duration-200",
                isSelected
                  ? "bg-rpm-red/10 border-rpm-red text-rpm-white"
                  : "bg-rpm-charcoal border-rpm-gray text-rpm-silver hover:border-rpm-silver/50"
              )}
            >
              {isPopular && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rpm-red text-white rounded-full">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border transition-all",
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
                  <span className="font-medium">{service.name}</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isSelected ? "text-rpm-red" : "text-rpm-silver"
                  )}
                >
                  From ${service.startingPrice}
                </span>
              </div>
              <p className="mt-1 ml-8 text-xs text-rpm-silver/70">
                {service.shortDesc}
              </p>
            </button>
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
  contact,
  total,
}: {
  vehicle: VehicleInfo;
  services: string[];
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
            return (
              <li
                key={id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-rpm-white">{service.name}</span>
                <span className="text-rpm-silver">
                  From ${service.startingPrice}
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
