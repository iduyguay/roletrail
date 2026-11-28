import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeJob } from "../src/lib/matchScore.js";

test("matches skills before punctuation and preserves technical names", () => {
  assert.deepEqual(
    analyzeJob("We use React. We use Node.js, C++ and C#.", [
      "React",
      "Node.js",
      "C++",
      "C#",
      "TypeScript",
    ]),
    {
      score: 80,
      matchedSkills: ["React", "Node.js", "C++", "C#"],
      missingSkills: ["TypeScript"],
    },
  );
});

test("matches complete phrases and counts normalized duplicates once", () => {
  assert.deepEqual(
    analyzeJob("React Native, design systems and Café research", [
      "React",
      "react",
      "Design systems",
      "Cafe research",
      "Native systems",
      "Java",
    ]),
    {
      score: 60,
      matchedSkills: ["React", "Design systems", "Cafe research"],
      missingSkills: ["Native systems", "Java"],
    },
  );
});

test("preserves the leading dot in .NET", () => {
  assert.deepEqual(analyzeJob("Built with .NET.", [".NET", "NET"]), {
    score: 50,
    matchedSkills: [".NET"],
    missingSkills: ["NET"],
  });
});
