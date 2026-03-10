# Lexikon-Roman

A website for *Lexikon einer sentimentalen Reise zum Exporteurtreffen in Druden – Roman* by Austrian writer Andreas Okopenko — an interactive hypertext novel structured as alphabetically-ordered encyclopedia entries linked to one another.

This is the second revision of [ELEX](https://www.essl.at/bibliogr/elex.html), a multimedia edition originally created in the 1990s, now rebuilt from scratch more than three decades later.

[Visit the website](https://lexikonroman.at)

## Getting Started

Install dependencies:

```bash
bun install
```

Start the development server on `http://localhost:3000`:

```bash
bun run dev
```

## Content

Chapter source files live in `pug-to-md/views/chapters/*.pug`. The pipeline converts them to Markdown for Nuxt Content. **Do not edit `content/artikel/` directly** — regenerate it from Pug sources instead:

```bash
bun run generate:content
```

## Build

```bash
bun run build
```

## People

- **Eldar Sadykov** — Programmer / media artist
- **Franz Nahrada** — Social researcher, one of the original creators of ELEX
- **Karlheinz Essl** — Composer / media artist, one of the original creators of ELEX

## Contact

[info@eldarsadykov.com](mailto:info@eldarsadykov.com)
