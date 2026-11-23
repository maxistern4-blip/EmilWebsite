import { describe, expect, it } from "vitest";
import { summarizeGrades } from "../../src/features/analysis/report";
describe("analysis report",()=>{
  it("summarizes player sides and phases",()=>{const report=summarizeGrades([{ply:1,kind:"best",loss:0,accuracy:100,side:"w",phase:"opening"},{ply:2,kind:"blunder",loss:400,accuracy:20,side:"b",phase:"middlegame"}]);expect(report.white).toBe("100%");expect(report.black).toBe("20%");expect(report.opening).toBe("100%");expect(report.mistakes).toBe(1)});
  it("returns an em dash for empty sections",()=>expect(summarizeGrades([]).endgame).toBe("–"));
});
