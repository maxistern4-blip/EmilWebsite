export type EngineLine = { depth:number; multipv:number; score:number; mate:boolean; mateIn?:number; pv:string };
export class BrowserStockfish {
  private worker:Worker; private ready:Promise<void>; private resolveReady!:()=>void;
  private searchResolve:((line:EngineLine)=>void)|null=null; private latest:EngineLine={depth:0,multipv:1,score:0,mate:false,pv:""};
  constructor(private onInfo:(line:EngineLine)=>void){
    const base=process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    this.worker=new Worker(`${base}/engine/stockfish-19-lite-single.js`);
    this.ready=new Promise(resolve=>{this.resolveReady=resolve});
    this.worker.onmessage=event=>this.receive(String(event.data??""));
    this.worker.postMessage("uci");
  }
  private receive(message:string){
    if(message==="uciok"){this.worker.postMessage("setoption name Threads value 1");this.worker.postMessage("setoption name Hash value 64");this.worker.postMessage("setoption name MultiPV value 3");this.worker.postMessage("isready");return}
    if(message==="readyok"){this.resolveReady();return}
    if(message.startsWith("bestmove ")&&this.searchResolve){const resolve=this.searchResolve;this.searchResolve=null;resolve(this.latest);return}
    if(!message.startsWith("info "))return;
    const depth=Number(message.match(/\bdepth (\d+)/)?.[1]??0),multipv=Number(message.match(/\bmultipv (\d+)/)?.[1]??1);
    const cp=message.match(/\bscore cp (-?\d+)/),mate=message.match(/\bscore mate (-?\d+)/);
    const line={depth,multipv,score:cp?Number(cp[1]):mate?(Number(mate[1])>0?30000:-30000):0,mate:!!mate,mateIn:mate?Number(mate[1]):undefined,pv:message.match(/\bpv (.+)$/)?.[1]??""};
    if(depth){this.onInfo(line);if(multipv===1)this.latest=line}
  }
  async start(){await this.ready}
  configure(hash:number,multiPv:number){this.worker.postMessage("setoption name Hash value "+hash);this.worker.postMessage("setoption name MultiPV value "+multiPv)}
  analyze(fen:string,depth:number){this.worker.postMessage("stop");this.worker.postMessage("position fen "+fen);this.worker.postMessage("go depth "+depth)}
  async search(fen:string,depth:number):Promise<EngineLine>{await this.ready;this.stop();this.latest={depth:0,multipv:1,score:0,mate:false,pv:""};return new Promise(resolve=>{this.searchResolve=resolve;this.worker.postMessage("position fen "+fen);this.worker.postMessage("go depth "+depth);setTimeout(()=>{if(this.searchResolve){this.stop();const done=this.searchResolve;this.searchResolve=null;done(this.latest)}},60000)})}
  stop(){this.worker.postMessage("stop")} dispose(){this.worker.terminate()}
}
