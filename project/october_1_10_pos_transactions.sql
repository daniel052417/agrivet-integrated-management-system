-- POS Transactions for October 1-10, 2025
-- Insert statements for pos_transactions table
-- After execution, use the returned transaction IDs to insert pos_transaction_items

INSERT INTO "public"."pos_transactions" (
  "transaction_number",
  "pos_session_id",
  "customer_id",
  "cashier_id",
  "branch_id",
  "transaction_date",
  "transaction_type",
  "subtotal",
  "discount_amount",
  "discount_percentage",
  "tax_amount",
  "total_amount",
  "payment_status",
  "status",
  "notes",
  "created_at",
  "updated_at",
  "transaction_source",
  "order_id"
) VALUES
-- October 1, 2025
('TXN-20251001-083022', '3a9490e3-7111-4065-8fb2-41dc0d13cb36', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-01 08:30:22.000000+00', 'sale', 2175.00, 0.00, 0.00, 0.00, 2175.00, 'completed', 'active', 'Payment via cash', '2025-10-01 08:30:22.000000+00', '2025-10-01 08:30:22.000000+00', 'pos', null),
('TXN-20251001-094518', 'c551f768-ff16-4fd0-a9d4-7a44681e9ac0', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-01 09:45:18.000000+00', 'sale', 2190.00, 0.00, 0.00, 0.00, 2190.00, 'completed', 'active', 'Payment via cash', '2025-10-01 09:45:18.000000+00', '2025-10-01 09:45:18.000000+00', 'pos', null),
('TXN-20251001-133042', '87d18fe2-2558-4ce6-a65d-1f3a5962b733', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-01 13:30:42.000000+00', 'sale', 4475.00, 0.00, 0.00, 0.00, 4475.00, 'completed', 'active', 'Payment via cash', '2025-10-01 13:30:42.000000+00', '2025-10-01 13:30:42.000000+00', 'pos', null),
('TXN-20251001-161525', '0f42db1a-c0d2-4055-ae78-0ea37e486f55', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-01 16:15:25.000000+00', 'sale', 2500.00, 0.00, 0.00, 0.00, 2500.00, 'completed', 'active', 'Payment via cash', '2025-10-01 16:15:25.000000+00', '2025-10-01 16:15:25.000000+00', 'pos', null),

-- October 2, 2025
('TXN-20251002-091125', 'f96e4a4f-15eb-45be-84f0-fbae9c283a16', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-02 09:11:25.000000+00', 'sale', 2100.00, 0.00, 0.00, 0.00, 2100.00, 'completed', 'active', 'Payment via cash', '2025-10-02 09:11:25.000000+00', '2025-10-02 09:11:25.000000+00', 'pos', null),
('TXN-20251002-104532', 'e3d08047-fba9-4534-8d9f-e56199fa2f0f', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-02 10:45:32.000000+00', 'sale', 6640.00, 0.00, 0.00, 0.00, 6640.00, 'completed', 'active', 'Payment via cash', '2025-10-02 10:45:32.000000+00', '2025-10-02 10:45:32.000000+00', 'pos', null),
('TXN-20251002-142158', '154c42d1-1758-4d8a-94c1-67baaccf5a80', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-02 14:21:58.000000+00', 'sale', 1900.00, 0.00, 0.00, 0.00, 1900.00, 'completed', 'active', 'Payment via cash', '2025-10-02 14:21:58.000000+00', '2025-10-02 14:21:58.000000+00', 'pos', null),
('TXN-20251002-155845', 'd0895e47-a0d8-426a-a4b2-f5511c8d4440', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-02 15:58:45.000000+00', 'sale', 2250.00, 0.00, 0.00, 0.00, 2250.00, 'completed', 'active', 'Payment via cash', '2025-10-02 15:58:45.000000+00', '2025-10-02 15:58:45.000000+00', 'pos', null),

-- October 3, 2025
('TXN-20251003-082145', '0ac8f2dc-1067-4050-adb4-3405b7a0ca62', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-03 08:21:45.000000+00', 'sale', 2160.00, 0.00, 0.00, 0.00, 2160.00, 'completed', 'active', 'Payment via cash', '2025-10-03 08:21:45.000000+00', '2025-10-03 08:21:45.000000+00', 'pos', null),
('TXN-20251003-111532', '8effc32b-5ad6-4a3b-b78d-e8484be8cda5', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-03 11:15:32.000000+00', 'sale', 4375.00, 0.00, 0.00, 0.00, 4375.00, 'completed', 'active', 'Payment via cash', '2025-10-03 11:15:32.000000+00', '2025-10-03 11:15:32.000000+00', 'pos', null),
('TXN-20251003-134521', 'b5f969f2-a73d-4f83-966c-cb6e7a424a61', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-03 13:45:21.000000+00', 'sale', 1135.00, 0.00, 0.00, 0.00, 1135.00, 'completed', 'active', 'Payment via cash', '2025-10-03 13:45:21.000000+00', '2025-10-03 13:45:21.000000+00', 'pos', null),
('TXN-20251003-162308', '37a30193-778e-403f-8e71-8b5ac5a0c7a4', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-03 16:23:08.000000+00', 'sale', 4600.00, 0.00, 0.00, 0.00, 4600.00, 'completed', 'active', 'Payment via cash', '2025-10-03 16:23:08.000000+00', '2025-10-03 16:23:08.000000+00', 'pos', null),

-- October 4, 2025
('TXN-20251004-093258', '60fe9484-9bb4-4d17-92b1-965db9ddaa54', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-04 09:32:58.000000+00', 'sale', 2190.00, 0.00, 0.00, 0.00, 2190.00, 'completed', 'active', 'Payment via cash', '2025-10-04 09:32:58.000000+00', '2025-10-04 09:32:58.000000+00', 'pos', null),
('TXN-20251004-121445', 'c67b943b-0e24-4459-886b-6f546c622af3', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-04 12:14:45.000000+00', 'sale', 1800.00, 0.00, 0.00, 0.00, 1800.00, 'completed', 'active', 'Payment via cash', '2025-10-04 12:14:45.000000+00', '2025-10-04 12:14:45.000000+00', 'pos', null),
('TXN-20251004-143621', '8bca5999-d9b0-49e3-9a38-779f315e1bfd', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-04 14:36:21.000000+00', 'sale', 5000.00, 200.00, 4.00, 0.00, 4800.00, 'completed', 'active', 'Payment via cash - Regular customer discount', '2025-10-04 14:36:21.000000+00', '2025-10-04 14:36:21.000000+00', 'pos', null),
('TXN-20251004-165032', 'c4400a23-5e3e-4da2-a37d-4f1bbf4cf255', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-04 16:50:32.000000+00', 'sale', 2300.00, 0.00, 0.00, 0.00, 2300.00, 'completed', 'active', 'Payment via cash', '2025-10-04 16:50:32.000000+00', '2025-10-04 16:50:32.000000+00', 'pos', null),

-- October 5, 2025
('TXN-20251005-081532', 'fe10aeca-cab5-4239-ab68-b9923aff6e31', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-05 08:15:32.000000+00', 'sale', 2100.00, 0.00, 0.00, 0.00, 2100.00, 'completed', 'active', 'Payment via cash', '2025-10-05 08:15:32.000000+00', '2025-10-05 08:15:32.000000+00', 'pos', null),
('TXN-20251005-102145', '2f073a51-336b-42bc-9d61-d2ad4625c7e8', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-05 10:21:45.000000+00', 'sale', 127.00, 0.00, 0.00, 0.00, 127.00, 'completed', 'active', 'Payment via cash', '2025-10-05 10:21:45.000000+00', '2025-10-05 10:21:45.000000+00', 'pos', null),
('TXN-20251005-133258', '29edc791-cf03-48c2-8f84-ce2c0acb5c71', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-05 13:32:58.000000+00', 'sale', 4475.00, 0.00, 0.00, 0.00, 4475.00, 'completed', 'active', 'Payment via cash', '2025-10-05 13:32:58.000000+00', '2025-10-05 13:32:58.000000+00', 'pos', null),
('TXN-20251005-151021', '9e3c7524-9e47-4783-be50-c63d303aa926', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-05 15:10:21.000000+00', 'sale', 6575.00, 0.00, 0.00, 0.00, 6575.00, 'completed', 'active', 'Payment via cash', '2025-10-05 15:10:21.000000+00', '2025-10-05 15:10:21.000000+00', 'pos', null),

-- October 6, 2025
('TXN-20251006-085645', 'bfd73bef-d9c4-418e-a0ac-bf13429b1c94', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-06 08:56:45.000000+00', 'sale', 2175.00, 0.00, 0.00, 0.00, 2175.00, 'completed', 'active', 'Payment via cash', '2025-10-06 08:56:45.000000+00', '2025-10-06 08:56:45.000000+00', 'pos', null),
('TXN-20251006-112532', '67d3e44c-39da-47c0-91d4-05d60f5ff90b', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-06 11:25:32.000000+00', 'sale', 2190.00, 0.00, 0.00, 0.00, 2190.00, 'completed', 'active', 'Payment via cash', '2025-10-06 11:25:32.000000+00', '2025-10-06 11:25:32.000000+00', 'pos', null),
('TXN-20251006-144521', '87d18fe2-2558-4ce6-a65d-1f3a5962b733', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-06 14:45:21.000000+00', 'sale', 4275.00, 0.00, 0.00, 0.00, 4275.00, 'completed', 'active', 'Payment via cash', '2025-10-06 14:45:21.000000+00', '2025-10-06 14:45:21.000000+00', 'pos', null),
('TXN-20251006-161258', 'c551f768-ff16-4fd0-a9d4-7a44681e9ac0', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-06 16:12:58.000000+00', 'sale', 2800.00, 0.00, 0.00, 0.00, 2800.00, 'completed', 'active', 'Payment via cash', '2025-10-06 16:12:58.000000+00', '2025-10-06 16:12:58.000000+00', 'pos', null),

-- October 7, 2025
('TXN-20251007-092158', '3a9490e3-7111-4065-8fb2-41dc0d13cb36', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-07 09:21:58.000000+00', 'sale', 2250.00, 0.00, 0.00, 0.00, 2250.00, 'completed', 'active', 'Payment via cash', '2025-10-07 09:21:58.000000+00', '2025-10-07 09:21:58.000000+00', 'pos', null),
('TXN-20251007-113445', '0f42db1a-c0d2-4055-ae78-0ea37e486f55', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-07 11:34:45.000000+00', 'sale', 4360.00, 0.00, 0.00, 0.00, 4360.00, 'completed', 'active', 'Payment via cash', '2025-10-07 11:34:45.000000+00', '2025-10-07 11:34:45.000000+00', 'pos', null),
('TXN-20251007-142532', 'f96e4a4f-15eb-45be-84f0-fbae9c283a16', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-07 14:25:32.000000+00', 'sale', 2160.00, 0.00, 0.00, 0.00, 2160.00, 'completed', 'active', 'Payment via cash', '2025-10-07 14:25:32.000000+00', '2025-10-07 14:25:32.000000+00', 'pos', null),
('TXN-20251007-163021', 'e3d08047-fba9-4534-8d9f-e56199fa2f0f', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-07 16:30:21.000000+00', 'sale', 6250.00, 250.00, 4.00, 0.00, 6000.00, 'completed', 'active', 'Payment via cash - Bulk order discount', '2025-10-07 16:30:21.000000+00', '2025-10-07 16:30:21.000000+00', 'pos', null),

-- October 8, 2025
('TXN-20251008-084532', '154c42d1-1758-4d8a-94c1-67baaccf5a80', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-08 08:45:32.000000+00', 'sale', 1900.00, 0.00, 0.00, 0.00, 1900.00, 'completed', 'active', 'Payment via cash', '2025-10-08 08:45:32.000000+00', '2025-10-08 08:45:32.000000+00', 'pos', null),
('TXN-20251008-111258', 'd0895e47-a0d8-426a-a4b2-f5511c8d4440', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-08 11:12:58.000000+00', 'sale', 2300.00, 0.00, 0.00, 0.00, 2300.00, 'completed', 'active', 'Payment via cash', '2025-10-08 11:12:58.000000+00', '2025-10-08 11:12:58.000000+00', 'pos', null),
('TXN-20251008-134521', '0ac8f2dc-1067-4050-adb4-3405b7a0ca62', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-08 13:45:21.000000+00', 'sale', 2100.00, 0.00, 0.00, 0.00, 2100.00, 'completed', 'active', 'Payment via cash', '2025-10-08 13:45:21.000000+00', '2025-10-08 13:45:21.000000+00', 'pos', null),
('TXN-20251008-152145', '8effc32b-5ad6-4a3b-b78d-e8484be8cda5', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-08 15:21:45.000000+00', 'sale', 1135.00, 0.00, 0.00, 0.00, 1135.00, 'completed', 'active', 'Payment via cash', '2025-10-08 15:21:45.000000+00', '2025-10-08 15:21:45.000000+00', 'pos', null),

-- October 9, 2025
('TXN-20251009-091532', 'b5f969f2-a73d-4f83-966c-cb6e7a424a61', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-09 09:15:32.000000+00', 'sale', 2190.00, 0.00, 0.00, 0.00, 2190.00, 'completed', 'active', 'Payment via cash', '2025-10-09 09:15:32.000000+00', '2025-10-09 09:15:32.000000+00', 'pos', null),
('TXN-20251009-114258', '37a30193-778e-403f-8e71-8b5ac5a0c7a4', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-09 11:42:58.000000+00', 'sale', 2500.00, 0.00, 0.00, 0.00, 2500.00, 'completed', 'active', 'Payment via cash', '2025-10-09 11:42:58.000000+00', '2025-10-09 11:42:58.000000+00', 'pos', null),
('TXN-20251009-140845', '60fe9484-9bb4-4d17-92b1-965db9ddaa54', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-09 14:08:45.000000+00', 'sale', 4600.00, 0.00, 0.00, 0.00, 4600.00, 'completed', 'active', 'Payment via cash', '2025-10-09 14:08:45.000000+00', '2025-10-09 14:08:45.000000+00', 'pos', null),
('TXN-20251009-161532', 'c67b943b-0e24-4459-886b-6f546c622af3', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-09 16:15:32.000000+00', 'sale', 1800.00, 0.00, 0.00, 0.00, 1800.00, 'completed', 'active', 'Payment via cash', '2025-10-09 16:15:32.000000+00', '2025-10-09 16:15:32.000000+00', 'pos', null),

-- October 10, 2025
('TXN-20251010-083021', '8bca5999-d9b0-49e3-9a38-779f315e1bfd', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-10 08:30:21.000000+00', 'sale', 2175.00, 0.00, 0.00, 0.00, 2175.00, 'completed', 'active', 'Payment via cash', '2025-10-10 08:30:21.000000+00', '2025-10-10 08:30:21.000000+00', 'pos', null),
('TXN-20251010-102445', 'c4400a23-5e3e-4da2-a37d-4f1bbf4cf255', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-10 10:24:45.000000+00', 'sale', 2250.00, 0.00, 0.00, 0.00, 2250.00, 'completed', 'active', 'Payment via cash', '2025-10-10 10:24:45.000000+00', '2025-10-10 10:24:45.000000+00', 'pos', null),
('TXN-20251010-131532', 'fe10aeca-cab5-4239-ab68-b9923aff6e31', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-10 13:15:32.000000+00', 'sale', 4360.00, 0.00, 0.00, 0.00, 4360.00, 'completed', 'active', 'Payment via cash', '2025-10-10 13:15:32.000000+00', '2025-10-10 13:15:32.000000+00', 'pos', null),
('TXN-20251010-154258', '2f073a51-336b-42bc-9d61-d2ad4625c7e8', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-10 15:42:58.000000+00', 'sale', 2100.00, 0.00, 0.00, 0.00, 2100.00, 'completed', 'active', 'Payment via cash', '2025-10-10 15:42:58.000000+00', '2025-10-10 15:42:58.000000+00', 'pos', null),
('TXN-20251010-171445', '29edc791-cf03-48c2-8f84-ce2c0acb5c71', null, 'dc5c00ba-6b63-4dd9-afe2-e4d771dda79f', '79ec90b9-d2a4-4d20-b971-53b8baf16f63', '2025-10-10 17:14:45.000000+00', 'sale', 4275.00, 0.00, 0.00, 0.00, 4275.00, 'completed', 'active', 'Payment via cash', '2025-10-10 17:14:45.000000+00', '2025-10-10 17:14:45.000000+00', 'pos', null);

-- Summary: 40 transactions for October 1-10, 2025
-- Total transactions: 40
-- Transactions with discounts: 2 (October 4 and October 7)
-- All transactions are 'completed' with 'active' status
-- All transactions are from 'pos' source
-- Note: Transaction IDs (UUIDs) will be auto-generated by Supabase
-- After executing this INSERT, query the table using transaction_number to get the generated IDs for pos_transaction_items insertion

