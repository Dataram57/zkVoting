
# Realizacja

Projekt udało nam się w pełni zrealizować.

## Schemat realizacji

![](./8.svg)

## Kryptografia - Systyem Głosowania

Do realizacji wymagań z tej sekcji wykorzystaliśmy technologie zkSNARK pozwalającą udowodnić znajomość wartości zachowujących między sobą odpowiednie relacje które traktujemy jako możliwość udowodnienia przeprowadzenia poprawnego przetwarzania danych z ich częściowym ujawnieniem. (tak zwane dowody zerowej wiedzy).
- ***Głos*** jest tak naprawde dowodem zerowej więdzy w którym to użytkownik udowadnia poprzez wprowadzone `merkle_leafs`, `privateKey`, `publicKey_index`, `invitation` że jego klucz publiczny pochodzi ze zbioru o odpowiednim korzeniu Merkle, reprezentującym zbiór kluczy publicznych członków głosowania. Dowód dodatkowo wiąże identyfikator głosowania, wartość głosu i dodatkowo udstępnia unikatowy ***nullifikator***.

Ponieważ zkSNARK'i nie pozwalają wprowadzać parametrów o zmiennej długości takich jak niczym nieograniczone łańcuchy znaków, to też głos w dowodzie reprezentuje skrót wartości którą chcemy powiązać a sama wartość jest oddzielna od tego dowodu.

### Wymagania

- [circom](https://github.com/iden3/circom) - Narzędzie do czytelnego definiowania układów.
- [snarkjs](https://github.com/iden3/snarkjs) - Narzędzie do zamiany układu R1CS na podprogramy i zestaw kluczy zkSNARK.
- [Powers of Tau](https://github.com/privacy-ethereum/perpetualpowersoftau)/ppot_0080_14.ptau (`sha256sum: 3ca1149e9349b22b0ee0649399cfb787677129b7b1189d1899fc0d615d9583db`) - specjalny zestaw tych samych sekretów o wielu wariantach potęg. ***Nie jest konieczne korzystanie z tego samego zestawu. Ceremonię potęg Tau można samemu wygenerować dla celów testowych, lecz nie zaleca się takich praktyk dla celów produkcyjnych***.

### Kompilacja

ZkSNARK'i wymagają wczesnej kompilacji dlatego wpierw przeprowadzamy konwersje układu na format R1CS przy pomocy narzędzia **circom** (w którym to przejrzyściej opisujemy nasz układ). Następnie przy pomocy narzędzia **snarkjs** zamieniamy nasz układ na zestaw programów i kluczy służących do szybszej generacji i weryfikacji dowodów.

```sh
circom vote.circom --r1cs --sym --wasm
snarkjs groth16 setup vote.r1cs ppot_0080_14.ptau vote_prover.zkey
snarkjs zkey export verificationkey vote_prover.zkey vote_verifier.json
```

W projekcie korzystamy z symoblicznych powiązań z których korzystają ***Aplikacja*** i ***System*** do użycia tych zamych skompilowanych pod programów. Skompilowane programy należy umieścić w `/circuits/public_deploy`.

Warto zaznaczyć że `/circuits/public_deploy` znajdują się już skompilowane zkSNARK'i na potrzeby produkcyjne.

## Aplikacja

Aplikacja realizujemy poprzez prostą aplikacje web'ową.

### Wymagania

- [npm](https://www.npmjs.com/) - służący do zainstalowania paczek i uruchomienia aplikacji.

### Uruchomienie

W terminalu należy wpisać:

```sh
cd vite-project
npm install
npm run dev
```

Aplikacje będzie dostępna lokalnie pod adresem `http://localhost:5173/`.

## System

System realizujemy poprzez serwer API i baze danych PostreSQL. Serwer API jest napisany języku TypeScript w formie niezależnych od siebie funkcji zwracających odpowiedzi na zapytania, wygodna pod środowiska serverless.

### Wymagania

- [npm](https://www.npmjs.com/) - służący do zainstalowania paczek i uruchomienia aplikacji.
- Baza danych PostgreSQL.

### Baza Danych

Tebele do bazy danych zdefiniowane są w skrypcie `/db/setup.sql`. Skrypt ten należy uruchomić w kontekście danej bazy danych.

### Uruchomienie Serwera API

Na początku należy zainstalować odpowiednie paczki.

```sh
cd server
npm install
```

Następnie należy skonfigurować plik `/server/.env` tak żeby zawierała potrzebne informacje do połączenia się z bazą danych i dla innych aspektów technicznych:

```env
# Recommended for most uses
DATABASE_URL=

# For uses requiring a connection without pgbouncer
DATABASE_URL_UNPOOLED=

# Parameters for constructing your own connection string
PGHOST=
PGHOST_UNPOOLED=
PGUSER=
PGDATABASE=
PGPASSWORD=

# Parameters for Vercel Postgres Templates
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
POSTGRES_URL_NO_SSL=
POSTGRES_PRISMA_URL=

# Cron job secret key
CRON_SECRET=
```

W naszej realizacji Serwer API dodatkowo usuwa głosowania starsze niż 3 dni.

Finalnie uruchomić jedną z poniższych komend. Rekomendujemy użycie pierwszej gdyż jak najlepiej odzwierciedla docelowe środowisko na którym chcieliśmy uruchomić nasz system. 

```sh
#????????????????????????????????   # Recommended!!!
# Testing with Vercel
npx vercel dev --yes
#::::::::::::::::::::::::::::::::
# Vercel-like tester
npx tsx test_server.js
```

Aplikacje będzie dostępna lokalnie pod adresem `http://localhost:3000`.


## Hosting Aplikacji

Wszystkie komponenty zostały dostosowane tak żeby były przyjazne dla prostych i tanich usług hostingowych. Cały projekt jest hostowany w serwisie Vercel i NeonDB w ramach darmowych usług.

### Aplikacja
- **Aplikacja**: [https://reptillian-zkvoting.vercel.app/](https://reptillian-zkvoting.vercel.app/)

### System
- **Serwer API**: [https://reptillian-zkvoting-api.vercel.app/](https://reptillian-zkvoting-api.vercel.app/) 
- **Baza danych**: *Pozostaje nie widoczna dla nie uprawnionych.*

> ***Nie gwarantujemy że wszystkie części projektu będą hostowane. Hosting jest darmowy i nie ma żadnego prywatnego wsparcia do dalszej pracy ani utrzymania.***

# Testy

jprd nie chce mi sie