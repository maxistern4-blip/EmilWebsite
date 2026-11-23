import { describe, expect, it } from "vitest";
import { evaluateLoss } from "../../src/features/analysis/grade";
describe("evaluateLoss",()=>{
  it("marks large centipawn loss as a blunder",()=>expect(evaluateLoss(20,-350,8).kind).toBe("blunder"));
  it("marks small centipawn loss as best",()=>expect(evaluateLoss(20,10,2).kind).toBe("best"));
  it("never reports negative loss",()=>expect(evaluateLoss(20,100,4).loss).toBe(0));
  it("marks the best category when evaluation is preserved",()=>expect(evaluateLoss(25,16,6).kind).toBe("best"));
});
