/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRICING_CONFIG } from './config.js';

/**
 * Pricing Engine for SLA 3D Printing Cost Calculator
 * 
 * Base Cost = (Volume × Material Cost) + (Print Time × ₹20/hour)
 * Apply: Quality Multiplier, Complexity Multiplier
 * Add: Support Charges, Post-processing, Delivery multiplier, Shipping
 * Apply: Quantity multiplication, Bulk discount
 * Ensure: Minimum order value = ₹300, Add margin buffer of 40%
 */

export function calculatePrice(inputs) {
  const {
    volumeCm3,
    materialKey,
    qualityKey,
    structureKey,
    supportsKey,
    postProcessingKeys,
    quantity,
    deliveryKey,
    printTimeHours,
  } = inputs;

  const material = PRICING_CONFIG.materials[materialKey];
  const quality = PRICING_CONFIG.quality[qualityKey];
  const structure = PRICING_CONFIG.structure[structureKey];
  const supports = PRICING_CONFIG.supports[supportsKey];
  const delivery = PRICING_CONFIG.delivery[deliveryKey];

  // 1. Base Cost
  const materialCost = volumeCm3 * material.cost;
  const printingCost = printTimeHours * PRICING_CONFIG.machineRatePerHour;
  let baseCost = (materialCost + printingCost);

  // 2. Apply Multipliers
  baseCost *= quality.multiplier;
  baseCost *= structure.multiplier;

  // 3. Add Flat Charges
  let addOnsCost = supports.cost;
  postProcessingKeys.forEach(key => {
    addOnsCost += PRICING_CONFIG.postProcessing[key]?.cost || 0;
  });

  let totalBeforeQuantity = baseCost + addOnsCost;

  // 4. Apply Delivery Multiplier
  totalBeforeQuantity *= delivery.multiplier;

  // 5. Quantity Multiplication
  let totalWithQuantity = totalBeforeQuantity * quantity;

  // 6. Bulk Discount
  const discountRule = PRICING_CONFIG.discounts.find(d => quantity >= d.min && quantity <= d.max);
  const discountAmount = totalWithQuantity * (discountRule?.discount || 0);
  totalWithQuantity -= discountAmount;

  // 7. Add Shipping
  totalWithQuantity += PRICING_CONFIG.shippingCost;

  // 8. Apply Margin Buffer (40%)
  let finalPrice = totalWithQuantity * PRICING_CONFIG.marginBuffer;

  // 9. Minimum Order Value
  finalPrice = Math.max(finalPrice, PRICING_CONFIG.minOrderValue);

  // Breakdown for UI
  return {
    finalPrice: Math.round(finalPrice),
    breakdown: {
      materialCost: Math.round(materialCost * quality.multiplier * structure.multiplier * quantity * PRICING_CONFIG.marginBuffer),
      printingCost: Math.round(printingCost * quality.multiplier * structure.multiplier * quantity * PRICING_CONFIG.marginBuffer),
      addOns: Math.round(addOnsCost * quantity * PRICING_CONFIG.marginBuffer),
      shipping: PRICING_CONFIG.shippingCost,
      discount: Math.round(discountAmount * PRICING_CONFIG.marginBuffer),
      savingsHollow: structureKey === 'hollow' ? Math.round(baseCost * (1 - PRICING_CONFIG.structure.hollow.multiplier) * quantity * PRICING_CONFIG.marginBuffer) : 0,
    },
    stats: {
      volume: volumeCm3.toFixed(2),
      time: printTimeHours.toFixed(1),
    }
  };
}
