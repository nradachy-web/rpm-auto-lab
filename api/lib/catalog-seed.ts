// Initial catalog seed mirroring the marketing-site SERVICES constant.
// Idempotent — skips packages that already exist (by slug). Categories are
// upserted by slug. Run via POST /api/admin/catalog/seed.

import { prisma } from "./db";
import type { VehicleSizeTier } from "@prisma/client";

interface SeedPackage {
  slug: string;
  name: string;
  shortDesc: string;
  basePrice: number;
  defaultDurationMinutes: number;
  pricing: { tier: VehicleSizeTier; price: number }[];
}

interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  packages: SeedPackage[];
}

const CATEGORIES: SeedCategory[] = [
  {
    slug: "protection",
    name: "Protection",
    description: "Long-term coatings and films that defend your paint and glass.",
    packages: [
      {
        slug: "ceramic-coating",
        name: "Ceramic Coating",
        shortDesc: "Long-lasting paint protection with a mirror-like finish",
        basePrice: 599,
        defaultDurationMinutes: 480,
        pricing: [
          { tier: "compact", price: 599 },
          { tier: "sedan", price: 749 },
          { tier: "suv", price: 999 },
          { tier: "truck", price: 1199 },
          { tier: "oversize", price: 1499 },
        ],
      },
      {
        slug: "paint-protection-film",
        name: "Paint Protection Film",
        shortDesc: "Invisible armor against rock chips, scratches and debris",
        basePrice: 799,
        defaultDurationMinutes: 1440,
        pricing: [
          { tier: "compact", price: 799 },
          { tier: "sedan", price: 999 },
          { tier: "suv", price: 1499 },
          { tier: "truck", price: 1899 },
          { tier: "oversize", price: 2499 },
        ],
      },
      {
        slug: "window-tint",
        name: "Window Tint",
        shortDesc: "Premium ceramic tint for style, privacy & UV rejection",
        basePrice: 249,
        defaultDurationMinutes: 180,
        pricing: [
          { tier: "compact", price: 249 },
          { tier: "sedan", price: 299 },
          { tier: "suv", price: 399 },
          { tier: "truck", price: 449 },
          { tier: "oversize", price: 549 },
        ],
      },
      {
        slug: "windshield-protection",
        name: "Windshield Protection",
        shortDesc: "Invisible film that guards against chips and cracks",
        basePrice: 299,
        defaultDurationMinutes: 90,
        pricing: [],
      },
    ],
  },
  {
    slug: "transformation",
    name: "Transformation",
    description: "Color changes, wraps, and full visual overhauls.",
    packages: [
      {
        slug: "vehicle-wraps",
        name: "Vehicle Wraps",
        shortDesc: "Full color transformations and custom designs",
        basePrice: 2499,
        defaultDurationMinutes: 2880,
        pricing: [
          { tier: "compact", price: 2499 },
          { tier: "sedan", price: 2999 },
          { tier: "suv", price: 3999 },
          { tier: "truck", price: 4499 },
          { tier: "oversize", price: 5499 },
        ],
      },
    ],
  },
  {
    slug: "restoration",
    name: "Restoration & Detail",
    description: "Bring tired surfaces back to better-than-new.",
    packages: [
      {
        slug: "paint-correction",
        name: "Paint Correction",
        shortDesc: "Eliminate swirls, scratches and oxidation",
        basePrice: 399,
        defaultDurationMinutes: 480,
        pricing: [
          { tier: "compact", price: 399 },
          { tier: "sedan", price: 499 },
          { tier: "suv", price: 699 },
          { tier: "truck", price: 799 },
          { tier: "oversize", price: 999 },
        ],
      },
      {
        slug: "detailing",
        name: "Detailing",
        shortDesc: "Meticulous interior and exterior restoration",
        basePrice: 149,
        defaultDurationMinutes: 240,
        pricing: [
          { tier: "compact", price: 149 },
          { tier: "sedan", price: 199 },
          { tier: "suv", price: 249 },
          { tier: "truck", price: 299 },
          { tier: "oversize", price: 349 },
        ],
      },
    ],
  },
];

export async function seedCatalog(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;
  let categorySort = 0;
  for (const cat of CATEGORIES) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      create: { slug: cat.slug, name: cat.name, description: cat.description, sortOrder: categorySort++ },
      update: { name: cat.name, description: cat.description, sortOrder: categorySort - 1 },
    });
    let packageSort = 0;
    for (const p of cat.packages) {
      const existing = await prisma.servicePackage.findUnique({ where: { slug: p.slug } });
      if (existing) {
        await prisma.servicePackage.update({
          where: { id: existing.id },
          data: {
            name: p.name,
            shortDesc: p.shortDesc,
            basePrice: p.basePrice,
            defaultDurationMinutes: p.defaultDurationMinutes,
            categoryId: category.id,
            sortOrder: packageSort++,
          },
        });
        updated++;
      } else {
        await prisma.servicePackage.create({
          data: {
            slug: p.slug,
            name: p.name,
            shortDesc: p.shortDesc,
            basePrice: p.basePrice,
            defaultDurationMinutes: p.defaultDurationMinutes,
            categoryId: category.id,
            sortOrder: packageSort++,
          },
        });
        created++;
      }
      const pkg = await prisma.servicePackage.findUnique({ where: { slug: p.slug } });
      if (pkg) {
        for (const tier of p.pricing) {
          await prisma.servicePricing.upsert({
            where: { packageId_sizeTier: { packageId: pkg.id, sizeTier: tier.tier } },
            create: { packageId: pkg.id, sizeTier: tier.tier, price: tier.price },
            update: { price: tier.price },
          });
        }
      }
    }
  }
  return { created, updated };
}
