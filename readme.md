# zkVoting

- [App (vercel)](https://zk-voting-two.vercel.app/)
- [Api (Render)](https://zkvotingapi.onrender.com)
- DB is secret

# Running

```
nix develop
```

### Front-End

```sh
cd vite-project
npm install
npm run dev
```

### API

```sh
cd server
npm install
npm run start
```

### Database

postgres.

### Compiling Circuits

```sh
cd circuits
nix develop
./compile_groth16.sh
```