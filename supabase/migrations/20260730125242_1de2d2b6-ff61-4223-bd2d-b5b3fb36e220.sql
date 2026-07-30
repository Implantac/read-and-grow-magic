REVOKE EXECUTE ON FUNCTION public.fn_profiles_guard_admin_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_tenant_hijack() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_sales_audit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_product_bom_ready() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_incident_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.wms_docks_sync_company_id() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS storefront_notifications_update ON public.storefront_notifications;
CREATE POLICY storefront_notifications_update ON public.storefront_notifications
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.storefronts s WHERE s.id = storefront_notifications.storefront_id AND s.company_id = public.get_user_company_id(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.storefronts s WHERE s.id = storefront_notifications.storefront_id AND s.company_id = public.get_user_company_id(auth.uid())));