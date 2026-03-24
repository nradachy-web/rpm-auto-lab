"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface VehicleSelection {
  year: number;
  make: string;
  model: string;
}

interface VehicleSearchProps {
  onChange: (vehicle: VehicleSelection) => void;
  className?: string;
}

const CURRENT_YEAR = 2026;
const START_YEAR = 2000;
const years = Array.from(
  { length: CURRENT_YEAR - START_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i
);

const selectClasses =
  "w-full appearance-none rounded-lg bg-rpm-charcoal border border-rpm-gray px-4 py-3 text-rpm-white placeholder:text-rpm-silver focus:border-rpm-red focus:ring-2 focus:ring-rpm-red/20 focus:outline-none transition-all duration-200 cursor-pointer";

const spinnerClasses =
  "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-rpm-silver border-t-rpm-red";

// Only show mainstream consumer brands customers would actually have
const MAJOR_MAKES = new Set([
  "ACURA", "ALFA ROMEO", "ASTON MARTIN", "AUDI", "BENTLEY", "BMW", "BUICK",
  "CADILLAC", "CHEVROLET", "CHRYSLER", "DODGE", "FERRARI", "FIAT", "FORD",
  "GENESIS", "GMC", "HONDA", "HYUNDAI", "INFINITI", "JAGUAR", "JEEP", "KIA",
  "LAMBORGHINI", "LAND ROVER", "LEXUS", "LINCOLN", "LUCID", "MASERATI",
  "MAZDA", "MCLAREN", "MERCEDES-BENZ", "MINI", "MITSUBISHI", "NISSAN",
  "POLESTAR", "PORSCHE", "RAM", "RIVIAN", "ROLLS-ROYCE", "SUBARU", "TESLA",
  "TOYOTA", "VOLKSWAGEN", "VOLVO",
]);

export default function VehicleSearch({ onChange, className }: VehicleSearchProps) {
  const [year, setYear] = useState<number | null>(null);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Fetch makes when year is selected
  useEffect(() => {
    if (!year) {
      setMakes([]);
      setMake("");
      setModels([]);
      setModel("");
      return;
    }

    let cancelled = false;
    setLoadingMakes(true);
    setMake("");
    setModel("");
    setModels([]);

    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const sorted = (data.Results || [])
            .map((r: { MakeName: string }) => r.MakeName)
            .filter((name: string) => MAJOR_MAKES.has(name.toUpperCase()))
            .sort((a: string, b: string) => a.localeCompare(b));
          setMakes(sorted);
        }
      })
      .catch(() => {
        if (!cancelled) setMakes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMakes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  // Fetch models when make is selected
  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      setModel("");
      return;
    }

    let cancelled = false;
    setLoadingModels(true);
    setModel("");

    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const sorted = (data.Results || [])
            .map((r: { Model_Name: string }) => r.Model_Name)
            .sort((a: string, b: string) => a.localeCompare(b));
          setModels(sorted);
        }
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year, make]);

  // Notify parent when all three are selected
  const handleChange = useCallback(
    (newYear: number | null, newMake: string, newModel: string) => {
      if (newYear && newMake && newModel) {
        onChange({ year: newYear, make: newMake, model: newModel });
      }
    },
    [onChange]
  );

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4", className)}>
      {/* Year */}
      <div className="relative">
        <label className="block text-sm font-medium text-rpm-silver mb-1.5">
          Year
        </label>
        <select
          value={year ?? ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            setYear(v);
          }}
          className={selectClasses}
        >
          <option value="">Select Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Make */}
      <div className="relative">
        <label className="block text-sm font-medium text-rpm-silver mb-1.5">
          Make
        </label>
        <div className="relative">
          <select
            value={make}
            onChange={(e) => {
              const v = e.target.value;
              setMake(v);
              setModel("");
              handleChange(year, v, "");
            }}
            disabled={!year || loadingMakes}
            className={cn(
              selectClasses,
              (!year || loadingMakes) && "opacity-50 cursor-not-allowed"
            )}
          >
            <option value="">
              {loadingMakes ? "Loading..." : "Select Make"}
            </option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {loadingMakes && <div className={spinnerClasses} />}
        </div>
      </div>

      {/* Model */}
      <div className="relative">
        <label className="block text-sm font-medium text-rpm-silver mb-1.5">
          Model
        </label>
        <div className="relative">
          <select
            value={model}
            onChange={(e) => {
              const v = e.target.value;
              setModel(v);
              handleChange(year, make, v);
            }}
            disabled={!make || loadingModels}
            className={cn(
              selectClasses,
              (!make || loadingModels) && "opacity-50 cursor-not-allowed"
            )}
          >
            <option value="">
              {loadingModels ? "Loading..." : "Select Model"}
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {loadingModels && <div className={spinnerClasses} />}
        </div>
      </div>
    </div>
  );
}
