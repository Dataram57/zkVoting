# TODO

`vite-project`:
- Checking if user has already casted a vote.
- User-friendly options defining and picking.
- Information on server's limits.
- Users can check if someone belongs to the poll.
- No empty public keys for making polls.

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
- Sybil attack clarification.
- `voteValue` to `vote` better mapping.