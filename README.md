# LC Fotografia — strona internetowa

Statyczna strona (HTML, CSS, JavaScript) bez frameworków i bez bazy danych.
Działa na każdym hostingu, który serwuje zwykłe pliki (np. Netlify, Cloudflare Pages, GitHub Pages, zwykły hosting z FTP).

## Struktura

```
site.json          dane firmy: telefon, e-mail, adres, miasto, NIP, linki
build.py           składa strony z szablonów → folder dist/
src/layout.html    wspólny <head>, nagłówek i stopka dla wszystkich stron
src/partials/      fragmenty używane w wielu miejscach (menu, stopka, formularze, logotypy)
src/pages/         treść poszczególnych podstron
public/            pliki kopiowane bez zmian: css/, js/, img/, favicon.svg
dist/              GOTOWA STRONA — to wgrywasz na serwer (generowana, nie edytuj ręcznie)
```

## Praca ze stroną

1. Zmień tekst w `src/pages/…` albo dane w `site.json`.
2. Uruchom `python3 build.py` (wymaga tylko Pythona 3, bez instalowania pakietów).
3. Otwórz `dist/index.html` w przeglądarce.

Wszystko w `[nawiasach kwadratowych]` to miejsca do uzupełnienia.
Szybkie sprawdzenie, co jeszcze zostało:  `grep -rn "\[" site.json src/pages`

## Zdjęcia

Szare sylwetki to zastępcze pliki SVG w `public/img/placeholders/`.

- Wrzuć prawdziwe zdjęcia do `public/img/` (np. `public/img/portfolio/zespol-01.jpg`).
- Podmień `src="…"` w HTML i ustaw prawdziwe `width` i `height` pliku.
- W galeriach (`class="g-item"`) zmień też `href` (duża wersja w podglądzie) i `style="--r:…"`,
  czyli proporcję szerokość/wysokość (4:5 → `.8`, 3:2 → `1.5`, 2:3 → `.6667`).
  Skrypt i tak poprawi proporcję po wczytaniu zdjęcia, ale wpisana wartość zapobiega skakaniu układu.
- Zawsze uzupełnij `alt`: krótki opis zdjęcia, np. „Portret prezes kancelarii X w studiu”.
- Eksport: dłuższy bok 2000 px, JPG lub WebP, jakość ok. 80%, najlepiej poniżej 400 KB.
  Miniatury w galerii mogą mieć 1200 px.
- Publikuj tylko zdjęcia osób, które wyraziły na to zgodę (art. 81 prawa autorskiego).

Kategorie portfolio to atrybut `data-cat` (`biznesowe`, `wizerunkowe`, `prywatne`, `zespoly`, `zarzad`, `w-pracy`).
Jedno zdjęcie może mieć kilka kategorii: `data-cat="zespoly w-pracy"`.
Adres kategorii: `portfolio.html#zespoly`.

## Formularz kontaktowy

Strona nie ma własnego serwera, więc wiadomości wysyła zewnętrzna usługa.
Najprościej: Formspree (darmowy plan na start).

1. Załóż formularz na formspree.io i skopiuj adres w stylu `https://formspree.io/f/abcdwxyz`.
2. Wklej go w `site.json` → `"form_endpoint"` i zbuduj stronę.
3. Wyślij próbną wiadomość.

Bez tego adresu formularz pokazuje prośbę o telefon lub e-mail.
Formularz rezerwacji jest na osobnej stronie `rezerwacja.html`; `kontakt.html` ma dane kontaktowe i mapę.
Formspree jest firmą z USA. Dopisz ją w polityce prywatności albo wybierz usługę z UE.
Na Netlify można zamiast tego użyć wbudowanych Netlify Forms.

## Przed startem strony

- [ ] Uzupełnij `site.json` (w tym `domain`, potrzebne do mapy strony i Google).
- [ ] Mapa na stronie Kontakt: teraz pokazuje zastępczy adres (Rynek, Wrocław). W Mapach Google: Udostępnij → Umieść mapę, skopiuj adres z `src="…"` do `maps_embed_url` w `site.json`.
- [ ] Podmień zdjęcia, logotypy klientów i opinie.
- [ ] Przeczytaj teksty: oferta, FAQ i „Jak pracuję” to propozycje do poprawienia.
- [ ] Ustaw adres formularza (wyżej).
- [ ] Polityka prywatności: uzupełnij i najlepiej pokaż prawnikowi.
- [ ] Czcionka na własnym serwerze (RODO): pobierz Instrument Sans (latin + latin-ext, woff2,
      np. z gwfh.mranftl.com) do `public/fonts/`, odkomentuj blok `@font-face` na górze
      `public/css/style.css` i usuń linki do Google w `src/partials/fonts.html`.
- [ ] Ustaw stronę 404 na serwerze (`404.html`) i dodaj stronę do Google Search Console z plikiem `sitemap.xml`.
- [ ] Opcjonalnie: obrazek do udostępnień (1200×630 px) i znacznik `og:image` w `src/layout.html`.

## Hosting testowy

`site.json` → `"allow_indexing": false` ukrywa stronę przed Google na czas testów. Na starcie zmień na `true`.

- Najszybciej: zbuduj stronę i przeciągnij folder `dist` na app.netlify.com/drop. Załóż darmowe konto, żeby strona nie zniknęła.
- Na stałe: GitHub Pages z gałęzi `gh-pages` (https://jjcader.github.io/lc-fotografia/).
  Po zmianach: `git push`, a potem `sh publish.sh`, który buduje stronę i wrzuca `dist/` na gałąź `gh-pages`.
  Ustawienie: Settings → Pages → Deploy from a branch → `gh-pages`, `/ (root)`. Darmowe konto wymaga publicznego repozytorium.
- Plik `.github/workflows/deploy.yml` (publikacja przez GitHub Actions) jest teraz uruchamiany tylko ręcznie, bo konto ma blokadę Actions.
- Prywatne repozytorium: podłącz je do Netlify, ustawienia są w `netlify.toml`.

## Układ na telefonie

Poniżej 720 px strona przechodzi w gęstszy układ: przyciski nad zdjęciami w pierwszym ekranie,
pasek trzech mniejszych portretów przewijany w bok, usługi jako wiersze z miniaturą,
opinie przewijane w bok i przycisk „Zarezerwuj sesję” przyklejony do dołu ekranu
(chowa się, gdy formularz jest widoczny). Style telefonu są na końcu `public/css/style.css`.
