# zkVoting

**Anonymous Voting System** built on zkSNARKs.

## Deployed demos

- App: [reptillian-zkvoting.vercel.app](https://reptillian-zkvoting.vercel.app)
- API server: [reptillian-zkvoting-api.vercel.app](https://reptillian-zkvoting-api.vercel.app)
- Database: NeonDB database

# Running locally

## Requirements

- nodejs
- npm
- [circom](https://github.com/iden3/circom)
- snarkjs (`npm install -g snarkjs@latest`)

You can also use flakes via `nix develop`.

## Running Front-End

```sh
cd vite-project
npm install
npm run dev
```

## Setting up the Database

Run [/db/setup.sql](/db/setup.sql) in your postgress database.

## Running API

```sh
cd server
npm install
npx vercel dev --yes
```

Please also configure `/server/.env` using `/server/.env.base` (some fields can be automatically generated using vercel).

## Circuits

### Trusted setup:

- Repository: [privacy-ethereum/perpetualpowersoftau](https://github.com/privacy-ethereum/perpetualpowersoftau)
- Commit: `b077232729db7c9eb65b63c4aaaa0ac4a1b0bba2`
- Selected Powers of Tau: [`ppot_0080_14.ptau`](https://pse-trusted-setup-ppot.s3.eu-central-1.amazonaws.com/pot28_0080/ppot_0080_14.ptau)
- `sha256sum` checksum: `3ca1149e9349b22b0ee0649399cfb787677129b7b1189d1899fc0d615d9583db` 

Trusted setup should be placed in `/circuits/ppot_0080_14.ptau`.

### CircomLib

Some circuits are using [CircomLib](https://github.com/iden3/circomlib) library.

```sh
cd circuits
git clone https://github.com/iden3/circomlib.git
cd circomlib
git checkout 35e54ea21da3e8762557234298dbb553c175ea8d
```

Directory `/circuits` also contains its own separate `flake.nix`.

### Compiling

```sh
cd circuits
./compile_groth16.sh
```