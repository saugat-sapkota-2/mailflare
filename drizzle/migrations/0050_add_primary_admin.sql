-- Exactly one account is the primary admin: the earliest-created admin becomes
-- it on upgrade so existing installs keep a single owner of admin management.
ALTER TABLE `users` ADD `is_primary_admin` integer DEFAULT false NOT NULL;
ALTER TABLE `users` ADD `can_manage_domains` integer DEFAULT false NOT NULL;
ALTER TABLE `users` ADD `can_manage_users` integer DEFAULT false NOT NULL;
UPDATE `users` SET `is_primary_admin` = 1
WHERE `id` = (
  SELECT `id` FROM `users` WHERE `role` = 'admin'
  ORDER BY `disabled` ASC, `created_at` ASC LIMIT 1
);


-- Ensures existing installs that already applied 0050 (or had no admin when it
-- ran) still get a primary admin. The NOT EXISTS guard makes this a no-op once
-- one is set, so it is safe to run on every database.
UPDATE `users` SET `is_primary_admin` = 1
WHERE `role` = 'admin'
  AND `id` = (
    SELECT `id` FROM `users` WHERE `role` = 'admin'
    ORDER BY `disabled` ASC, `created_at` ASC LIMIT 1
  )
  AND NOT EXISTS (SELECT 1 FROM `users` WHERE `is_primary_admin` = 1);
