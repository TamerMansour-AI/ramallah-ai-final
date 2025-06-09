alter table likes add column if not exists user_id uuid;
alter table comments add column if not exists user_id uuid;

-- اختياري: نقل البيانات القديمة
update likes set user_id = null where user_id is null;
update comments set user_id = null where user_id is null;

-- إنشاء فهرس
create index if not exists likes_user_idx on likes(user_id);
