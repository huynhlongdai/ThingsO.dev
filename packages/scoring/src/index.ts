export const HEALTH_SCORE_VERSION = "health-v1" as const;

export type HealthScoreInput = {
  now: Date;
  createdAt?: Date | null;
  pushedAt?: Date | null;
  stars: number;
  forks: number;
  subscribers?: number | null;
  contributors?: number | null;
  readmePresent: boolean;
  descriptionPresent: boolean;
  homepagePresent: boolean;
  primaryLanguagePresent: boolean;
  defaultBranchPresent: boolean;
  releaseCount?: number | null;
  latestReleaseAt?: Date | null;
  licenseSpdx?: string | null;
  archived: boolean;
};

export type HealthScoreBreakdown = {
  version: typeof HEALTH_SCORE_VERSION;
  total: number;
  maintenance: number;
  adoption: number;
  community: number;
  documentation: number;
  operations: number;
  licenseClarity: number;
  maturity: number;
  metadata: number;
};

const weights = {
  maintenance: 0.25,
  adoption: 0.15,
  community: 0.15,
  documentation: 0.15,
  operations: 0.10,
  licenseClarity: 0.05,
  maturity: 0.10,
  metadata: 0.05,
} as const;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function daysBetween(now: Date, then?: Date | null): number | null {
  if (!then || Number.isNaN(then.getTime())) return null;
  return Math.max(0, (now.getTime() - then.getTime()) / 86_400_000);
}

function recencyScore(days: number | null): number {
  if (days === null) return 0;
  if (days <= 7) return 100;
  if (days <= 30) return 92;
  if (days <= 90) return 78;
  if (days <= 180) return 60;
  if (days <= 365) return 40;
  if (days <= 730) return 18;
  return 5;
}

function logScore(value: number, cap: number): number {
  const safe = Math.max(0, value);
  return clamp((Math.log1p(Math.min(safe, cap)) / Math.log1p(cap)) * 100);
}

function maintenance(input: HealthScoreInput): number {
  if (input.archived) return 0;
  return recencyScore(daysBetween(input.now, input.pushedAt));
}

function adoption(input: HealthScoreInput): number {
  return clamp(logScore(input.stars, 100_000) * 0.7 + logScore(input.forks, 20_000) * 0.3);
}

function community(input: HealthScoreInput): number {
  const contributors = logScore(input.contributors ?? 0, 200);
  const subscribers = logScore(input.subscribers ?? 0, 2_000);
  const forks = logScore(input.forks, 10_000);
  return clamp(contributors * 0.5 + subscribers * 0.2 + forks * 0.3);
}

function documentation(input: HealthScoreInput): number {
  return clamp(
    (input.readmePresent ? 60 : 0) +
      (input.descriptionPresent ? 20 : 0) +
      (input.homepagePresent ? 20 : 0),
  );
}

function operations(input: HealthScoreInput): number {
  const count = logScore(input.releaseCount ?? 0, 20) * 0.4;
  const recency = recencyScore(daysBetween(input.now, input.latestReleaseAt)) * 0.6;
  return clamp(count + recency);
}

function licenseClarity(input: HealthScoreInput): number {
  const value = input.licenseSpdx?.trim().toUpperCase();
  if (!value) return 0;
  if (value === "NOASSERTION" || value === "OTHER") return 30;
  return 100;
}

function maturity(input: HealthScoreInput): number {
  const days = daysBetween(input.now, input.createdAt);
  if (days === null) return 0;
  return clamp((Math.min(days, 1_095) / 1_095) * 100);
}

function metadata(input: HealthScoreInput): number {
  return clamp(
    (input.descriptionPresent ? 35 : 0) +
      (input.primaryLanguagePresent ? 35 : 0) +
      (input.defaultBranchPresent ? 30 : 0),
  );
}

export function calculateHealthScore(input: HealthScoreInput): HealthScoreBreakdown {
  const components = {
    maintenance: maintenance(input),
    adoption: adoption(input),
    community: community(input),
    documentation: documentation(input),
    operations: operations(input),
    licenseClarity: licenseClarity(input),
    maturity: maturity(input),
    metadata: metadata(input),
  };

  const total = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + components[key as keyof typeof components] * weight,
    0,
  );

  return {
    version: HEALTH_SCORE_VERSION,
    total: round(total),
    maintenance: round(components.maintenance),
    adoption: round(components.adoption),
    community: round(components.community),
    documentation: round(components.documentation),
    operations: round(components.operations),
    licenseClarity: round(components.licenseClarity),
    maturity: round(components.maturity),
    metadata: round(components.metadata),
  };
}
