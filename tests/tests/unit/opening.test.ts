import { describe, expect, it } from "vitest";
import { isKnownBookMove } from "../../src/features/openings/book";
describe("opening move recognition",()=>{
  it("recognizes a supported Ruy Lopez move prefix",()=>expect(isKnownBookMove(["e4","e5","Nf3","Nc6","Bb5","a6"],5)).toBe(true));
  it("does not classify a move outside the supported lines",()=>expect(isKnownBookMove(["e4","a5"],1)).toBe(false));
});
