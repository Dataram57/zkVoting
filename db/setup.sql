CREATE TABLE polls (
    id TEXT PRIMARY KEY,                  -- hash of request body
    description TEXT NOT NULL,
    merkle_root TEXT NOT NULL,            -- latest merkle root for verification
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE poll_members (
    poll_id TEXT REFERENCES polls(id) ON DELETE CASCADE,
    leaf TEXT NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (poll_id, position)
);

CREATE TABLE votes (
    poll_id TEXT REFERENCES polls(id) ON DELETE CASCADE,
    nullifier TEXT NOT NULL,              -- prevents double voting
    vote_value TEXT NOT NULL,             -- the actual vote (or encrypted vote)
    proof JSONB NOT NULL,                 -- zk-proof as JSON (or serialized TEXT)
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (poll_id, nullifier)
);