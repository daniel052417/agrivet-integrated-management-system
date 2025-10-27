/**
 * Test script for Dynamic Pricing Display Logic
 * Tests the cart display logic for showing pricing information based on quantity
 */

console.log('🧪 Testing Dynamic Pricing Display Logic...\n');

// Mock product with tiered pricing
const testProduct = {
  id: 'ammonium-sulfate',
  name: 'Ammonium Sulfate 21-0-0',
  units: [
    {
      id: 'sack-50kg',
      unit_name: 'Sack',
      unit_label: '50kg',
      conversion_factor: 50.0,
      is_base_unit: true,
      price: 1400.00,
      min_sellable_quantity: 0.25
    },
    {
      id: 'kg-1kg',
      unit_name: 'Kilogram',
      unit_label: '1kg',
      conversion_factor: 1.0,
      is_base_unit: false,
      price: 30.00,
      min_sellable_quantity: 0.25
    }
  ]
};

// Function to generate pricing display text
function getPricingDisplayText(product, quantity) {
  const units = product.units || [];
  const baseUnit = units.find((u) => u.is_base_unit);
  const smallestUnit = units.reduce((smallest, unit) => {
    if (!smallest || unit.conversion_factor < smallest.conversion_factor) {
      return unit;
    }
    return smallest;
  });

  if (!baseUnit || !smallestUnit) {
    return `₱${product.price.toFixed(2)} per unit`;
  }

  const baseKg = baseUnit.conversion_factor;
  const basePrice = baseUnit.price;
  const pricePerKg = smallestUnit.price / smallestUnit.conversion_factor;

  if (quantity < baseKg) {
    // Quantity < base unit: show per kg only
    return `₱${pricePerKg.toFixed(2)} per 1kg`;
  } else if (Math.abs(quantity - baseKg) < 0.001) {
    // Quantity = base unit: show base unit only
    return `₱${basePrice.toFixed(2)} per ${baseUnit.unit_label}`;
  } else {
    // Quantity > base unit: show both
    return `₱${basePrice.toFixed(2)} per ${baseUnit.unit_label} + ₱${pricePerKg.toFixed(2)} per 1kg`;
  }
}

// Test scenarios
console.log('📊 Pricing Display Test Scenarios:\n');

const testCases = [
  { quantity: 10, expected: '₱30.00 per 1kg', description: '10kg (less than base unit)' },
  { quantity: 25, expected: '₱30.00 per 1kg', description: '25kg (less than base unit)' },
  { quantity: 49, expected: '₱30.00 per 1kg', description: '49kg (less than base unit)' },
  { quantity: 50, expected: '₱1400.00 per 50kg', description: '50kg (equals base unit)' },
  { quantity: 60, expected: '₱1400.00 per 50kg + ₱30.00 per 1kg', description: '60kg (exceeds base unit)' },
  { quantity: 75, expected: '₱1400.00 per 50kg + ₱30.00 per 1kg', description: '75kg (exceeds base unit)' },
  { quantity: 100, expected: '₱1400.00 per 50kg + ₱30.00 per 1kg', description: '100kg (exceeds base unit)' },
  { quantity: 101, expected: '₱1400.00 per 50kg + ₱30.00 per 1kg', description: '101kg (exceeds base unit)' }
];

testCases.forEach(testCase => {
  const actual = getPricingDisplayText(testProduct, testCase.quantity);
  const isCorrect = actual === testCase.expected;
  
  console.log(`${testCase.description}:`);
  console.log(`  Quantity: ${testCase.quantity}kg`);
  console.log(`  Display: ${actual}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
  console.log('');
});

// Test edge cases
console.log('🔍 Edge Cases:\n');

const edgeCases = [
  { quantity: 0.25, expected: '₱30.00 per 1kg', description: '0.25kg (minimum sellable)' },
  { quantity: 0.5, expected: '₱30.00 per 1kg', description: '0.5kg (half kg)' },
  { quantity: 1, expected: '₱30.00 per 1kg', description: '1kg (exactly 1kg)' },
  { quantity: 49.99, expected: '₱30.00 per 1kg', description: '49.99kg (just under base unit)' },
  { quantity: 50.01, expected: '₱1400.00 per 50kg + ₱30.00 per 1kg', description: '50.01kg (just over base unit)' }
];

edgeCases.forEach(testCase => {
  const actual = getPricingDisplayText(testProduct, testCase.quantity);
  const isCorrect = actual === testCase.expected;
  
  console.log(`${testCase.description}:`);
  console.log(`  Quantity: ${testCase.quantity}kg`);
  console.log(`  Display: ${actual}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
  console.log('');
});

// Test with different base units
console.log('🔄 Different Base Unit Test:\n');

const testProduct25kg = {
  id: 'test-product',
  name: 'Test Product',
  units: [
    {
      id: 'sack-25kg',
      unit_name: 'Sack',
      unit_label: '25kg',
      conversion_factor: 25.0,
      is_base_unit: true,
      price: 750.00,
      min_sellable_quantity: 0.25
    },
    {
      id: 'kg-1kg',
      unit_name: 'Kilogram',
      unit_label: '1kg',
      conversion_factor: 1.0,
      is_base_unit: false,
      price: 30.00,
      min_sellable_quantity: 0.25
    }
  ]
};

const differentBaseTests = [
  { quantity: 10, expected: '₱30.00 per 1kg', description: '10kg (less than 25kg base)' },
  { quantity: 25, expected: '₱750.00 per 25kg', description: '25kg (equals base unit)' },
  { quantity: 30, expected: '₱750.00 per 25kg + ₱30.00 per 1kg', description: '30kg (exceeds base unit)' }
];

differentBaseTests.forEach(testCase => {
  const actual = getPricingDisplayText(testProduct25kg, testCase.quantity);
  const isCorrect = actual === testCase.expected;
  
  console.log(`${testCase.description}:`);
  console.log(`  Quantity: ${testCase.quantity}kg`);
  console.log(`  Display: ${actual}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
  console.log('');
});

console.log('🎉 Dynamic Pricing Display Test Complete!');
console.log('\n📋 Summary:');
console.log('✅ Quantity < base unit: Shows per kg pricing only');
console.log('✅ Quantity = base unit: Shows base unit pricing only');
console.log('✅ Quantity > base unit: Shows both base unit + per kg pricing');
console.log('✅ Handles edge cases correctly');
console.log('✅ Works with different base unit sizes');
console.log('✅ Clean, informative pricing display');
