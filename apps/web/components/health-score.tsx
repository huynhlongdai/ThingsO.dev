export function HealthScore({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="health-score" aria-label={`Project health score ${safeScore} out of 100`}>
      <span className="health-score__value">{safeScore}</span>
      <span className="health-score__label">Health</span>
    </div>
  );
}
