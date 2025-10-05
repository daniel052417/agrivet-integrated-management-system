-- Inventory Reservation Functions
-- Functions to handle inventory reservations for orders

-- Function to update inventory reserved quantity
CREATE OR REPLACE FUNCTION update_inventory_reserved(
    p_product_id uuid,
    p_branch_id uuid,
    p_quantity numeric
) RETURNS void AS $$
BEGIN
    -- Update the quantity_reserved field in inventory table
    UPDATE inventory 
    SET 
        quantity_reserved = GREATEST(0, quantity_reserved + p_quantity),
        updated_at = NOW()
    WHERE 
        product_id = p_product_id 
        AND branch_id = p_branch_id;
    
    -- If no rows were updated, it means the inventory record doesn't exist
    -- This shouldn't happen in normal operation, but we'll log it
    IF NOT FOUND THEN
        RAISE WARNING 'Inventory record not found for product_id: %, branch_id: %', p_product_id, p_branch_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if inventory is available for reservation
CREATE OR REPLACE FUNCTION check_inventory_availability(
    p_product_id uuid,
    p_branch_id uuid,
    p_required_quantity numeric
) RETURNS boolean AS $$
DECLARE
    available_quantity numeric;
BEGIN
    -- Get current available quantity
    SELECT quantity_available INTO available_quantity
    FROM inventory 
    WHERE product_id = p_product_id AND branch_id = p_branch_id;
    
    -- Return true if available quantity is sufficient
    RETURN COALESCE(available_quantity, 0) >= p_required_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory summary for an order
CREATE OR REPLACE FUNCTION get_order_inventory_summary(
    p_order_id uuid,
    p_branch_id uuid
) RETURNS TABLE (
    product_id uuid,
    product_name text,
    required_quantity numeric,
    available_quantity numeric,
    shortfall numeric,
    is_available boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.product_id,
        oi.product_name,
        oi.quantity as required_quantity,
        COALESCE(inv.quantity_available, 0) as available_quantity,
        GREATEST(0, oi.quantity - COALESCE(inv.quantity_available, 0)) as shortfall,
        COALESCE(inv.quantity_available, 0) >= oi.quantity as is_available
    FROM order_items oi
    LEFT JOIN inventory inv ON oi.product_id = inv.product_id AND inv.branch_id = p_branch_id
    WHERE oi.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release all reservations for an order
CREATE OR REPLACE FUNCTION release_order_reservations(
    p_order_id uuid,
    p_user_id uuid
) RETURNS void AS $$
DECLARE
    reservation_record RECORD;
BEGIN
    -- Get all active reservations for this order
    FOR reservation_record IN 
        SELECT * FROM inventory_reservations 
        WHERE order_id = p_order_id AND status = 'active'
    LOOP
        -- Update reservation status
        UPDATE inventory_reservations 
        SET 
            status = 'released',
            released_at = NOW(),
            released_by = p_user_id,
            quantity_released = quantity_reserved
        WHERE id = reservation_record.id;
        
        -- Release the reserved inventory
        UPDATE inventory 
        SET 
            quantity_reserved = GREATEST(0, quantity_reserved - reservation_record.quantity_reserved),
            updated_at = NOW()
        WHERE 
            product_id = reservation_record.product_id 
            AND branch_id = reservation_record.branch_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to fulfill all reservations for an order (when order is completed)
CREATE OR REPLACE FUNCTION fulfill_order_reservations(
    p_order_id uuid,
    p_user_id uuid
) RETURNS void AS $$
DECLARE
    reservation_record RECORD;
BEGIN
    -- Get all active reservations for this order
    FOR reservation_record IN 
        SELECT * FROM inventory_reservations 
        WHERE order_id = p_order_id AND status = 'active'
    LOOP
        -- Update reservation status
        UPDATE inventory_reservations 
        SET 
            status = 'fulfilled',
            released_at = NOW(),
            released_by = p_user_id,
            quantity_released = quantity_reserved
        WHERE id = reservation_record.id;
        
        -- Update inventory: reduce available quantity and reserved quantity
        UPDATE inventory 
        SET 
            quantity_available = GREATEST(0, quantity_available - reservation_record.quantity_reserved),
            quantity_reserved = GREATEST(0, quantity_reserved - reservation_record.quantity_reserved),
            updated_at = NOW()
        WHERE 
            product_id = reservation_record.product_id 
            AND branch_id = reservation_record.branch_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION update_inventory_reserved IS 'Updates the reserved quantity for a product at a specific branch';
COMMENT ON FUNCTION check_inventory_availability IS 'Checks if sufficient inventory is available for a product at a specific branch';
COMMENT ON FUNCTION get_order_inventory_summary IS 'Returns inventory availability summary for all items in an order';
COMMENT ON FUNCTION release_order_reservations IS 'Releases all inventory reservations for a cancelled order';
COMMENT ON FUNCTION fulfill_order_reservations IS 'Fulfills all inventory reservations when an order is completed';
