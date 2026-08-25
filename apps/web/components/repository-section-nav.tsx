const sections = [
  ["overview", "Overview"],
  ["problem-solution", "Problem & solution"],
  ["capabilities-limitations", "Capabilities & limitations"],
  ["decision-guide", "Decision guide"],
  ["architecture", "Architecture"],
  ["technology", "Technology"],
  ["codebase", "Codebase"],
  ["developer-workflow", "Developer workflow"],
  ["integration", "Integration"],
  ["deployment", "Deployment"],
  ["security", "Security"],
  ["signals", "Project signals"],
  ["evidence", "Evidence"],
] as const;

export function RepositorySectionNav() {
  return (
    <nav className="repo-section-nav" aria-label="Repository intelligence sections">
      <span className="repo-section-nav__label">On this page</span>
      <div className="repo-section-nav__links">
        {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </div>
    </nav>
  );
}
