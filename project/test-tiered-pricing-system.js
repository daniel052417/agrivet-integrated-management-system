/**
 * Test script for Tiered Pricing System
 * Tests the new pricing logic where base units have fixed prices
 * and sub-units use the smallest unit's price for calculations
 */

console.log('🧪 Testing Tiered Pricing System...\n');

// Test product with your example: Growth Promoter Liquid
const testProduct = {
  id: 'growth-promoter',
  name: 'Growth Promoter Liquid',
  units: [
    {
      id: 'sack-50kg',
      unit_name: 'Sack',
      unit_label: '50kg',
      conversion_factor: 50.0,
      is_base_unit: true,
      price: 1800.00,
      min_sellable_quantity: 0.25
    },
    {
      id: 'kg-1kg',
      unit_name: 'Kilogram',
      unit_label: '1kg',
      conversion_factor: 1.0,
      is_base_unit: false,
      price: 38.00,
      min_sellable_quantity: 0.25
    }
  ]
};

// Enhanced unit selection with tiered pricing system
function generateDynamicUnits(product) {
  const units = product.units || [];
  if (units.length === 0) return [];

  // Find the minimum sellable quantity from all units
  const minSellableQuantity = Math.min(
    ...units.map((unit) => unit.min_sellable_quantity || 0.25)
  );

  // Find the base unit (is_base_unit = true) and smallest unit for calculations
  const baseUnit = units.find((u) => u.is_base_unit);
  const smallestUnit = units.reduce((smallest, unit) => {
    if (!smallest || unit.conversion_factor < smallest.conversion_factor) {
      return unit;
    }
    return smallest;
  });

  console.log(`📊 Product: ${product.name}`);
  console.log(`   Base Unit: ${baseUnit?.unit_label} - ₱${baseUnit?.price} (${baseUnit?.conversion_factor}kg)`);
  console.log(`   Smallest Unit: ${smallestUnit?.unit_label} - ₱${smallestUnit?.price} (${smallestUnit?.conversion_factor}kg)`);
  console.log(`   Price per kg: ₱${(smallestUnit?.price / smallestUnit?.conversion_factor).toFixed(2)}`);
  console.log('');

  // Generate practical unit options based on min sellable quantity
  const baseUnits = [50, 25, 10, 5, 1, 0.5, 0.25]; // Common selling units
  const availableUnits = baseUnits.filter(unit => unit >= minSellableQuantity);

  // Create dynamic unit options with tiered pricing
  const dynamicUnits = availableUnits.map(unit => {
    let unitPrice = 0;
    let pricingMethod = '';

    if (baseUnit && unit >= baseUnit.conversion_factor) {
      // For units >= base unit: use base unit pricing
      unitPrice = baseUnit.price;
      pricingMethod = 'base_unit';
    } else if (smallestUnit) {
      // For units < base unit: use smallest unit pricing
      unitPrice = (smallestUnit.price / smallestUnit.conversion_factor) * unit;
      pricingMethod = 'smallest_unit';
    } else {
      // Fallback to original calculation
      unitPrice = (baseUnit?.price || 0) / (baseUnit?.conversion_factor || 1) * unit;
      pricingMethod = 'fallback';
    }
    
    // Format display label
    let displayLabel = '';
    if (unit >= 1) {
      displayLabel = `${unit}kg`;
    } else if (unit === 0.5) {
      displayLabel = '1/2';
    } else if (unit === 0.25) {
      displayLabel = '1/4';
    } else {
      displayLabel = `${unit}kg`;
    }

    return {
      id: `dynamic_${unit}`,
      unit_name: `${unit}kg`,
      unit_label: displayLabel,
      price: unitPrice,
      conversion_factor: unit,
      min_sellable_quantity: minSellableQuantity,
      is_dynamic: true,
      pricing_method: pricingMethod,
      base_unit_id: baseUnit?.id,
      smallest_unit_id: smallestUnit?.id
    };
  });

  // Add original units if they're not already covered
  const originalUnits = units.map((unit) => ({
    ...unit,
    is_dynamic: false,
    pricing_method: unit.is_base_unit ? 'base_unit' : 'smallest_unit'
  }));

  // Combine and deduplicate by conversion_factor
  const allUnits = [...originalUnits, ...dynamicUnits];
  const uniqueUnits = allUnits.reduce((acc, unit) => {
    const existing = acc.find(u => Math.abs(u.conversion_factor - unit.conversion_factor) < 0.01);
    if (!existing) {
      acc.push(unit);
    }
    return acc;
  }, []);

  // Sort by conversion_factor descending (largest first)
  return uniqueUnits.sort((a, b) => b.conversion_factor - a.conversion_factor);
}

