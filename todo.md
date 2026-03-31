# TODO

`vite-project`:
- Protection against async operations and destroyed pages.
- Checking if user has already casted a vote.
- User-friendly options defining and picking.
- Information on server's limits.
- Users can check if someone belongs to the poll.

`server`:
- Input checks
- Anti-spam checks:
    - IP based (3 polls per IP).
    - Bad actor prevention:
        - Proof of Work
        - Captcha
- Configuration with limits on poll.

`server` + `db`:
- Creation of a Poll automatically allocates memory for votes. 

Cryptography:
- Explanation on techniques used.
- Use additional salt for hashing to create/isolate sepearte domains.
- Use additional salt for obtaining the hash of the poll.
    - New constants:
        - `SALT_IDENTITY` - public, fixed, hardcoded constant
        - `SALT_POLL` - public, fixed, hardcoded constant
        - `SALT_LEAF` - public, fixed, hardcoded constant
        - `SALT_NULLIFIER_BASE` - public, fixed, hardcoded constant
        - `SALT_NULLIFIER` - public, fixed, hardcoded constant
    - Computation:
        - `publicKey = Poseidon(SALT_IDENTITY, privateKey)`
        - `pollId = SHA256(poll)` used for identifying and verifying polls on centralised server.
        - `pollHash = Poseidon(SALT_POLL, pollId % p)`)
        - `leaf = Poseidon(SALT_LEAF, publicKey, invitation)`
        - `merkleRoot = Poseidon(left, right) * bit + (1 - bit) * Poseidon(right, left)`
        - `identityNullifier = Poseidon(SALT_NULLIFIER_BASE, privateKey)`
        - `nullifier = Poseidon(SALT_NULLIFIER, identityNullifier, pollHash)`
- Sybil attack clarification.