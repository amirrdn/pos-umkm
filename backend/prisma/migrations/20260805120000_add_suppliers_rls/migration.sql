DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'suppliers',
    'purchase_orders',
    'sales_returns'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO app_user', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I AS PERMISSIVE FOR ALL USING (
        "tenantId" = NULLIF((select current_setting(''app.current_tenant_id'', true)), '''')
      ) WITH CHECK (
        "tenantId" = NULLIF((select current_setting(''app.current_tenant_id'', true)), '''')
      )',
      tbl
    );
  END LOOP;
END $$;
