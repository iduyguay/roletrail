function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.(?![\p{L}\p{N}])/gu, " ")
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .trim();
}

export function analyzeJob(description, skills) {
  const source = ` ${normalize(description)} `;
  const seen = new Set();
  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of skills) {
    const term = normalize(skill);
    if (!term || seen.has(term)) continue;
    seen.add(term);

    const group = source.includes(` ${term} `) ? matchedSkills : missingSkills;
    group.push(skill.trim());
  }

  const score = seen.size
    ? Math.round((matchedSkills.length / seen.size) * 100)
    : 0;

  return { score, matchedSkills, missingSkills };
}
