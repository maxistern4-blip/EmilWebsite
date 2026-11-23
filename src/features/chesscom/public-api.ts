export type ChessComGame = { url:string; pgn:string; end_time:number; time_class?:string; white:{username:string;result:string}; black:{username:string;result:string} };
export type ChessComProfile = { username:string; avatar?:string; url?:string };
export async function fetchPublicGames(input:string,signal?:AbortSignal){
  const username=input.trim().replace(/^@/,"");
  if(!/^[a-zA-Z0-9_-]{2,30}$/.test(username))throw new Error("Bitte gib einen gültigen Benutzernamen ein.");
  const root=`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}`;
  const profileResponse=await fetch(root,{signal,headers:{Accept:"application/json"}});
  if(profileResponse.status===404)throw new Error("Chess.com-Profil nicht gefunden.");
  if(!profileResponse.ok)throw new Error("Chess.com-Profil konnte nicht geladen werden.");
  const profile=(await profileResponse.json()) as ChessComProfile;
  const archiveResponse=await fetch(`${root}/games/archives`,{signal,headers:{Accept:"application/json"}});
  if(!archiveResponse.ok)throw new Error("Die Partienliste konnte nicht geladen werden.");
  const archives=(await archiveResponse.json() as {archives:string[]}).archives.slice(-4).reverse();
  const games:ChessComGame[]=[];
  for(const url of archives){
    const response=await fetch(url,{signal,headers:{Accept:"application/json"}});
    if(response.ok){const month=await response.json() as {games?:ChessComGame[]};games.push(...(month.games??[]));}
  }
  games.sort((a,b)=>b.end_time-a.end_time);
  return {profile,games:games.slice(0,40)};
}
