-- my_role() hanya dibutuhkan oleh policy RLS untuk user login
revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;
