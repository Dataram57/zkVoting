# zkVoting

**Anonymous Voting System** built on zkSNARKs.

## Deployed demos

- App: [reptillian-zkvoting.vercel.app](https://reptillian-zkvoting.vercel.app)
- API server: [reptillian-zkvoting-api.vercel.app](https://reptillian-zkvoting-api.vercel.app)
- Database: *Secret*

# Running locally

### Requirements

- nodejs + npm
- circom

You can also use flakes with `nix develop`.

### Running Front-End

```sh
cd vite-project
npm install
npm run dev
```

### Setting up the Database

Run [/db/setup.sql](/db/setup.sql) in your postgress database.

### Running API

```sh
cd server
npm install
npm run start
```

or via:

```sh
npx vercel dev --yes
```

### Compiling Circuits

```sh
cd circuits
nix develop
./compile_groth16.sh
```