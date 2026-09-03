import { calculateGradeAndPoint } from "../../src/app/utils/calculateGrade.js";

describe("Academic Logic Unit Tests", () => {
  it("should correctly calculate grade points", () => {
    expect(calculateGradeAndPoint(85)).toEqual({ letterGrade: "A+", gradePoint: 4.0 });
    expect(calculateGradeAndPoint(78)).toEqual({ letterGrade: "A", gradePoint: 3.75 });
    expect(calculateGradeAndPoint(35)).toEqual({ letterGrade: "F", gradePoint: 0.0 });
  });
});
