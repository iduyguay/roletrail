export const initialProfile = {
  skills: [
    "Product design",
    "Figma",
    "Prototyping",
    "Design systems",
    "User research",
    "Interaction design",
    "Accessibility",
    "Data analysis",
  ],
};

export function readDemoProfile() {
  try {
    const saved = localStorage.getItem("roletrail-demo-profile");
    return saved ? JSON.parse(saved) : initialProfile;
  } catch {
    return initialProfile;
  }
}
