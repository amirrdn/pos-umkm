-- Migration to enforce strict multi-tenant Row Level Security (RLS) policies on child relation tables
-- Each child table verifies tenant isolation via parent table join against current_setting('app.current_tenant_id')

DO $$
BEGIN
  -- 1. transaction_items
  DROP POLICY IF EXISTS tenant_child_public_policy ON transaction_items;
  DROP POLICY IF EXISTS tenant_child_strict_policy ON transaction_items;
  CREATE POLICY tenant_child_strict_policy ON transaction_items AS PERMISSIVE FOR ALL TO public
  USING (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_items."transactionId"
      AND t."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  )
  WITH CHECK (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_items."transactionId"
      AND t."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  );

  -- 2. transaction_payments
  DROP POLICY IF EXISTS tenant_child_public_policy ON transaction_payments;
  DROP POLICY IF EXISTS tenant_child_strict_policy ON transaction_payments;
  CREATE POLICY tenant_child_strict_policy ON transaction_payments AS PERMISSIVE FOR ALL TO public
  USING (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_payments."transactionId"
      AND t."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  )
  WITH CHECK (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_payments."transactionId"
      AND t."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  );

  -- 3. purchase_order_items
  DROP POLICY IF EXISTS tenant_child_public_policy ON purchase_order_items;
  DROP POLICY IF EXISTS tenant_child_strict_policy ON purchase_order_items;
  CREATE POLICY tenant_child_strict_policy ON purchase_order_items AS PERMISSIVE FOR ALL TO public
  USING (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items."purchaseOrderId"
      AND po."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  )
  WITH CHECK (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items."purchaseOrderId"
      AND po."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  );

  -- 4. sales_return_items
  DROP POLICY IF EXISTS tenant_child_public_policy ON sales_return_items;
  DROP POLICY IF EXISTS tenant_child_strict_policy ON sales_return_items;
  CREATE POLICY tenant_child_strict_policy ON sales_return_items AS PERMISSIVE FOR ALL TO public
  USING (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM sales_returns sr
      WHERE sr.id = sales_return_items."salesReturnId"
      AND sr."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  )
  WITH CHECK (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM sales_returns sr
      WHERE sr.id = sales_return_items."salesReturnId"
      AND sr."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  );

  -- 5. stock_transfer_items
  DROP POLICY IF EXISTS tenant_child_public_policy ON stock_transfer_items;
  DROP POLICY IF EXISTS tenant_child_strict_policy ON stock_transfer_items;
  CREATE POLICY tenant_child_strict_policy ON stock_transfer_items AS PERMISSIVE FOR ALL TO public
  USING (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM stock_transfers st
      WHERE st.id = stock_transfer_items."transferId"
      AND st."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  )
  WITH CHECK (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM stock_transfers st
      WHERE st.id = stock_transfer_items."transferId"
      AND st."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  );

  -- 6. product_images
  DROP POLICY IF EXISTS tenant_child_public_policy ON product_images;
  DROP POLICY IF EXISTS tenant_child_strict_policy ON product_images;
  CREATE POLICY tenant_child_strict_policy ON product_images AS PERMISSIVE FOR ALL TO public
  USING (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images."productId"
      AND p."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  )
  WITH CHECK (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images."productId"
      AND p."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  );

  -- 7. user_outlets
  DROP POLICY IF EXISTS tenant_child_public_policy ON user_outlets;
  DROP POLICY IF EXISTS tenant_child_strict_policy ON user_outlets;
  CREATE POLICY tenant_child_strict_policy ON user_outlets AS PERMISSIVE FOR ALL TO public
  USING (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM outlets o
      WHERE o.id = user_outlets."outletId"
      AND o."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  )
  WITH CHECK (
    (select current_setting('app.current_tenant_id', true)) IS NULL
    OR (select current_setting('app.current_tenant_id', true)) = ''
    OR EXISTS (
      SELECT 1 FROM outlets o
      WHERE o.id = user_outlets."outletId"
      AND o."tenantId" = NULLIF((select current_setting('app.current_tenant_id', true)), '')
    )
  );

END $$;
