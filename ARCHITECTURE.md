# Emil Chess Lab – Architektur für GitHub Pages

## Zielsystem

Next.js 15.5 mit App Router und TypeScript, statisch exportiert und ausschließlich über GitHub Pages ausgeliefert. Die Website wird im Repository-Wurzelverzeichnis gebaut; GitHub Actions veröffentlicht `out/`. Tailwind CSS, Zustand, Chess.js, React-Chessboard und Framer Motion bilden die UI-/Domänenschicht.

## Runtime-Regeln

- Der Browser verarbeitet PGNs, Brettzüge, Analyse und lokale Speicherung.
- Stockfish 19 Lite WASM liegt unter `public/engine/` und läuft in einem Web Worker. GitHub Pages kann keine COOP/COEP-Header setzen; deshalb ist die auf Pages unterstützte Engine Single-Thread. Tiefe, Hash und MultiPV sind einstellbar.
- PGNs und Analyseberichte werden lokal in IndexedDB gespeichert. Einstellungen wie Theme liegen im Local Storage. Es gibt keine Konten oder Synchronisierung.
- Chess.com-Profil und Partien werden als öffentliche Daten direkt vom Browser über die dokumentierte PubAPI geladen. Private Partien/Daten werden nicht abgerufen; PGN-Import bleibt der Fallback.
- Statischer Export unterstützt keine dynamischen API-Routen, Server Actions oder Datenbankzugriffe zur Laufzeit. PostgreSQL/Prisma, Cloud-Engine, Leela, KI-Dienste und geteilte Konten erfordern zusätzliche Hosting-Services und gehören nicht zu dieser GitHub-Pages-Version.

## Dateibaum

```text
.github/workflows/deploy-pages.yml
public/arcade.html
public/engine/{stockfish-19-lite-single.js,stockfish-19-lite-single.wasm,Copying.txt}
scripts/copy-stockfish.mjs
src/app/{layout.tsx,page.tsx,globals.css}
src/components/analysis-workspace.tsx
src/features/analysis/{grade.ts,report.ts}
src/features/chesscom/public-api.ts
src/features/engine/browser-stockfish.ts
src/features/openings/book.ts
src/features/pgn/pgn.ts
src/features/storage/local-store.ts
src/store/workspace-store.ts
tests/unit/
tests/e2e/
README.md
```

## Datenfluss

`PGN/öffentliche Partie → Chess.js validiert und navigiert → Zustand hält Brettzustand → Stockfish-Worker liefert Live-PVs und Scores → Analysemodul schätzt Züge/Genauigkeit und baut den Graph → IndexedDB speichert Partie und Bericht`.

## Ausbaustand

**Umgesetzt:** responsives Drag-and-drop-Brett, Brett drehen, hell/dunkel, PGN-Text-/Dateiimport und -Export, Zugnavigation per Tastatur, Zugkommentare, Live-MultiPV-Engine, Tiefe/Hash, Suche und Auswahl öffentlicher Chess.com-Partien, Halbzuganalyse, heuristische Zugklassen, Genauigkeit nach Spielphase, Bewertungsgraph, Link-Teilen und Druck/PDF-Ansicht; Wiederherstellung lokaler Analysen.

**Weitere Ausbauschritte:** vollständiger Variantenbaum, NAG-Editor, erweiterte ECO-Datenbank, bessere Kritische-Momente-Berichte, Pfeile/Feldmarkierungen, Taktikerkennung sowie mobiler und barrierefreier Feinschliff.

Die „Brilliant“-Markierung ist eine eigene Näherung aus Engine-Bestzug plus Opferheuristik. Sie ist nicht Chess.coms private Klassifikation. Genauigkeitswerte sind transparente Näherungen und nicht Chess.com CAPS.

