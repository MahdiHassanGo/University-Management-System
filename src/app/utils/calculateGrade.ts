export interface IGradeResult {
  letterGrade: string;
  gradePoint: number;
}

export const calculateGradeAndPoint = (totalMarks: number): IGradeResult => {
  const roundedMarks = Math.round(totalMarks * 100) / 100;

  if (roundedMarks >= 80) {
    return { letterGrade: "A+", gradePoint: 4.0 };
  }
  if (roundedMarks >= 75) {
    return { letterGrade: "A", gradePoint: 3.75 };
  }
  if (roundedMarks >= 70) {
    return { letterGrade: "A-", gradePoint: 3.5 };
  }
  if (roundedMarks >= 65) {
    return { letterGrade: "B+", gradePoint: 3.25 };
  }
  if (roundedMarks >= 60) {
    return { letterGrade: "B", gradePoint: 3.0 };
  }
  if (roundedMarks >= 55) {
    return { letterGrade: "B-", gradePoint: 2.75 };
  }
  if (roundedMarks >= 50) {
    return { letterGrade: "C+", gradePoint: 2.5 };
  }
  if (roundedMarks >= 45) {
    return { letterGrade: "C", gradePoint: 2.25 };
  }
  if (roundedMarks >= 40) {
    return { letterGrade: "D", gradePoint: 2.0 };
  }
  return { letterGrade: "F", gradePoint: 0.0 };
};
