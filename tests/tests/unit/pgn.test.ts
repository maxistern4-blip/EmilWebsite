import { describe, expect, it } from "vitest";
import { extractComments, exportPgn, parsePgn } from "../../src/features/pgn/pgn";

describe("PGN comments", () => {
  it("exports comments attached to a half-move", () => {
    const pgn = "1. e4 e5 2. Nf3 *";
    const exported = exportPgn(pgn, { 1: "Guter Start" });
    expect(exported).toContain("{Guter Start}");
    expect(extractComments(parsePgn(exported))).toEqual({ 1: "Guter Start" });
  });
});

