# Testowanie Systemu przez Aplikacje

Testowanie Systemu przez Aplikacje polega na sprawdzeniu reakcji serwera na poprawne i niepoprawwne
- Definicje głosowania,
- Głosy.

Aby uruchomić test należy wykonać następujące polecenia:

```sh
cd vite-project
cd tests
cd server
npm install
npm run-script test
```

***Ważne:*** Testy wykorzystują gotowy napisany przez nas zestaw funkcji kryptograficznych `/vite-project/src/crypto.ts`. Nie testuje, ani nie podważa on systemu kryptograficznego.

# Ryzyka

## Kryptografia

### Kolizja Nullifikator'ów.

Każdy nullifikator przyjmuje wartości w prziedziale $ \langle 0, p - 1 \rangle$, gdzie $p$ jest równe:
```circom
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
```

Prawdopodobieństwo $P\left(n\right)$ że przy $n$ oddanych już głosach utworzy się zarejestrowany już nullifikator wynosi:

$$P\left(n\right)=1-\prod_{i=0}^{n-1}\left(1-\frac{i}{p}\right)$$

Co przy obecnej maksymalnej liczbie uczestników jest bardzo bliske $0$.

## Aplikacja / System

### Weryfikacja głosowania

Głosowanie aby było w pełni zweryfikowane wymaga wiedzy na temat wszystkich potrzebnych liści drzewa Merkle (reprezentującym ukrytych członków). Dlatego zależność miedzy przesyłem danych a liczbą głosujących jest liniowa.

### Weryfikacja wyników

Każdy głos jest nie agregowalny, dlatego aby uzyskać te same możliwe wyniki co ***System***, należy być w posiadaniu tych samych zebranych głosów. Zależność miedzy przesyłem danych a liczbą głosów jest liniowa.

## System

### Cenzura

Z perspektywy użytkownika serwer może bardzo łatwo usuwać głosy. Nie może ich jedynie modyfikować.

# Limity

## Kryptografia

### Maksymalna liczba uczestników głosowania.

Wynika ona z wysokości użytego drzewa Merkle, i przy obecnej wysokości `h = 8`, maksymalna liczba uczestników wynosi `2 ** h = 256`.

## System

Limity zawarte w `/server/api/config.ts`.

## Aplikacja

Limity zawarte w `/vite-project/src/config.ts`, oraz częściowo korzystają z `/server/api/config.ts` poprzez powiązanie symboliczne (Linux).

