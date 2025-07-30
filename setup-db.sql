CREATE USER IF NOT EXISTS 'topleague'@'localhost' IDENTIFIED BY 'TopLeague2025!';
CREATE DATABASE IF NOT EXISTS topleague_local;
GRANT ALL PRIVILEGES ON topleague_local.* TO 'topleague'@'localhost';
FLUSH PRIVILEGES;
