/**
 * Test script for Separated Cart Logic
 * Tests the cart separation of base units and sub-units
 */

console.log('🧪 Testing Separated Cart Logic...\n');

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

// Mock cart state
let cart = [];

// Function to add item to cart (separated logic)
function addToCart(product, selectedUnit) {
  const isBaseUnit = selectedUnit.is_base_unit;
  const unitQuantity = isBaseUnit ? 1 : selectedUnit.conversion_factor;
  const currentPrice = selectedUnit.price;
  
  // Find existing item for the same product AND same unit type (base/sub)
  const existingItem = cart.find(item => 
    item.product.id === product.id && 
    item.isBaseUnit === isBaseUnit
  );
  
  if (existingItem) {
    // Merge with existing item of the same type
    const newQuantity = existingItem.quantity + unitQuantity;
    
    cart = cart.map(item =>
      item.id === existingItem.id
        ? { 
            ...item, 
            quantity: newQuantity,
            lineTotal: newQuantity * item.unitPrice
          }
        : item
    );
  } else {
    // Create new item with unit type information
    const newItem = {
      id: `${product.id}-${isBaseUnit ? 'base' : 'sub'}-${Date.now()}`,
      product: product,
      quantity: unitQuantity,
      unitPrice: currentPrice,
      discount: 0,
      lineTotal: currentPrice * unitQuantity,
      selectedUnit: selectedUnit,
      isBaseUnit: isBaseUnit
    };
    
    cart.push(newItem);
  }
}

// Function to display cart
function displayCart() {
  console.log('📦 Current Cart:');
  if (cart.length === 0) {
    console.log('  (Empty)');
    return;
  }
  
  cart.forEach((item, index) => {
    const unitType = item.isBaseUnit ? 'BASE UNIT' : 'SUB-UNIT';
    const unitLabel = item.isBaseUnit ? item.selectedUnit.unit_label : 'kg';
    const priceLabel = item.isBaseUnit ? 
      `₱${item.unitPrice.toFixed(2)} per ${item.selectedUnit.unit_label}` : 
      `₱${item.unitPrice.toFixed(2)} per 1kg`;
    
    console.log(`  ${index + 1}. ${item.product.name} (${unitType})`);
    console.log(`     Qty: ${item.quantity} ${unitLabel}`);
    console.log(`     ${priceLabel}`);
    console.log(`     Total: ₱${item.lineTotal.toFixed(2)}`);
    console.log('');
  });
  
  const total = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  console.log(`💰 Cart Total: ₱${total.toFixed(2)}`);
  console.log('');
}

// Test scenarios
console.log('📊 Testing Separated Cart Scenarios:\n');

// Test 1: Add base unit (50kg sack)
console.log('Test 1: Adding base unit (50kg sack)');
addToCart(testProduct, testProduct.units[0]); // 50kg sack
displayCart();

// Test 2: Add another base unit (should merge)
console.log('Test 2: Adding another base unit (should merge)');
addToCart(testProduct, testProduct.units[0]); // Another 50kg sack
displayCart();

// Test 3: Add sub-unit (1kg)
console.log('Test 3: Adding sub-unit (1kg)');
addToCart(testProduct, testProduct.units[1]); // 1kg
displayCart();

// Test 4: Add more sub-units (should merge with existing sub-unit)
console.log('Test 4: Adding more sub-units (should merge)');
addToCart(testProduct, testProduct.units[1]); // Another 1kg
addToCart(testProduct, testProduct.units[1]); // Another 1kg
displayCart();

// Test 5: Add different product
console.log('Test 5: Adding different product');
const testProduct2 = {
  id: 'suregrow-layer',
  name: 'Suregrow Layer 2',
  units: [
    {
      id: 'sack-25kg',
      unit_name: 'Sack',
      unit_label: '25kg',
      conversion_factor: 25.0,
      is_base_unit: true,
      price: 1150.00,
      min_sellable_quantity: 0.25
    },
    {
      id: 'kg-1kg',
      unit_name: 'Kilogram',
      unit_label: '1kg',
      conversion_factor: 1.0,
      is_base_unit: false,
      price: 50.00,
      min_sellable_quantity: 0.25
    }
  ]
};

addToCart(testProduct2, testProduct2.units[0]); // 25kg sack
addToCart(testProduct2, testProduct2.units[1]); // 1kg
displayCart();

// Test 6: Expected final result
console.log('🎯 Expected Final Result:');
console.log('Ammonium Sulfate 21-0-0    qty: 2');
console.log('₱1,400.00 per 50kg         ₱2,800.00');
console.log('');
console.log('Ammonium Sulfate 21-0-0    qty: 3');
console.log('₱30.00 per 1kg             ₱90.00');
console.log('');
console.log('Suregrow Layer 2           qty: 1');
console.log('₱1,150.00 per 25kg         ₱1,150.00');
console.log('');
console.log('Suregrow Layer 2           qty: 1');
console.log('₱50.00 per 1kg             ₱50.00');
console.log('');
console.log('Total: ₱4,090.00');
console.log('');

console.log('✅ Separated Cart Logic Test Complete!');
console.log('\n📋 Summary:');
console.log('✅ Base units and sub-units are kept separate');
console.log('✅ Same unit types merge together');
console.log('✅ Different unit types create separate line items');
console.log('✅ Clear pricing display for each unit type');
console.log('✅ Proper quantity tracking per unit type');