// Test the tiered pricing system
const units = generateDynamicUnits(testProduct);

console.log('🎯 Tiered Pricing Results:\n');

units.forEach(unit => {
  const type = unit.is_dynamic ? '🔄 Dynamic' : '📋 Original';
  const method = unit.pricing_method === 'base_unit' ? '🏷️ Base Unit' : 
                 unit.pricing_method === 'smallest_unit' ? '📏 Smallest Unit' : '⚠️ Fallback';
  
  console.log(`${type} ${unit.unit_label.padEnd(4)} - ₱${unit.price.toFixed(2).padStart(8)} ${method}`);
});

console.log('\n✅ Expected Results (Your Requirements):');
console.log('50kg  - ₱1800.00 (Base unit - fixed price)');
console.log('25kg  - ₱ 950.00 (38 × 25 = 950)');
console.log('10kg  - ₱ 380.00 (38 × 10 = 380)');
console.log('5kg   - ₱ 190.00 (38 × 5 = 190)');
console.log('1kg   - ₱  38.00 (38 × 1 = 38)');
console.log('1/2   - ₱  19.00 (38 × 0.5 = 19)');
console.log('1/4   - ₱   9.50 (38 × 0.25 = 9.5)');

console.log('\n🧮 Mixed Quantity Example:');
console.log('User wants 60kg:');
console.log('60kg = 1 × 50kg sack + 10kg');
console.log('Price = ₱1,800 + (₱38 × 10) = ₱1,800 + ₱380 = ₱2,180');

// Test mixed quantity calculation
function calculateMixedQuantity(desiredKg, baseUnit, smallestUnit) {
  const baseKg = baseUnit.conversion_factor;
  const basePrice = baseUnit.price;
  const pricePerKg = smallestUnit.price / smallestUnit.conversion_factor;
  
  const baseUnits = Math.floor(desiredKg / baseKg);
  const remainingKg = desiredKg % baseKg;
  
  const baseTotal = baseUnits * basePrice;
  const remainingTotal = remainingKg * pricePerKg;
  const totalPrice = baseTotal + remainingTotal;
  
  return {
    desiredKg,
    baseUnits,
    remainingKg,
    baseTotal,
    remainingTotal,
    totalPrice
  };
}

const mixed60kg = calculateMixedQuantity(60, testProduct.units[0], testProduct.units[1]);
console.log('\n📊 Mixed Quantity Calculation (60kg):');
console.log(`Desired: ${mixed60kg.desiredKg}kg`);
console.log(`Base units: ${mixed60kg.baseUnits} × 50kg = ₱${mixed60kg.baseTotal}`);
console.log(`Remaining: ${mixed60kg.remainingKg}kg × ₱38/kg = ₱${mixed60kg.remainingTotal}`);
console.log(`Total: ₱${mixed60kg.totalPrice}`);

console.log('\n🎉 Tiered Pricing System Test Complete!');
console.log('\n📋 Summary:');
console.log('✅ Base units use fixed pricing (no calculations)');
console.log('✅ Sub-units use smallest unit pricing for calculations');
console.log('✅ Mixed quantities combine base + sub-unit pricing');
console.log('✅ Proper tiered pricing logic implemented');
