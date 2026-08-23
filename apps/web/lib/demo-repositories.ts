import type { RepositoryCardData } from "@/components/repository-card";

export const demoRepositories: RepositoryCardData[] = [
  {
    owner: "browser-use",
    name: "browser-use",
    summary: "A browser automation framework designed around AI-driven tasks and agents.",
    healthScore: 88,
    stars: "70k+",
    language: "Python",
    fitReason: "Strong fit when the goal is LLM-driven browser task execution.",
    tags: ["AI agents", "Browser automation"],
  },
  {
    owner: "unclecode",
    name: "crawl4ai",
    summary: "Open-source web crawling and extraction tooling designed for LLM-ready data workflows.",
    healthScore: 85,
    stars: "40k+",
    language: "Python",
    fitReason: "Useful when a build needs structured web extraction before an LLM step.",
    tags: ["Scraping", "Data extraction"],
  },
  {
    owner: "n8n-io",
    name: "n8n",
    summary: "A workflow automation platform with a large integration ecosystem and self-hosting options.",
    healthScore: 91,
    stars: "100k+",
    language: "TypeScript",
    fitReason: "Good orchestration candidate when a solution needs many APIs and repeatable workflows.",
    tags: ["Automation", "Self-hosted"],
  },
];
