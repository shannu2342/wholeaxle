-- Run as MySQL root/admin user.
-- Adjust password before production use.

CREATE DATABASE IF NOT EXISTS wholexale_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'wholexale_user'@'localhost' IDENTIFIED BY 'change-me';
CREATE USER IF NOT EXISTS 'wholexale_user'@'127.0.0.1' IDENTIFIED BY 'change-me';

GRANT ALL PRIVILEGES ON wholexale_auth.* TO 'wholexale_user'@'localhost';
GRANT ALL PRIVILEGES ON wholexale_auth.* TO 'wholexale_user'@'127.0.0.1';

FLUSH PRIVILEGES;

