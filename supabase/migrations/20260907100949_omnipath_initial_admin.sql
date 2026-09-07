insert into game_private.developer_allowlist(email,role) values('graillab.xyz@gmail.com','admin') on conflict(email) do nothing;
insert into public.developer_members(user_id,role) select u.id,a.role from auth.users u join game_private.developer_allowlist a on a.email=lower(u.email) where u.email_confirmed_at is not null on conflict(user_id) do nothing;
