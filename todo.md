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
- Use additional salt for obtaining the hash of the poll. (`Poseidon(SHA256(poll) % p, salt)`)
- Sybil attack clarification.