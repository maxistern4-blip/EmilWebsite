"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Move } from "chess.js";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileUp, Printer, RotateCcw, RotateCw, Share2, Undo2 } from "lucide-react";
import { evaluateLoss, type MoveGrade } from "@/features/analysis/grade";
import { BrowserStockfish, type EngineLine } from "@/features/engine/browser-stockfish";
import { clearLastAnalysis, readComments, readLastAnalysis, readLastPgn, saveComments, saveLastAnalysis, saveLastPgn } from "@/features/storage/local-store";
import { fetchPublicGames, type ChessComGame, type ChessComProfile } from "@/features/chesscom/public-api";
import { detectOpening, isKnownBookMove } from "@/features/openings/book";
import { useWorkspace } from "@/store/workspace-store";
import { extractComments, exportPgn as serializePgn, parsePgn, readPgnFile } from "@/features/pgn/pgn";
import { summarizeGrades } from "@/features/analysis/report";

export function AnalysisWorkspace() {
  const { fen, pgn, selectedPly, setFen, setPgn, setPly } = useWorkspace();
  const [game, setGame] = useState(() => new Chess());
  const [flipped, setFlipped] = useState(false);
  const [lightTheme,setLightTheme]=useState(false);
  const [status, setStatus] = useState("PGN einfügen oder eine Partie auf dem Brett beginnen.");
  const [moves, setMoves] = useState<Move[]>([]);
  const [depth, setDepth] = useState(12);
  const [hashSize,setHashSize]=useState(64); const [multiPv,setMultiPv]=useState(3);
  const [engineOn, setEngineOn] = useState(false);
  const [liveReady,setLiveReady]=useState(false);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [evaluation, setEvaluation] = useState("0.00");
  const [line, setLine] = useState("Engine bereit, sobald du Analyse startest.");
  const [analysis, setAnalysis] = useState<MoveGrade[]>([]);
  const [comments,setComments]=useState<Record<number,string>>({});
  const [variations, setVariations] = useState<EngineLine[]>([]);
  const [tab, setTab] = useState<"moves" | "report">("moves");
  const [username,setUsername]=useState(""); const [profile,setProfile]=useState<ChessComProfile|null>(null); const [publicGames,setPublicGames]=useState<ChessComGame[]>([]); const [profileLoading,setProfileLoading]=useState(false);
  const engineRef = useRef<BrowserStockfish | null>(null);
  const engineConfig = useRef({ fen, depth, hashSize, multiPv });
  engineConfig.current = { fen, depth, hashSize, multiPv };
  useEffect(()=>{setLightTheme(localStorage.getItem("emil-chess-theme")==="light")},[]);
  useEffect(()=>{localStorage.setItem("emil-chess-theme",lightTheme?"light":"dark")},[lightTheme]);
  const history = game.history({ verbose: true });

  const selectPly = useCallback((ply: number) => {
    const replay = new Chess();
    const allMoves = game.history({ verbose: true });
    for (let i = 0; i < Math.min(ply, allMoves.length); i++) replay.move(allMoves[i]);
    setGame(replay); setFen(replay.fen()); setPly(ply);
  }, [game, setFen, setPly]);

  const onDrop = useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare) return false;
    try {
      const next = new Chess(fen);
      next.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      const nextPgn = next.pgn();
      setGame(next); setFen(next.fen()); setPgn(nextPgn);
      setMoves(next.history({ verbose: true })); setPly(next.history().length);
      void saveLastPgn(nextPgn); setStatus("Zug gespielt.");
      return true;
    } catch { return false; }
  }, [fen, setFen, setPgn, setPly]);

  const loadPgn = useCallback(async (text: string, restoring = false) => {
    try {
      const next = parsePgn(text);
      const parsedMoves = next.history({ verbose: true }); const normalized = next.pgn();
      setGame(next); setFen(next.fen()); setPgn(normalized); setMoves(parsedMoves);
      setPly(parsedMoves.length); setAnalysis([]); setComments(extractComments(next)); if(!restoring){await clearLastAnalysis();setComments(extractComments(next));await saveComments(extractComments(next));} await saveLastPgn(normalized);
      setStatus(`${parsedMoves.length} Halbzüge geladen.`);
    } catch { setStatus("PGN konnte nicht gelesen werden. Bitte prüfe die Züge."); }
  }, [setFen, setPgn, setPly]);

  useEffect(() => {
    if (!engineOn) return;
    let cancelled = false;
    setLiveReady(false); setStatus("Stockfish WASM wird geladen …");
    const engine = new BrowserStockfish((info) => {
      if (cancelled) return;
      setVariations((current) => [...current.filter((item) => item.multipv !== info.multipv), info].sort((a, b) => a.multipv - b.multipv));
      if (info.multipv === 1) {
        const turn = new Chess(useWorkspace.getState().fen).turn();
        const whiteScore = turn === "w" ? info.score : -info.score;
        setEvaluation(info.mate ? `#${info.mateIn??"?"}` : `${whiteScore >= 0 ? "+" : ""}${(whiteScore / 100).toFixed(2)}`);
        setLine(info.pv || "Berechne Variante …");
      }
    });
    engineRef.current = engine;
    void engine.start().then(() => {
      if (cancelled) return;
      engine.configure(engineConfig.current.hashSize,engineConfig.current.multiPv); setStatus("Stockfish läuft · Single-Thread WASM"); setLiveReady(true);
    }).catch(() => { setStatus("Stockfish konnte nicht geladen werden. Prüfe deine Internetverbindung."); setLiveReady(false); setEngineOn(false); });
    return () => { cancelled = true; engine.stop(); engine.dispose(); engineRef.current = null; };
  }, [engineOn]);

  useEffect(() => { if (engineOn && liveReady && engineRef.current) {engineRef.current.configure(hashSize,multiPv);engineRef.current.analyze(fen, depth);} }, [fen, depth, hashSize, multiPv, engineOn, liveReady]);

  const loadProfile=async()=>{setProfileLoading(true);setStatus("Lade öffentliche Chess.com-Partien …");try{const result=await fetchPublicGames(username);setProfile(result.profile);setPublicGames(result.games);setUsername(result.profile.username);setStatus(`${result.games.length} öffentliche Partien geladen.`)}catch(error){setStatus(error instanceof Error?error.message:"Chess.com konnte nicht erreicht werden. Du kannst PGN direkt importieren.")}finally{setProfileLoading(false)}};

  const startAnalysis = useCallback(() => {
    setVariations([]); setLiveReady(false); setEngineOn(true); setLine("Stockfish WASM Worker startet …");
  }, []);

  const runFullAnalysis = useCallback(async () => {
    if (!pgn) { setStatus("Importiere zuerst eine vollständige PGN-Partie."); return; }
    let source:Chess;
    try { source = parsePgn(pgn); } catch { setStatus("Die PGN ist ungültig."); return; }
    const allMoves = source.history({ verbose: true });
    if (!allMoves.length) { setStatus("Die PGN enthält keine Züge."); return; }
    setAnalysisRunning(true); setAnalysis([]); setStatus("Stockfish analysiert jeden Halbzug …");
    const analyzer = new BrowserStockfish(() => {}); const replay = new Chess(); const grades: MoveGrade[] = [];
    try {
      await analyzer.start();
      for (let i = 0; i < allMoves.length; i++) {
        const move = allMoves[i]; const beforeFen=replay.fen(); const before = await analyzer.search(beforeFen, Math.min(depth, 14));
        replay.move(move); const after = await analyzer.search(replay.fen(), Math.min(depth, 14));
        const grade = evaluateLoss(before.score, -after.score, i + 1);
        const bestMove = before.pv.split(" ")[0] || ""; const playedMove = move.from + move.to + (move.promotion || "");
        const isBest=bestMove===playedMove; const pieceType=new Chess(beforeFen).get(move.from)?.type;
        const opponentCanTakeSacrifice=pieceType!=="p"&&replay.moves({verbose:true}).some((reply)=>reply.to===move.to&&!!reply.captured);
        if(isKnownBookMove(source.history(),i)) grade.kind="book";
        else if(isBest&&grade.loss<25&&opponentCanTakeSacrifice) grade.kind="brilliant";
        else if(isBest&&grade.loss<20) grade.kind="best";
        else if(!isBest&&grade.loss<15) grade.kind="excellent";
        else if(grade.loss<50) grade.kind="great";
        grade.bestMove = bestMove; grade.playedMove = playedMove;
        grade.accuracy = Math.max(0, Math.min(100, 100 * Math.exp(-grade.loss / 320)));
        grade.evaluation=replay.turn()==="w"?after.score:-after.score; grade.side=move.color; grade.phase=i<20?"opening":replay.board().flat().filter(Boolean).length<=12?"endgame":"middlegame";
        grades.push(grade); setAnalysis([...grades]);
        setStatus(`Analysiere Halbzug ${i + 1}/${allMoves.length} · ${grade.kind} · ${grade.loss} cp Verlust`);
      }
      await saveLastAnalysis(grades); setStatus("Partieanalyse abgeschlossen.");
    } catch { setStatus("Stockfish konnte die Partieanalyse nicht abschließen."); }
    finally { analyzer.dispose(); setAnalysisRunning(false); }
  }, [depth, pgn]);

  const doUndo = () => {
    const next = new Chess(fen); next.undo(); setGame(next); setFen(next.fen());
    setMoves(next.history({ verbose: true })); setPly(next.history().length); setPgn(next.pgn());
  };
  const exportPgn = () => {
    const url = URL.createObjectURL(new Blob([serializePgn(pgn||game.pgn(),comments)], { type: "application/x-chess-pgn" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "partie.pgn"; anchor.click(); URL.revokeObjectURL(url);
  };
  const shareAnalysis=async()=>{const url=new URL(window.location.href);url.searchParams.set("pgn",serializePgn(pgn||game.pgn(),comments));try{await navigator.clipboard.writeText(url.toString());setStatus("Link mit PGN in die Zwischenablage kopiert.")}catch{setStatus("Teilen nicht möglich. Kopiere die PGN über den Export-Button.")}};
  const updateComment=(value:string)=>{const next={...comments,[selectedPly]:value};setComments(next);void saveComments(next)};
  const handleFile = async (file?: File) => { if (file) await loadPgn(await readPgnFile(file)); };
  useEffect(()=>{void (async()=>{const shared=new URLSearchParams(window.location.search).get("pgn");if(shared){await loadPgn(shared,true);return}const [savedPgn,savedAnalysis,savedComments]=await Promise.all([readLastPgn(),readLastAnalysis<MoveGrade[]>(),readComments()]);if(savedPgn){await loadPgn(savedPgn,true);setComments(Object.keys(savedComments).length?savedComments:extractComments(parsePgn(savedPgn)));if(savedAnalysis)setAnalysis(savedAnalysis)}})()},[loadPgn]);

  useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.target instanceof HTMLElement&&["INPUT","TEXTAREA","SELECT"].includes(event.target.tagName))return;if(event.key==="ArrowLeft"){event.preventDefault();selectPly(Math.max(0,selectedPly-1))}else if(event.key==="ArrowRight"){event.preventDefault();selectPly(Math.min(moves.length,selectedPly+1))}else if(event.key==="Home"){event.preventDefault();selectPly(0)}else if(event.key==="End"){event.preventDefault();selectPly(moves.length)}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[selectedPly,moves.length,selectPly]);
  const report=summarizeGrades(analysis);
  const opening=detectOpening(game.history());
  const graphPoints=analysis.map((item,index)=>({x:16+(index/Math.max(1,analysis.length-1))*568,y:76-Math.max(-5,Math.min(5,(item.evaluation??0)/100))*12,score:item.evaluation??0,ply:item.ply}));
  const graphPath=graphPoints.map((point,index)=>`${index?"L":"M"}${point.x},${point.y}`).join(" ");

  return (
    <main className={`app-shell ${lightTheme?"light":""}`} >
      <header className="topbar">
        <div className="brand"><span className="brand-mark">♞</span><span>Emil Chess Lab</span></div>
        <nav className="top-actions">
          <a className="button optional" href="arcade.html">Spiele-Arcade</a>
          <button className="button optional" onClick={() => setLightTheme((value)=>!value)}>{lightTheme?"Dunkel":"Hell"}</button>
          <button className="button" onClick={() => setFlipped(!flipped)}>Brett drehen</button>
          <button className="button optional" onClick={()=>window.print()}><Printer size={15}/> PDF</button>
          <button className="button optional" onClick={()=>void shareAnalysis()}><Share2 size={15}/> Teilen</button>
          <button className="button primary" onClick={exportPgn}><Download size={15} /> PGN</button>
        </nav>
      </header>
      <section className="workspace">
        <div className="page-heading">
          <div><h1>Schach-Analyse</h1><p>Deine Partien. Deine Erkenntnisse. Direkt in deinem Browser.</p></div>
          <button className="button" onClick={() => { const fresh = new Chess(); setGame(fresh); setFen(fresh.fen()); setMoves([]); setPgn(""); setAnalysis([]); setComments({}); void saveComments({}); void clearLastAnalysis(); setPly(0); setStatus("Neue Partie gestartet."); }}> <RotateCcw size={14} /> Neue Partie</button>
        </div>
        <div className="workspace-grid">
          <motion.section className="panel board-panel" layout>
            <div className="board-top"><span>{history.length ? `Zug ${Math.ceil(history.length / 2)}` : "Startstellung"}</span><span>{opening?`${opening.name} · ECO ${opening.eco}`:"♔ Weiß · ♚ Schwarz"}</span></div>
            <div className="board-frame"><Chessboard options={{ position: fen, onPieceDrop: onDrop, boardOrientation: flipped ? "black" : "white", allowDragging: true, showNotation: true, animationDurationInMs: 160, darkSquareStyle: { backgroundColor: "#77916f" }, lightSquareStyle: { backgroundColor: "#e8e4d5" } }} /></div>
            <div className="board-bottom"><span>{game.isCheck() ? "Schach!" : game.isGameOver() ? "Partie beendet" : game.turn() === "w" ? "Weiß am Zug" : "Schwarz am Zug"}</span>
              <div className="top-actions"><button aria-label="Zug zurück" className="button" disabled={!history.length} onClick={doUndo}><Undo2 size={15} /></button><button aria-label="Vorwärts" className="button" disabled={selectedPly >= moves.length} onClick={() => selectPly(Math.min(selectedPly + 1, moves.length))}><RotateCw size={15} /></button></div>
            </div>
          </motion.section>
          <motion.aside className="panel analysis-panel" layout>
            <div className="tabs"><button className={`tab ${tab === "moves" ? "active" : ""}`} onClick={() => setTab("moves")}>Züge & Engine</button><button className={`tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>Bericht</button></div>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="engine-box">
                <div className="engine-heading"><span>{tab === "moves" ? "Stockfish · Browser Engine" : "Partieübersicht"}</span><strong className="eval">{evaluation}</strong></div>
                {tab === "moves" ? (
                  <>
                    <div className="engine-line">{line}</div>
                    {variations.map((variant) => <div className="engine-line" key={variant.multipv}><span className="hint">{variant.multipv} · Tiefe {variant.depth} · {variant.mate ? `Matt in ${variant.mateIn??"?"}` : (variant.score / 100).toFixed(2)}</span>　{variant.pv}</div>)}
                    <div className="engine-settings"><label htmlFor="depth">Tiefe</label><select id="depth" value={depth} onChange={(event) => setDepth(Number(event.target.value))}><option value={8}>8 · Schnell</option><option value={12}>12 · Normal</option><option value={16}>16 · Tief</option><option value={20}>20 · Sehr tief</option></select><label htmlFor="multipv">PV</label><select id="multipv" value={multiPv} onChange={(event)=>setMultiPv(Number(event.target.value))}><option value={1}>1</option><option value={3}>3</option><option value={5}>5</option></select><label htmlFor="hash">MB</label><select id="hash" value={hashSize} onChange={(event)=>setHashSize(Number(event.target.value))}><option value={32}>32</option><option value={64}>64</option><option value={128}>128</option></select>
                      <button className="button primary" onClick={() => { if (engineOn) { engineRef.current?.stop(); setLiveReady(false); setEngineOn(false); setStatus("Analyse pausiert."); } else startAnalysis(); }}>{engineOn ? "Analyse stoppen" : "Analyse starten"}</button>
                    </div>
                  </>
                ) : (
                  <>
                    {analysis.length>1&&<div className="eval-graph"><div className="profile-title"><b>Bewertungsverlauf</b><span>Weiß aus Sicht der Engine · Klick auf Linie springt zum Zug</span></div><svg viewBox="0 0 600 100" role="img" aria-label="Bewertungsverlauf" onClick={(event)=>{const rect=event.currentTarget.getBoundingClientRect();const ratio=(event.clientX-rect.left)/rect.width;selectPly(Math.max(1,Math.min(analysis.length,Math.round(ratio*(analysis.length-1))+1)))}}><line x1="12" y1="76" x2="588" y2="76" stroke="#64736a" strokeDasharray="4 5"/><path d={graphPath} fill="none" stroke="#a6d27c" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>{graphPoints.map(point=><circle key={point.ply} cx={point.x} cy={point.y} r="3" fill="#d8edbd"><title>{`Halbzug ${point.ply}: ${(point.score/100).toFixed(2)}`}</title></circle>)}</svg></div>}
                    <div className="report-grid"><div className="stat-card"><small>Genauigkeit · Schätzung</small><b>{report.accuracy}</b></div><div className="stat-card"><small>Weiß</small><b>{report.white}</b></div><div className="stat-card"><small>Schwarz</small><b>{report.black}</b></div><div className="stat-card"><small>Eröffnung</small><b>{report.opening}</b></div><div className="stat-card"><small>Mittelspiel</small><b>{report.middlegame}</b></div><div className="stat-card"><small>Endspiel</small><b>{report.endgame}</b></div><div className="stat-card"><small>Fehler & Patzer</small><b>{report.mistakes}</b></div><div className="stat-card"><small>Ungenauigkeiten</small><b>{report.inaccuracies}</b></div></div>
                    <button className="button primary" disabled={analysisRunning || engineOn || !pgn} onClick={() => void runFullAnalysis()}>{analysisRunning ? "Analyse läuft …" : "Vollständige Partie analysieren"}</button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <form className="import-row chess-profile-row" onSubmit={(event)=>{event.preventDefault();void loadProfile()}}><input aria-label="Chess.com Benutzername" placeholder="Chess.com-Benutzername" value={username} onChange={(event)=>setUsername(event.target.value)}/><button className="button" disabled={profileLoading}>{profileLoading?"Lädt …":"Profil suchen"}</button></form>
            {profile&&<div className="profile-results"><div className="profile-title"><b>{profile.username}</b><span>{publicGames.length} öffentliche Partien · letzte 4 Monate</span></div>{publicGames.length?publicGames.map((item,index)=>{const playedAsWhite=item.white.username.toLowerCase()===profile.username.toLowerCase();const opponent=playedAsWhite?item.black:item.white;const result=playedAsWhite?item.white.result:item.black.result;return <button className="profile-game" key={item.url+index} onClick={()=>void loadPgn(item.pgn)}><span><b>{opponent.username}</b><small>{new Date(item.end_time*1000).toLocaleDateString("de-DE")} · {item.time_class??"Schach"}</small></span><strong>{result}</strong></button>}):<span className="hint">Keine öffentlichen Partien gefunden.</span>}</div>}
            <div className="import-row"><input aria-label="PGN-Text" placeholder="PGN hier einfügen …" value={pgn} onChange={(event) => setPgn(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void loadPgn(pgn); }} /><button className="button primary" onClick={() => void loadPgn(pgn)}>Laden</button><label className="button" title="PGN-Datei hochladen"><FileUp size={15} /><input className="sr-only" type="file" accept=".pgn,.txt,text/plain" onChange={(event) => void handleFile(event.target.files?.[0])} /></label></div>
            <label className="comment-field"><span>Kommentar zu Zug {selectedPly||"—"}</span><textarea aria-label="Kommentar zum Zug" disabled={!selectedPly} value={comments[selectedPly]??""} onChange={(event)=>updateComment(event.target.value)} placeholder="Notiz oder Erklärung zu diesem Zug …"/></label><div className="file-drop" onDragOver={(event) => { event.preventDefault(); event.currentTarget.classList.add("drag"); }} onDragLeave={(event) => event.currentTarget.classList.remove("drag")} onDrop={(event) => { event.preventDefault(); event.currentTarget.classList.remove("drag"); void handleFile(event.dataTransfer.files[0]); }}>PGN-Datei hier ablegen</div>
            <div className="status" role="status">{status}</div>
            <div className="move-list" aria-label="Zugliste">
              {moves.length ? moves.map((move, index) => <span key={`${move.from}${move.to}${index}`} className="move-cell">{index % 2 === 0 && <span className="move-number">{Math.floor(index / 2) + 1}.</span>}<button className={`move-item ${selectedPly === index + 1 ? "active" : ""}`} onClick={() => selectPly(index + 1)}>{move.san}{analysis[index] && <small className="hint"> {analysis[index].kind === "blunder" ? "??" : analysis[index].kind === "mistake" ? "?" : analysis[index].kind === "inaccuracy" ? "?!" : analysis[index].kind === "best" ? "★" : analysis[index].kind === "brilliant" ? "!!" : analysis[index].kind === "great" ? "!" : analysis[index].kind === "excellent" ? "✓" : analysis[index].kind === "book" ? "Book" : ""}</small>}</button></span>) : <span className="hint">Noch keine Züge. PGN einfügen oder auf dem Brett ziehen.</span>}
            </div>
            <div className="hint">Speicherung nur auf diesem Gerät. Auf GitHub Pages läuft Stockfish ohne Mehrkern-Header im Single-Thread-Modus.</div>
          </motion.aside>
        </div>
        <footer className="footer">Stockfish 19 Lite läuft im Browser-Worker · Nicht mit Chess.com verbunden</footer>
      </section>
    </main>
  );
}
