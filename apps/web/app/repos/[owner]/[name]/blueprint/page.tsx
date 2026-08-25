import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { SiteHeader } from "@/components/site-header";
import { getRepository } from "@/lib/data";
import { getRepositoryIntelligence } from "@/lib/intelligence-data";
import type { IntelligenceClaim } from "@/lib/intelligence";

export const revalidate = 300;

const phases = [
  ["blueprint-decision", "01", "Decision"],
  ["blueprint-local", "02", "Local proof"],
  ["blueprint-architecture", "03", "Architecture"],
  ["blueprint-integration", "04", "Integration"],
  ["blueprint-production", "05", "Production"],
  ["blueprint-security", "06", "Security"],
  ["blueprint-checkpoint", "✓", "Checkpoint"],
] as const;

function Claim({ label, claim }: { label: string; claim: IntelligenceClaim }) {
  return (
    <div className={`blueprint-claim blueprint-claim--${claim.state}`}>
      <div className="blueprint-claim__topline"><strong>{label}</strong><span>{claim.state}</span></div>
      <span>{claim.value ?? "Not established by the current evidence pack."}</span>
      <small>{claim.confidence !== null ? `${Math.round(claim.confidence * 100)}% confidence` : "No confidence score"}</small>
    </div>
  );
}

function Evidence({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="blueprint-evidence" aria-label="Evidence selectors">
      <ProvenanceBadge kind="editorial" />
      {items.map((item) => <code key={item}>{item}</code>)}
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  if (!items.length) return <p className="muted">No additional items are established by the current evidence.</p>;
  return <ul className="blueprint-checklist">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}): Promise<Metadata> {
  const { owner, name } = await params;
  const [repo, intelligence] = await Promise.all([
    getRepository(owner, name),
    getRepositoryIntelligence(owner, name),
  ]);
  if (!repo || !intelligence) {
    return { title: "Implementation blueprint unavailable", robots: { index: false, follow: true } };
  }
  return {
    title: `Build with ${repo.fullName}`,
    description: `Evidence-backed implementation blueprint for ${repo.fullName}: decision checks, code paths, integration, deployment, operations and security.`,
    alternates: { canonical: `/repos/${repo.owner}/${repo.name}/blueprint` },
  };
}

