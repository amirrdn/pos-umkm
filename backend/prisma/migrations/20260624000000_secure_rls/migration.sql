DO $$
DECLARE
  tenant_table TEXT;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
'users',
'roles',
'categories',
'products',
'transactions',
'shifts',
'stock_ledgers',
'customers',
'stock_requests',
'outlets',
'outlet_stocks',
'stock_transfers',
'outlet_product_prices',
'subscription_invoices',
'subscription_histories'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', tenant_table);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I AS PERMISSIVE FOR ALL USING (
        "tenantId" = NULLIF((select current_setting(''app.current_tenant_id'', true)), '''')
      ) WITH CHECK (
        "tenantId" = NULLIF((select current_setting(''app.current_tenant_id'', true)), '''')
      )',
      tenant_table
    );
  END LOOP;
END $$;
