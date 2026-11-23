# Emil Chess Lab

Statische Next.js-15-Schachanalyse für GitHub Pages. Engine-Berechnung, Spielstände und Einstellungen sind für den Browserbetrieb ausgelegt; es wird kein Serverkonto benötigt.

## Lokal starten

Benötigt Node.js 20.9 oder neuer.

```bash
npm ci
npm run dev
```

Öffne danach http://localhost:3000.

## GitHub Pages

Der GitHub-Actions-Workflow baut die Next.js-App als statischen Export. In den Repository-Einstellungen muss Pages auf **GitHub Actions** zeigen. Das Repository muss `EmilWebsite` heißen oder die Variable `GITHUB_REPOSITORY` gibt den Unterpfad an.

```bash
npm run build
```

Der Workflow im Repository-Wurzelverzeichnis baut `out/` und veröffentlicht den statischen Export. Stelle unter **Settings → Pages** die Quelle auf **GitHub Actions**. Das Projekt muss im Repository-Wurzelverzeichnis liegen, damit der Workflow erkannt wird. API-Routen, Server Actions, Prisma/PostgreSQL und Konten sind mit rein statischem Pages-Hosting nicht verfügbar. Lokale Daten werden in IndexedDB gespeichert.

## Aktueller Ausbaustand

Enthalten sind das responsive Drag-and-drop-Analysebrett, PGN-Text-/Dateiimport und -Export, Halbzugnavigation, Live-Stockfish 19 Lite (lokal gehosteter Single-Thread Worker), einstellbare Tiefe/Hash/MultiPV, öffentliche Chess.com-Profil-/Partiesuche, vollständige Engine-Auswertung mit geschätzten Zugklassen, Genauigkeit nach Spielphase und ein klickbarer Bewertungsverlauf. Letzte Partie und Analyse bleiben in IndexedDB; die Darstellung unterstützt hell/dunkel.

Die „Brilliant“-Markierung ist eine ausdrücklich eigene Heuristik, keine Chess.com-Bewertung. Die ECO-Erkennung kennt derzeit nur einige Hauptvarianten. Variantenbaum und NAG-Editor, vollständige Eröffnungsdatenbank sowie fortgeschrittene Kritische-Momente-Berichte sind nächste Ausbauschritte. Kommentare, Link-Teilen und Druck/PDF-Ansicht sind enthalten.

GitHub Pages ist rein statisch: Es gibt hier bewusst keine PostgreSQL/Prisma-Datenbank, Konten, serverseitigen API-Routen, Cloud-Engine oder KI-Erklärungen. Nutzerprofile und Partien werden nur öffentlich und direkt im Browser abgefragt.

## Lizenzhinweise

Stockfish.js ist GPL-3.0; die Lizenz liegt in `public/engine/Copying.txt`. Quellcode: [nmrugg/stockfish.js](https://github.com/nmrugg/stockfish.js). Chess.js ist BSD-2-Clause. React-Chessboard und Framer Motion sind MIT lizenziert. Prüfe die Lizenztexte der konkreten npm-Pakete vor einer öffentlichen Weiterverwendung.

