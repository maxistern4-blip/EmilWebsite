import { expect, test } from "@playwright/test";
test("loads a PGN in the static analysis workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Schach-Analyse" })).toBeVisible();
  await expect(page.getByLabel("Chess.com Benutzername")).toBeVisible();
  const input = page.getByLabel("PGN-Text");
  await input.fill("1. e4 e5 2. Nf3 Nc6 *");
  await page.getByRole("button", { name: "Laden" }).click();
  await expect(page.locator(".status")).toContainText("4 Halbzüge geladen");
  await expect(page.getByRole("button", { name: "e4" })).toBeVisible();
  await page.getByRole("button", { name: "Analyse starten" }).click();
  await expect(page.locator(".status")).toContainText("Stockfish läuft", { timeout: 60000 });
});

test("finds a public Chess.com profile and loads its latest public game",async({page})=>{
  await page.route("https://api.chess.com/pub/player/demoplayer",route=>route.fulfill({headers:{"access-control-allow-origin":"*"},json:{username:"DemoPlayer",url:"https://www.chess.com/member/demoplayer"}}));
  await page.route("https://api.chess.com/pub/player/demoplayer/games/archives",route=>route.fulfill({headers:{"access-control-allow-origin":"*"},json:{archives:["https://api.chess.com/pub/player/demoplayer/games/2026/10"]}}));
  await page.route("https://api.chess.com/pub/player/demoplayer/games/2026/10",route=>route.fulfill({headers:{"access-control-allow-origin":"*"},json:{games:[{url:"https://www.chess.com/game/live/1",pgn:"1. e4 e5 2. Nf3 Nc6 *",end_time:1792000000,time_class:"blitz",white:{username:"DemoPlayer",result:"win"},black:{username:"Opponent",result:"resigned"}}]}}));
  await page.goto("/");
  await page.getByLabel("Chess.com Benutzername").fill("DemoPlayer");
  await page.getByRole("button",{name:"Profil suchen"}).click();
  await expect(page.getByText("Opponent")).toBeVisible();
  await page.getByRole("button",{name:/Opponent/}).click();
  await expect(page.locator(".status")).toContainText("4 Halbzüge geladen");
});
