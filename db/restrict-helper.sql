-- Applied as migration restrict_platform_rls_helper.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
