#!/usr/bin/env python3
"""
Buduje stronę LC Fotografia.

  src/pages/*.html   treść podstron (na górze każdej: komentarz z danymi strony w JSON)
  src/layout.html    wspólny szkielet <head> + nagłówek + stopka
  src/partials/      wspólne fragmenty, wstawiane jako {{> nazwa}}
  site.json          dane firmy (telefon, adres, miasto...), wstawiane jako {{klucz}}
  public/            pliki kopiowane bez zmian (css, js, zdjęcia, favicon)

Wynik trafia do dist/ — to ten folder wgrywasz na serwer.
Uruchom:  python3 build.py
"""
import datetime
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
PUBLIC = ROOT / "public"
DIST = ROOT / "dist"

NAV_KEYS = ["portfolio", "oferta", "omnie", "kontakt", "rezerwacja"]
META_RE = re.compile(r"^\s*<!--(.*?)-->", re.S)
INCLUDE_RE = re.compile(r"\{\{>\s*([\w-]+)\s*\}\}")
VAR_RE = re.compile(r"\{\{\s*([\w]+)\s*\}\}")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def include_partials(text: str) -> str:
    for _ in range(5):
        new = INCLUDE_RE.sub(lambda m: read(SRC / "partials" / f"{m.group(1)}.html"), text)
        if new == text:
            return new
        text = new
    return text


def fill_vars(text: str, ctx: dict, page: str) -> str:
    def repl(m):
        key = m.group(1)
        if key not in ctx:
            sys.exit(f"Błąd w {page}: brak wartości dla {{{{{key}}}}} (dodaj ją do site.json lub do danych strony)")
        return str(ctx[key])

    for _ in range(3):  # wartości mogą zawierać kolejne {{zmienne}}
        new = VAR_RE.sub(repl, text)
        if new == text:
            return new
        text = new
    return text


def schema_json(site: dict) -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": site["brand"],
        "description": f"Fotograf portretowy: portrety biznesowe i prywatne, sesje wizerunkowe, zdjęcia zespołów. {site['city']}.",
        "url": site["domain"] + "/",
        "telephone": site["phone"],
        "email": site["email"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": site["address_street"],
            "addressLocality": site["address_city"],
            "addressCountry": "PL",
        },
        "areaServed": site["city"],
        "sameAs": [site["instagram_url"], site["linkedin_url"]],
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"


def build() -> None:
    site = json.loads(read(ROOT / "site.json"))
    site["year"] = str(datetime.date.today().year)
    # Wersja testowa: false = Google nie indeksuje strony. Na starcie prawdziwej strony ustaw true.
    indexing = bool(site.pop("allow_indexing", True))
    layout = read(SRC / "layout.html")

    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(PUBLIC, DIST)

    pages = sorted((SRC / "pages").glob("*.html"))
    sitemap_urls = []
    for path in pages:
        raw = read(path)
        m = META_RE.match(raw)
        if not m:
            sys.exit(f"Błąd w {path.name}: brak komentarza z danymi strony na początku pliku")
        meta = json.loads(m.group(1))
        body = raw[m.end():].strip("\n")
        name = path.stem

        ctx = dict(site)
        ctx.update({
            "title": meta["title"],
            "description": meta["description"],
            "canonical": site["domain"] + ("/" if name == "index" else f"/{name}.html"),
            "book_href": meta.get("book_href", "rezerwacja.html"),
            "robots": '<meta name="robots" content="noindex">' if (meta.get("noindex") or not indexing) else "",
            "schema": schema_json(site) if name == "index" else "",
        })
        for key in NAV_KEYS:
            ctx[f"nav_{key}"] = ' aria-current="page"' if meta.get("nav") == key else ""

        html = layout.replace("{{content}}", body)
        html = html.replace("{{mobile_bar}}", "{{> mobilebar}}" if meta.get("mobile_bar", True) else "")
        html = html.replace("{{lightbox}}", "{{> lightbox}}" if meta.get("lightbox") else "")
        html = include_partials(html)
        html = fill_vars(html, ctx, path.name)
        (DIST / f"{name}.html").write_text(html, encoding="utf-8")

        if not meta.get("noindex"):
            sitemap_urls.append(ctx["canonical"])
        print(f"  {name}.html")

    today = datetime.date.today().isoformat()
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in sitemap_urls]
    sitemap.append("</urlset>")
    (DIST / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")
    if indexing:
        robots = f"User-agent: *\nAllow: /\n\nSitemap: {site['domain']}/sitemap.xml\n"
    else:
        robots = "User-agent: *\nDisallow: /\n"
    (DIST / "robots.txt").write_text(robots, encoding="utf-8")
    print(f"Gotowe: {len(pages)} stron w {DIST.relative_to(ROOT)}/"
          + ("" if indexing else "  (wersja testowa: ukryta przed Google, allow_indexing=false)"))


if __name__ == "__main__":
    build()
