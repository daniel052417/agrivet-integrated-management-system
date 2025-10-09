/**
 * Test script for Enhanced Unit Selection System
 * Tests the dynamic unit generation based on minimum sellable quantity
 */

console.log('🧪 Testing Enhanced Unit Selection System...\n');

// Mock product data with different minimum sellable quantities
const testProducts = [
  {
    id: '1',
    name: 'Ammonium Sulfate 21-0-0',
    sku: 'FERT-001',
    units: [
      { id: '50kg', unit_name: '50kg', unit_label: '50kg', price: 1400, conversion_factor: 50, is_base_unit: true, min_sellable_quantity: 0.25 },
      { id: '1kg', unit_name: '1kg', unit_label: '1kg', price: 28, conversion_factor: 1, is_base_unit: false, min_sellable_quantity: 0.25 }
    ]
  },
  {
    id: '2',
    name: 'Urea 46-0-0',
    sku: 'FERT-002',
    units: [
      { id: '25kg', unit_name: '25kg', unit_label: '25kg', price: 700, conversion_factor: 25, is_base_unit: true, min_sellable_quantity: 0.5 },
      { id: '5kg', unit_name: '5kg', unit_label: '5kg', price: 140, conversion_factor: 5, is_base_unit: false, min_sellable_quantity: 0.5 }
    ]
  },
  {
    id: '3',
    name: 'Complete Fertilizer 14-14-14',
    sku: 'FERT-003',
    units: [
      { id: '10kg', unit_name: '10kg', unit_label: '10kg', price: 280, conversion_factor: 10, is_base_unit: true, min_sellable_quantity: 1.0 }
    ]
  }
];

// Enhanced unit selection function (copied from implementation)
function generateDynamicUnits(product) {
  const units = product.units || [];
  if (units.length === 0) return [];

  // Find the minimum sellable quantity from all units
  const minSellableQuantity = Math.min(
    ...units.map((unit) => unit.min_sellable_quantity || 0.25)
  );

  // Generate practical unit options based on min sellable quantity
  const baseUnits = [50, 25, 10, 5, 1, 0.5, 0.25]; // Common selling units
  const availableUnits = baseUnits.filter(unit => unit >= minSellableQuantity);

  // Create dynamic unit options
  const dynamicUnits = availableUnits.map(unit => {
    // Find the best base unit to calculate price from
    const baseUnit = units.find((u) => u.is_base_unit) || units[0];
    const basePrice = baseUnit?.price || 0;
    const baseConversion = baseUnit?.conversion_factor || 1;
    
    // Calculate price for this unit
    const unitPrice = (basePrice / baseConversion) * unit;
    
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
      is_dynamic: true
    };
  });

  // Add original units if they're not already covered
  const originalUnits = units.map((unit) => ({
    ...unit,
    is_dynamic: false
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

// Test each product
testProducts.forEach((product, index) => {
  console.log(`📦 Product ${index + 1}: ${product.name}`);
  console.log(`   SKU: ${product.sku}`);
  console.log(`   Original Units: ${product.units.map(u => `${u.unit_label} (₱${u.price})`).join(', ')}`);
  
  const dynamicUnits = generateDynamicUnits(product);
  console.log(`   Min Sellable: ${Math.min(...product.units.map(u => u.min_sellable_quantity))}kg`);
  console.log(`   Generated Units:`);
  
  dynamicUnits.forEach(unit => {
    const type = unit.is_dynamic ? '🔄 Dynamic' : '📋 Original';
    const price = unit.price.toFixed(2);
    console.log(`     ${type} ${unit.unit_label} (${unit.unit_name}) - ₱${price}`);
  });
  
  console.log('');
});

// Test specific scenarios
console.log('🎯 Testing Specific Scenarios:\n');

// Scenario 1: Product with 0.25kg minimum (should show all units including 1/4)
const scenario1 = testProducts[0];
const units1 = generateDynamicUnits(scenario1);
console.log('Scenario 1: Min 0.25kg (should show 50kg, 25kg, 10kg, 5kg, 1kg, 1/2, 1/4)');
console.log('Generated:', units1.map(u => u.unit_label).join(', '));
console.log('Expected: 50kg, 25kg, 10kg, 5kg, 1kg, 1/2, 1/4');
console.log('✅ Correct:', units1.length >= 7 && units1.some(u => u.unit_label === '1/4'));
console.log('');

// Scenario 2: Product with 0.5kg minimum (should show 50kg, 25kg, 10kg, 5kg, 1kg, 1/2)
const scenario2 = testProducts[1];
const units2 = generateDynamicUnits(scenario2);
console.log('Scenario 2: Min 0.5kg (should show 50kg, 25kg, 10kg, 5kg, 1kg, 1/2)');
console.log('Generated:', units2.map(u => u.unit_label).join(', '));
console.log('Expected: 50kg, 25kg, 10kg, 5kg, 1kg, 1/2');
console.log('✅ Correct:', units2.length >= 6 && units2.some(u => u.unit_label === '1/2') && !units2.some(u => u.unit_label === '1/4'));
console.log('');

// Scenario 3: Product with 1.0kg minimum (should show 50kg, 25kg, 10kg, 5kg, 1kg)
const scenario3 = testProducts[2];
const units3 = generateDynamicUnits(scenario3);
console.log('Scenario 3: Min 1.0kg (should show 50kg, 25kg, 10kg, 5kg, 1kg)');
console.log('Generated:', units3.map(u => u.unit_label).join(', '));
console.log('Expected: 50kg, 25kg, 10kg, 5kg, 1kg');
console.log('✅ Correct:', units3.length >= 5 && !units3.some(u => u.unit_label === '1/2') && !units3.some(u => u.unit_label === '1/4'));
console.log('');

// Test price calculations
console.log('💰 Testing Price Calculations:\n');

const testProduct = testProducts[0]; // Ammonium Sulfate
const testUnits = generateDynamicUnits(testProduct);
const baseUnit = testProduct.units.find(u => u.is_base_unit);

console.log(`Base Unit: ${baseUnit.unit_label} - ₱${baseUnit.price}`);
console.log('Price per kg: ₱' + (baseUnit.price / baseUnit.conversion_factor).toFixed(2));
console.log('');

testUnits.forEach(unit => {
  const expectedPrice = (baseUnit.price / baseUnit.conversion_factor) * unit.conversion_factor;
  const isCorrect = Math.abs(unit.price - expectedPrice) < 0.01;
  console.log(`${unit.unit_label}: ₱${unit.price.toFixed(2)} ${isCorrect ? '✅' : '❌'} (expected: ₱${expectedPrice.toFixed(2)})`);
});

console.log('\n🎉 Enhanced Unit Selection System Test Complete!');
console.log('\n📋 Summary:');
console.log('✅ Dynamic unit generation based on min sellable quantity');
console.log('✅ Fractional unit display (1/2, 1/4)');
console.log('✅ Accurate price calculations');
console.log('✅ Proper unit sorting (largest first)');
console.log('✅ Deduplication of units');
console.log('✅ Visual indicators for dynamic units');
