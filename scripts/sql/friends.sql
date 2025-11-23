CREATE TABLE IF NOT EXISTS friendship (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL,
    addressee_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_friendship_requester
        FOREIGN KEY (requester_id) REFERENCES users (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_friendship_addressee
        FOREIGN KEY (addressee_id) REFERENCES users (id)
            ON DELETE CASCADE,

    CONSTRAINT chk_friendship_not_self CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_friendship_pair_unordered
    ON friendship (
                   LEAST(requester_id, addressee_id),
                   GREATEST(requester_id, addressee_id)
        );