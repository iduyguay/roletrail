function normalize(value) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .trim();
}

function containsSkill(text, skill) {
  const normalizedText = ` ${normalize(text)} `;
  const normalizedSkill = normalize(skill);
  return (
    normalizedSkill.length > 0 &&
    normalizedText.includes(` ${normalizedSkill} `)
  );
}

export function analyzeJob(description, skills) {
  const source = normalize(description);
  const cleanSkills = [
    ...new Set(skills.map((skill) => skill.trim()).filter(Boolean)),
  ];
  const matchedSkills = cleanSkills.filter((skill) =>
    containsSkill(source, skill),
  );
  const missingSkills = cleanSkills.filter(
    (skill) => !containsSkill(source, skill),
  );
  const score = cleanSkills.length
    ? Math.round((matchedSkills.length / cleanSkills.length) * 100)
    : 0;

  return { score, matchedSkills, missingSkills };
}
