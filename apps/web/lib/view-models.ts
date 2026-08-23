import type { RepositoryCardData } from "@/components/repository-card";
import type { RepositoryListItem } from "@/lib/data";

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function toRepositoryCard(repo: RepositoryListItem): RepositoryCardData {
  return {
    owner: repo.owner,
    name: repo.name,
    summary: repo.summary,
    summarySource: repo.summarySource,
    healthScore: repo.healthScore,
    stars: formatCompactNumber(repo.stars),
    language: repo.language,
    licenseSpdx: repo.licenseSpdx,
    fitReason: repo.fitReason,
    tags: repo.tags,
  };
}
