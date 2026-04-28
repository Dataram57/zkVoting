# Deterministic ID

ID of a poll is a hash from:

```ts
{
    root : string,
    members : string[],
    description : string
}
```

This already guarantees strong security, but time required to expands with the number of `members`.

### Proposition

ID could be calculated from just a root and a description. Like this:

```ts
{
    root : string,
    description : string
}
```

This would make verification process splitted, and enable less "trustless" but faster verification of polls.

To fully verify the poll we would have to first check ID out of the content, and then try to compare merkle root derived from the fetched members, with the `root` given by the server.

```ts
calculated_root === root
```
