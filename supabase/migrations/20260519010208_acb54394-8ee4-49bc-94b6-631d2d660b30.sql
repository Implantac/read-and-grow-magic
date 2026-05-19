-- Create function for cleanup
CREATE OR REPLACE FUNCTION public.handle_deleted_orders_cleanup()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.deleted_orders_archive
    WHERE expires_at < now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to run cleanup on every insert
DROP TRIGGER IF EXISTS trigger_cleanup_deleted_orders ON public.deleted_orders_archive;
CREATE TRIGGER trigger_cleanup_deleted_orders
BEFORE INSERT ON public.deleted_orders_archive
FOR EACH STATEMENT
EXECUTE FUNCTION public.handle_deleted_orders_cleanup();
