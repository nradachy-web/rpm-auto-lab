"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface VehicleSelection {
  year: number;
  make: string;
  model: string;
  trim: string;
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

const FUEL_ECONOMY_BASE = "https://www.fueleconomy.gov/ws/rest/vehicle/menu";

// Helper to parse fueleconomy.gov menu response
function parseMenuItems(data: { menuItem?: { text: string; value: string } | { text: string; value: string }[] }): string[] {
  if (!data?.menuItem) return [];
  const items = Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
  return items.map((item) => item.text).sort((a, b) => a.localeCompare(b));
}

export default function VehicleSearch({ onChange, className }: VehicleSearchProps) {
  const [year, setYear] = useState<number | null>(null);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);

  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims, setLoadingTrims] = useState(false);

  // Fetch makes when year is selected (fueleconomy.gov — only real consumer brands)
  useEffect(() => {
    if (!year) {
      setMakes([]);
      setMake("");
      setModels([]);
      setModel("");
      setTrims([]);
      setTrim("");
      return;
    }

    let cancelled = false;
    setLoadingMakes(true);
    setMake("");
    setModel("");
    setTrim("");
    setModels([]);
    setTrims([]);

    fetch(`${FUEL_ECONOMY_BASE}/make?year=${year}`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMakes(parseMenuItems(data));
      })
      .catch(() => {
        if (!cancelled) setMakes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMakes(false);
      });

    return () => { cancelled = true; };
  }, [year]);

  // Fetch models when make is selected
  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      setModel("");
      setTrims([]);
      setTrim("");
      return;
    }

    let cancelled = false;
    setLoadingModels(true);
    setModel("");
    setTrim("");
    setTrims([]);

    fetch(`${FUEL_ECONOMY_BASE}/model?year=${year}&make=${encodeURIComponent(make)}`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setModels(parseMenuItems(data));
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });

    return () => { cancelled = true; };
  }, [year, make]);

  // Fetch trims (options) when model is selected
  useEffect(() => {
    if (!year || !make || !model) {
      setTrims([]);
      setTrim("");
      return;
    }

    let cancelled = false;
    setLoadingTrims(true);
    setTrim("");

    fetch(
      `${FUEL_ECONOMY_BASE}/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
      { headers: { Accept: "application/json" } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const items = parseMenuItems(data);
          setTrims(items);
          // If only one trim, auto-select it
          if (items.length === 1) {
            setTrim(items[0]);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setTrims([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTrims(false);
      });

    return () => { cancelled = true; };
  }, [year, make, model]);

  // Notify parent when vehicle is fully selected
  const handleChange = useCallback(
    (y: number | null, mk: string, md: string, tr: string) => {
      if (y && mk && md) {
        onChange({ year: y, make: mk, model: md, trim: tr });
      }
    },
    [onChange]
  );

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {/* Year */}
      <div>
        <label className="block text-sm font-medium text-rpm-silver mb-1.5">Year</label>
        <select
          value={year ?? ""}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
          className={selectClasses}
        >
          <option value="">Select Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Make */}
      <div>
        <label className="block text-sm font-medium text-rpm-silver mb-1.5">Make</label>
        <div className="relative">
          <select
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
              setTrim("");
            }}
            disabled={!year || loadingMakes}
            className={cn(selectClasses, (!year || loadingMakes) && "opacity-50 cursor-not-allowed")}
          >
            <option value="">{loadingMakes ? "Loading..." : "Select Make"}</option>
            {makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {loadingMakes && <div className={spinnerClasses} />}
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-rpm-silver mb-1.5">Model</label>
        <div className="relative">
          <select
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setTrim("");
            }}
            disabled={!make || loadingModels}
            className={cn(selectClasses, (!make || loadingModels) && "opacity-50 cursor-not-allowed")}
          >
            <option value="">{loadingModels ? "Loading..." : "Select Model"}</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {loadingModels && <div className={spinnerClasses} />}
        </div>
      </div>

      {/* Trim */}
      <div>
        <label className="block text-sm font-medium text-rpm-silver mb-1.5">Trim</label>
        <div className="relative">
          <select
            value={trim}
            onChange={(e) => {
              const v = e.target.value;
              setTrim(v);
              handleChange(year, make, model, v);
            }}
            disabled={!model || loadingTrims}
            className={cn(selectClasses, (!model || loadingTrims) && "opacity-50 cursor-not-allowed")}
          >
            <option value="">
              {loadingTrims ? "Loading..." : trims.length === 0 && model ? "No trims found" : "Select Trim"}
            </option>
            {trims.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {loadingTrims && <div className={spinnerClasses} />}
        </div>
      </div>
    </div>
  );
}