export default async function RepositoryBlueprintPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = await params;
  const [repo, intelligence] = await Promise.all([
    getRepository(owner, name),
    getRepositoryIntelligence(owner, name),
  ]);
  if (!repo || !intelligence) notFound();

  const localCommands = intelligence.developerWorkflow.commands.map(
    (item) => `${item.purpose}: ${item.command}`,
  );
  const architectureComponents = intelligence.architecture.components.map(
    (item) => `${item.name}: ${item.responsibility}`,
  );
  const technologyRoles = intelligence.technology.items.map(
    (item) => `${item.name} — ${item.role}`,
  );
  const evidenceClaims: IntelligenceClaim[] = [
    intelligence.developerWorkflow.localSetup,
    intelligence.architecture.style,
    intelligence.architecture.executionModel,
    intelligence.architecture.stateModel,
    intelligence.architecture.persistenceModel,
    intelligence.integration.extensionModel,
    intelligence.integration.pluginSystem,
    intelligence.deploymentOperations.minimumDeployment,
    intelligence.deploymentOperations.productionTopology,
    intelligence.deploymentOperations.configuration,
    intelligence.deploymentOperations.observability,
    intelligence.securityPrivacy.authentication,
    intelligence.securityPrivacy.authorization,
    intelligence.securityPrivacy.networkExposure,
    intelligence.securityPrivacy.dataPersisted,
  ];
  const establishedClaims = evidenceClaims.filter((claim) => claim.value && claim.state !== "unknown").length;
  const unknownClaims = evidenceClaims.length - establishedClaims;
  const profileEvidenceSelectors = new Set([
    ...intelligence.decision.evidence,
    ...intelligence.developerWorkflow.evidence,
    ...intelligence.codebase.evidence,
    ...intelligence.architecture.evidence,
    ...intelligence.technology.evidence,
    ...intelligence.integration.evidence,
    ...intelligence.deploymentOperations.evidence,
    ...intelligence.securityPrivacy.evidence,
  ]).size;

  return (
    <main>
      <div className="page-shell page-shell--wide">
        <SiteHeader />
        <section className="content-page blueprint-page blueprint-page--v2">
          <div className="blueprint-hero blueprint-hero--v2">
            <div>
              <Link className="back-link" href={`/repos/${repo.owner}/${repo.name}`}>← Repository intelligence</Link>
              <p className="eyebrow">Build · evidence-backed blueprint</p>
              <h1>Implement with {repo.fullName}</h1>
              <p className="lede">
                Follow the current approved repository evidence from adoption decision through local proof, architecture, integration, production and security. Unknowns remain explicit instead of being invented.
              </p>
              <nav className="blueprint-actions" aria-label="Blueprint actions">
                <Link href={`/repos/${repo.owner}/${repo.name}`}>Repository intelligence</Link>
                <Link href={`/compare?repos=${encodeURIComponent(repo.fullName)}`}>Compare before committing</Link>
                <a href={repo.githubUrl} rel="noreferrer">Open GitHub ↗</a>
              </nav>
            </div>
            <div className="blueprint-meta blueprint-meta--panel">
              <div><ProvenanceBadge kind="editorial" /><span>Current approved profile</span></div>
              <div><span>Profile confidence</span><strong>{Math.round(intelligence.confidence * 100)}%</strong></div>
              <div><span>Snapshot</span><strong>{new Date(repo.capturedAt).toLocaleDateString("en-CA")}</strong></div>
              <div><span>Model</span><strong>{intelligence.model}</strong></div>
            </div>
          </div>

          <section className="blueprint-evidence-summary" aria-label="Blueprint evidence summary">
            <div><span>Established evidence fields</span><strong>{establishedClaims}/{evidenceClaims.length}</strong><small>Known or inferred with an explicit value</small></div>
            <div><span>Unresolved fields</span><strong>{unknownClaims}</strong><small>Must be verified before relying on them</small></div>
            <div><span>Evidence selectors</span><strong>{profileEvidenceSelectors}</strong><small>Unique selectors across blueprint sections</small></div>
            <div><span>Execution rule</span><strong>No guessing</strong><small>Unknown stays visible throughout the blueprint</small></div>
          </section>

          <nav className="blueprint-phase-nav" aria-label="Blueprint phases">
            {phases.map(([id, number, label]) => <a href={`#${id}`} key={id}><span>{number}</span>{label}</a>)}
          </nav>

          <div className="blueprint-timeline">
            <section className="detail-section blueprint-phase" id="blueprint-decision">
              <div className="blueprint-phase__heading"><span>01</span><div><p className="eyebrow">Decision gate</p><h2>Confirm the project fits before implementation.</h2><p>Resolve fit and trade-offs before spending time on integration.</p></div></div>
              <div className="detail-columns">
                <div><h3>Choose when</h3><Checklist items={intelligence.decision.chooseWhen} /></div>
                <div><h3>Avoid when</h3><Checklist items={intelligence.decision.avoidWhen} /></div>
                <div><h3>Evaluate first</h3><Checklist items={intelligence.decision.evaluateFirst} /></div>
                <div><h3>Trade-offs</h3><Checklist items={intelligence.decision.tradeoffs} /></div>
              </div>
              <div className="metrics-grid">
                <div className="metric-card"><span>Learning curve</span><strong>{intelligence.decision.learningCurve}</strong></div>
                <div className="metric-card"><span>Operational complexity</span><strong>{intelligence.decision.operationalComplexity}</strong></div>
                <div className="metric-card"><span>Migration cost</span><strong>{intelligence.decision.migrationCost}</strong></div>
                <div className="metric-card"><span>Lock-in</span><strong>{intelligence.decision.lockIn}</strong></div>
              </div>
              <Evidence items={intelligence.decision.evidence} />
            </section>

            <section className="detail-section blueprint-phase" id="blueprint-local">
              <div className="blueprint-phase__heading"><span>02</span><div><p className="eyebrow">Local proof</p><h2>Get one small verified path working.</h2><p>Use repository commands and code paths before introducing your own abstractions.</p></div></div>
              <Claim label="Local setup" claim={intelligence.developerWorkflow.localSetup} />
              <div className="detail-columns">
                <div><h3>Commands identified in evidence</h3><Checklist items={localCommands} /></div>
                <div><h3>Start reading here</h3><Checklist items={intelligence.codebase.startReading} /></div>
                <div><h3>Entry points</h3><Checklist items={intelligence.codebase.entryPoints} /></div>
                <div><h3>Extension points</h3><Checklist items={intelligence.codebase.extensionPoints} /></div>
              </div>
              <Evidence items={[...intelligence.developerWorkflow.evidence, ...intelligence.codebase.evidence]} />
            </section>

            <section className="detail-section blueprint-phase" id="blueprint-architecture">
              <div className="blueprint-phase__heading"><span>03</span><div><p className="eyebrow">Architecture</p><h2>Know what you are integrating and where to change it.</h2><p>Map execution, state and extension boundaries before modifying the project.</p></div></div>
              <p className="blueprint-phase__intro">{intelligence.architecture.overview}</p>
              <div className="blueprint-claims-grid">
                <Claim label="Architecture style" claim={intelligence.architecture.style} />
                <Claim label="Execution model" claim={intelligence.architecture.executionModel} />
                <Claim label="State model" claim={intelligence.architecture.stateModel} />
                <Claim label="Scaling model" claim={intelligence.architecture.scalingModel} />
              </div>
              <div className="detail-columns">
                <div><h3>Core components</h3><Checklist items={architectureComponents} /></div>
                <div><h3>Data flow</h3><Checklist items={intelligence.architecture.dataFlow} /></div>
                <div><h3>Technology roles</h3><Checklist items={technologyRoles} /></div>
                <div><h3>Important code paths</h3><Checklist items={intelligence.codebase.importantPaths.map((item) => `${item.path}: ${item.purpose}`)} /></div>
              </div>
              <Evidence items={[...intelligence.architecture.evidence, ...intelligence.technology.evidence]} />
            </section>

            <section className="detail-section blueprint-phase" id="blueprint-integration">
              <div className="blueprint-phase__heading"><span>04</span><div><p className="eyebrow">Integration</p><h2>Define the boundary between your product and this project.</h2><p>Prefer documented interfaces and extension points over internal coupling.</p></div></div>
              <div className="blueprint-claims-grid">
                <Claim label="Extension model" claim={intelligence.integration.extensionModel} />
                <Claim label="Plugin system" claim={intelligence.integration.pluginSystem} />
                <Claim label="Adding an extension" claim={intelligence.integration.addingExtension} />
              </div>
              <div className="detail-columns">
                <div><h3>APIs</h3><Checklist items={intelligence.integration.apis} /></div>
                <div><h3>Protocols</h3><Checklist items={intelligence.integration.protocols} /></div>
                <div><h3>Known integrations</h3><Checklist items={intelligence.integration.integrations} /></div>
                <div><h3>Reusable patterns</h3><Checklist items={intelligence.learning.reusablePatterns} /></div>
              </div>
              <Evidence items={intelligence.integration.evidence} />
            </section>

            <section className="detail-section blueprint-phase" id="blueprint-production">
              <div className="blueprint-phase__heading"><span>05</span><div><p className="eyebrow">Production</p><h2>Turn the proof into an operable deployment.</h2><p>Resolve topology, persistence, configuration, scaling and recovery before launch.</p></div></div>
              <div className="blueprint-claims-grid">
                <Claim label="Minimum deployment" claim={intelligence.deploymentOperations.minimumDeployment} />
                <Claim label="Production topology" claim={intelligence.deploymentOperations.productionTopology} />
                <Claim label="Persistence" claim={intelligence.deploymentOperations.persistence} />
                <Claim label="Configuration" claim={intelligence.deploymentOperations.configuration} />
                <Claim label="Scaling" claim={intelligence.deploymentOperations.scaling} />
                <Claim label="Observability" claim={intelligence.deploymentOperations.observability} />
                <Claim label="Backup & upgrade" claim={intelligence.deploymentOperations.backupUpgrade} />
                <Claim label="Failure recovery" claim={intelligence.deploymentOperations.failureRecovery} />
              </div>
              <div className="detail-columns">
                <div><h3>Required services</h3><Checklist items={intelligence.deploymentOperations.requiredServices} /></div>
                <div><h3>Operational risks</h3><Checklist items={intelligence.deploymentOperations.operationalRisks} /></div>
              </div>
              <Evidence items={intelligence.deploymentOperations.evidence} />
            </section>

            <section className="detail-section blueprint-phase" id="blueprint-security">
              <div className="blueprint-phase__heading"><span>06</span><div><p className="eyebrow">Security & privacy</p><h2>Resolve exposure and data boundaries before launch.</h2><p>Unknown security fields are blockers to verify, not assumptions to fill.</p></div></div>
              <div className="blueprint-claims-grid">
                <Claim label="Authentication" claim={intelligence.securityPrivacy.authentication} />
                <Claim label="Authorization" claim={intelligence.securityPrivacy.authorization} />
                <Claim label="Secrets" claim={intelligence.securityPrivacy.secrets} />
                <Claim label="Network exposure" claim={intelligence.securityPrivacy.networkExposure} />
                <Claim label="Sandboxing" claim={intelligence.securityPrivacy.sandboxing} />
                <Claim label="Multi-tenancy" claim={intelligence.securityPrivacy.multiTenancy} />
                <Claim label="Data persisted" claim={intelligence.securityPrivacy.dataPersisted} />
                <Claim label="Data leaves system" claim={intelligence.securityPrivacy.dataLeavesSystem} />
                <Claim label="Telemetry" claim={intelligence.securityPrivacy.telemetry} />
              </div>
              <h3>Security risks established by the profile</h3>
              <Checklist items={intelligence.securityPrivacy.securityRisks} />
              <Evidence items={intelligence.securityPrivacy.evidence} />
            </section>

            <section className="detail-section blueprint-phase blueprint-phase--final" id="blueprint-checkpoint">
              <div className="blueprint-phase__heading"><span>✓</span><div><p className="eyebrow">Implementation checkpoint</p><h2>What to verify before committing more resources.</h2><p>Use unresolved decision, operations and security questions as a concrete validation backlog.</p></div></div>
              <Checklist items={[
                ...intelligence.decision.evaluateFirst,
                ...intelligence.deploymentOperations.operationalRisks,
                ...intelligence.securityPrivacy.securityRisks,
              ]} />
              <p className="muted">Unknown fields are intentionally preserved. Verify them against the linked source documents and the upstream project before treating this blueprint as a production specification.</p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
