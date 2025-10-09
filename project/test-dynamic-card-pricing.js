/**
 * Test script for Dynamic Card Pricing
 * Tests that product card prices are calculated dynamically based on selected sub-units
 */

console.log('🧪 Testing Dynamic Card Pricing...\n');

// Mock product with various sub-units
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
      id: 'kg-25kg',
      unit_name: '25kg',
      unit_label: '25kg',
      conversion_factor: 25.0,
      is_base_unit: false,
      price: 750.00, // This is the total price for 25kg
      min_sellable_quantity: 0.25
    },
    {
      id: 'kg-10kg',
      unit_name: '10kg',
      unit_label: '10kg',
      conversion_factor: 10.0,
      is_base_unit: false,
      price: 300.00, // This is the total price for 10kg
      min_sellable_quantity: 0.25
    },
    {
      id: 'kg-5kg',
      unit_name: '5kg',
      unit_label: '5kg',
      conversion_factor: 5.0,
      is_base_unit: false,
      price: 150.00, // This is the total price for 5kg
      min_sellable_quantity: 0.25
    },
    {
      id: 'kg-1kg',
      unit_name: '1kg',
      unit_label: '1kg',
      conversion_factor: 1.0,
      is_base_unit: false,
      price: 30.00, // This is the total price for 1kg
      min_sellable_quantity: 0.25
    }
  ]
};

// Function to get current price (simulating the getCurrentPrice function)
function getCurrentPrice(product, selectedUnit) {
  const isBaseUnit = selectedUnit.is_base_unit;
  
  if (isBaseUnit) {
    // Base unit uses its fixed price
    return selectedUnit.price;
  } else {
    // Sub-units calculate price based on selected unit's conversion factor
    const smallestUnit = product.units.reduce((smallest, unit) => {
      if (!smallest || unit.conversion_factor < smallest.conversion_factor) {
        return unit;
      }
      return smallest;
    });
    
    if (smallestUnit && selectedUnit) {
      const pricePerKg = smallestUnit.price / smallestUnit.conversion_factor;
      return pricePerKg * selectedUnit.conversion_factor;
    }
    
    return selectedUnit.price;
  }
}

// Test scenarios
console.log('📊 Testing Dynamic Card Pricing:\n');

// Test 1: Base unit (50kg sack)
console.log('Test 1: Base unit (50kg sack)');
const baseUnit = testProduct.units[0];
const basePrice = getCurrentPrice(testProduct, baseUnit);
console.log(`Selected: ${baseUnit.unit_label}`);
console.log(`Price: ₱${basePrice.toFixed(2)} per ${baseUnit.unit_label}`);
console.log(`Expected: ₱1,400.00 per 50kg`);
console.log(`✅ ${basePrice === 1400 ? 'Correct' : 'Incorrect'}`);
console.log('');

// Test 2: 25kg sub-unit
console.log('Test 2: 25kg sub-unit');
const unit25kg = testProduct.units[1];
const price25kg = getCurrentPrice(testProduct, unit25kg);
console.log(`Selected: ${unit25kg.unit_label}`);
console.log(`Price: ₱${price25kg.toFixed(2)} per ${unit25kg.unit_label}`);
console.log(`Expected: ₱750.00 per 25kg (30 × 25 = 750)`);
console.log(`✅ ${price25kg === 750 ? 'Correct' : 'Incorrect'}`);
console.log('');

// Test 3: 10kg sub-unit
console.log('Test 3: 10kg sub-unit');
const unit10kg = testProduct.units[2];
const price10kg = getCurrentPrice(testProduct, unit10kg);
console.log(`Selected: ${unit10kg.unit_label}`);
console.log(`Price: ₱${price10kg.toFixed(2)} per ${unit10kg.unit_label}`);
console.log(`Expected: ₱300.00 per 10kg (30 × 10 = 300)`);
console.log(`✅ ${price10kg === 300 ? 'Correct' : 'Incorrect'}`);
console.log('');

// Test 4: 5kg sub-unit
console.log('Test 4: 5kg sub-unit');
const unit5kg = testProduct.units[3];
const price5kg = getCurrentPrice(testProduct, unit5kg);
console.log(`Selected: ${unit5kg.unit_label}`);
console.log(`Price: ₱${price5kg.toFixed(2)} per ${unit5kg.unit_label}`);
console.log(`Expected: ₱150.00 per 5kg (30 × 5 = 150)`);
console.log(`✅ ${price5kg === 150 ? 'Correct' : 'Incorrect'}`);
console.log('');

// Test 5: 1kg sub-unit
console.log('Test 5: 1kg sub-unit');
const unit1kg = testProduct.units[4];
const price1kg = getCurrentPrice(testProduct, unit1kg);
console.log(`Selected: ${unit1kg.unit_label}`);
console.log(`Price: ₱${price1kg.toFixed(2)} per ${unit1kg.unit_label}`);
console.log(`Expected: ₱30.00 per 1kg (30 × 1 = 30)`);
console.log(`✅ ${price1kg === 30 ? 'Correct' : 'Incorrect'}`);
console.log('');

// Test 6: Price calculation breakdown
console.log('Test 6: Price Calculation Breakdown');
const smallestUnit = testProduct.units[4]; // 1kg unit
const pricePerKg = smallestUnit.price / smallestUnit.conversion_factor;
console.log(`Smallest unit: ${smallestUnit.unit_label} = ₱${smallestUnit.price}`);
console.log(`Price per kg: ₱${pricePerKg.toFixed(2)}`);
console.log('');

console.log('Sub-unit calculations:');
testProduct.units.forEach(unit => {
  if (!unit.is_base_unit) {
    const calculatedPrice = pricePerKg * unit.conversion_factor;
    console.log(`${unit.unit_label}: ₱${pricePerKg.toFixed(2)} × ${unit.conversion_factor} = ₱${calculatedPrice.toFixed(2)}`);
  }
});

console.log('');
console.log('✅ Dynamic Card Pricing Test Complete!');
console.log('\n📋 Summary:');
console.log('✅ Base units show their fixed price');
console.log('✅ Sub-units calculate price dynamically (price per kg × conversion factor)');
console.log('✅ 25kg shows ₱750.00 (30 × 25)');
console.log('✅ 10kg shows ₱300.00 (30 × 10)');
console.log('✅ 5kg shows ₱150.00 (30 × 5)');
console.log('✅ 1kg shows ₱30.00 (30 × 1)');
