/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Configuration for SLA 3D Printing Cost Calculator
 * Business: The Artist Company
 */

export const PRICING_CONFIG = {
  // Material Costs (₹ per ml)
  materials: {
    standard: { name: "Standard Resin", cost: 10 },
    abs_like: { name: "ABS-like Resin", cost: 14 },
    tough: { name: "Tough Resin", cost: 16 },
    flexible: { name: "Flexible Resin", cost: 18 },
    transparent: { name: "Transparent Resin", cost: 20 },
    castable: { name: "Castable Resin", cost: 25 },
  },

  // Print Quality Multipliers
  quality: {
    draft: { name: "Draft (100 microns)", multiplier: 1.0 },
    standard: { name: "Standard (50 microns)", multiplier: 1.2, recommended: true },
    high: { name: "High Detail (25 microns)", multiplier: 1.5 },
  },

  // Structure Complexity Multipliers
  structure: {
    solid: { name: "Solid", multiplier: 1.0 },
    hollow: { name: "Hollow (Recommended)", multiplier: 0.8 },
  },

  // Support Charges
  supports: {
    auto: { name: "Auto Supports", cost: 0 },
    manual: { name: "Manual Supports", cost: 100 },
  },

  // Post Processing Add-ons (₹ flat)
  postProcessing: {
    cleaning: { name: "Cleaning & UV Cure", cost: 0 },
    sanding: { name: "Sanding", cost: 150 },
    polishing: { name: "Polishing", cost: 250 },
    painting: { name: "Painting", cost: 500 },
    transparent_finish: { name: "Transparent Finish", cost: 300 },
  },

  // Delivery Speed Multipliers
  delivery: {
    standard: { name: "Standard", multiplier: 1.0 },
    express: { name: "Express (48h)", multiplier: 1.3 },
    urgent: { name: "Urgent (24h)", multiplier: 1.6 },
  },

  // Global Constants
  machineRatePerHour: 20, // ₹ per hour
  shippingCost: 100, // ₹ flat
  minOrderValue: 300, // ₹
  marginBuffer: 1.4, // 40% margin

  // Bulk Discounts
  discounts: [
    { min: 1, max: 2, discount: 0 },
    { min: 3, max: 5, discount: 0.1 },
    { min: 6, max: Infinity, discount: 0.2 },
  ],

  // Heuristics for Estimation (if parsing fails or for time calculation)
  timeHeuristic: 0.5, // hours per 10cm³ (simplified for MVP)
  minWallThickness: 2.0, // mm
};
