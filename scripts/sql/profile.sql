CREATE TABLE IF NOT EXISTS user_profile (
    user_id      UUID PRIMARY KEY,
    display_name VARCHAR(64),
    avatar_url   TEXT,
    banner_url   TEXT,
    accent_color VARCHAR(16),
    CONSTRAINT fk_user_profile_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);