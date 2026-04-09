# Projekt

Celem projektu było stworzenie aplikacji do tworzenia głosowań które oferowały by anonimowość i jak najmniejszy brak konieczności zaufania do dowolnej strony.

## Działanie

- Każdy użytkownik może stworzyć parę kluczy publicznego i prywatnego.
- Każdy użytkownik na podstawie kluczy publicznych zebranych od wybranych użytkowników może stworzyć głosowanie w którym właściciele przypisanych kluczy publicznych mają prawo do głosowania.
    - Otrzymuje on deterministyczny identyfikator głosowania, który później może podesłać innym użytkownikom w celu oddania głosu lub weryfikacji głosowania i wyników.
    - Możliwe jest dodatkowe ukrywanie uczestników głosowania poprzez przypisanie uczestnikom dodatkowych kodów (zaproszeń).
- Dla danego głosowania każdy przypisany właściciel klucza publicznego ma prawo oddać głos tylko raz niezależnie od bycia przypisanym kilku krotnie lub stworzenia kilku głosów.

## Mechanika

### Deterministyczny Identyfikator

Każdemu głosowaniu można przypisać identyfikator na podstawie przypisanych do niego członków i opisie głosowania. Identyfikator ten jest hashem z tych informacji, co umożliwia nie zaprzeczalność .

### Głos

Każdy głos jest oparty na dowodach zerowej wiedzy które udowadniają następujęca informacje:
- Twórca głosu jest właścicielem klucza publicznego który został przypisany do danego głosowania.
- Zaproponowany nullifikator jest jedynym możliwym do stworzenia przez tego właściciela klucza publicznego dla danego głosowania.
- Głos jest wiążący z tym dowodem.

Aby zrealizować dowód zerowej korzystamy z technologi zkSNARK, funkcji skrótu Poseidon (informacja 1 i 2) i dowodu Merkle Proof dla struktóry Merkle Tree (informacja 1).

# Realizacja

Projekt udało nam się w pełni zrealizować. Jest on skonstruowany z 3 elementów.

- Aplikacja dla użytkowników w formie strony internetowej. (Hostowana przez Vercel)
- Serwis API w formie zestawu serwisów serverless. (Hostowana przez Vercel)
- Baza danych PostgreSQL. (Hostowana przez NeonDB w ramach serwisu Vercel)




