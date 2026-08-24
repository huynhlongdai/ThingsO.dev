import { ProvenanceBadge } from "@/components/provenance-badge";
import type {
  IntelligenceClaim,
  RepositoryIntelligenceV3,
} from "@/lib/intelligence";

function List({ items }: { items: string[] }) {
  if (!items.length) return <p className="muted">Not established from available evidence.</p>;
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function Claim({ label, claim }: { label: string; claim: IntelligenceClaim }) {
  return (
    <div className="idea-card">
      <h3>{label}</h3>
      <p>{claim.value ?? "Not established from available evidence."}</p>
      <small className="muted">
        {claim.state}{claim.confidence !== null ? ` · ${Math.round(claim.confidence * 100)}% confidence` : ""}
      </small>
    </div>
  );
}

function SectionConfidence({
  intelligence,
  section,
}: {
  intelligence: RepositoryIntelligenceV3;
  section: string;
}) {
  const confidence = intelligence.sectionConfidence[section];
  if (confidence === null || confidence === undefined) return null;
  return <span className="tag">{Math.round(confidence * 100)}% confidence</span>;
}

export function RepositoryIntelligenceV3View({
  intelligence,
}: {
  intelligence: RepositoryIntelligenceV3;
}) {
  return (
    <>
      <section className="detail-section">
        <div className="section-heading">
          <ProvenanceBadge kind="editorial" />
          <h2>What it is</h2>
          <SectionConfidence intelligence={intelligence} section="identity" />
        </div>
        <p className="lede">{intelligence.identity.definition}</p>
        <div className="metrics-grid">
          <div className="metric-card"><span>Product type</span><strong>{intelligence.identity.productType}</strong></div>
          <div className="metric-card"><span>Primary role</span><strong>{intelligence.identity.primaryRole}</strong></div>
          <div className="metric-card"><span>Category</span><strong>{intelligence.identity.primaryCategory}</strong></div>
          <div className="metric-card"><span>Interaction</span><strong>{intelligence.identity.interactionModel ?? "—"}</strong></div>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <ProvenanceBadge kind="editorial" />
          <h2>Problem → solution</h2>
          <SectionConfidence intelligence={intelligence} section="problem" />
        </div>
        <div className="detail-columns">
          <div>
            <h3>Problem</h3>
            <p>{intelligence.problem.problemStatement}</p>
            <h3>Pain points</h3>
            <List items={intelligence.problem.painPoints} />
          </div>
          <div>
            <h3>Solution approach</h3>
            <p>{intelligence.problem.solutionApproach}</p>
            {intelligence.problem.whyItMatters ? <><h3>Why it matters</h3><p>{intelligence.problem.whyItMatters}</p></> : null}
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading"><ProvenanceBadge kind="editorial" /><h2>Why it is different</h2></div>
        <div className="detail-columns">
          <div><h3>Differentiators</h3><List items={intelligence.differentiation.differentiators} /></div>
          <div><h3>Design philosophy</h3><List items={intelligence.differentiation.designPhilosophy} /></div>
          <div><h3>Unique capabilities</h3><List items={intelligence.differentiation.uniqueCapabilities} /></div>
          <div><h3>Design trade-offs</h3><List items={intelligence.differentiation.tradeoffsCreatedByDesign} /></div>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <ProvenanceBadge kind="editorial" />
          <h2>Who should use it</h2>
          <SectionConfidence intelligence={intelligence} section="decision" />
        </div>
        <div className="detail-columns">
          <div><h3>Target users</h3><List items={intelligence.audience.targetUsers} /></div>
          <div><h3>Jobs to be done</h3><List items={intelligence.audience.jobsToBeDone} /></div>
          <div><h3>Best for</h3><List items={intelligence.audience.bestFor} /></div>
          <div><h3>Not ideal for</h3><List items={intelligence.audience.poorFit} /></div>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <ProvenanceBadge kind="editorial" />
          <h2>Architecture</h2>
          <SectionConfidence intelligence={intelligence} section="architecture" />
        </div>
        <p>{intelligence.architecture.overview}</p>
        <div className="idea-grid">
          <Claim label="Architecture style" claim={intelligence.architecture.style} />
          <Claim label="Execution model" claim={intelligence.architecture.executionModel} />
          <Claim label="State model" claim={intelligence.architecture.stateModel} />
          <Claim label="Persistence" claim={intelligence.architecture.persistenceModel} />
          <Claim label="Concurrency" claim={intelligence.architecture.concurrencyModel} />
          <Claim label="Scaling" claim={intelligence.architecture.scalingModel} />
        </div>
        <h3>Core components</h3>
        <div className="idea-grid">
          {intelligence.architecture.components.map((component) => (
            <article className="idea-card" key={component.name}>
              <h3>{component.name}</h3>
              <p>{component.responsibility}</p>
            </article>
          ))}
        </div>
        <h3>Data / control flow</h3>
        <ol>{intelligence.architecture.dataFlow.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <ProvenanceBadge kind="editorial" />
          <h2>Technology</h2>
          <SectionConfidence intelligence={intelligence} section="technology" />
        </div>
        <div className="idea-grid">
          {intelligence.technology.items.map((item) => (
            <article className="idea-card" key={`${item.category}-${item.name}`}>
              <span className="tag">{item.category}</span>
              <h3>{item.name}</h3>
              <p>{item.role}</p>
              <small className="muted">{item.state}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <ProvenanceBadge kind="editorial" />
          <h2>Codebase map</h2>
          <SectionConfidence intelligence={intelligence} section="codebase" />
        </div>
        <p>{intelligence.codebase.structureSummary}</p>
        <div className="idea-grid">
          {intelligence.codebase.importantPaths.map((item) => (
            <article className="idea-card" key={item.path}>
              <code>{item.path}</code>
              <p>{item.purpose}</p>
            </article>
          ))}
        </div>
        <div className="detail-columns">
          <div><h3>Start reading</h3><List items={intelligence.codebase.startReading} /></div>
          <div><h3>Entry points</h3><List items={intelligence.codebase.entryPoints} /></div>
          <div><h3>Extension points</h3><List items={intelligence.codebase.extensionPoints} /></div>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <ProvenanceBadge kind="editorial" />
          <h2>Developer workflow</h2>
          <SectionConfidence intelligence={intelligence} section="developer_workflow" />
        </div>
        <Claim label="Local setup" claim={intelligence.developerWorkflow.localSetup} />
        {intelligence.developerWorkflow.commands.length ? (
          <div className="source-list">
            {intelligence.developerWorkflow.commands.map((item) => (
              <div key={`${item.purpose}-${item.command}`}>
                <strong>{item.purpose}</strong> · <code>{item.command}</code>
              </div>
            ))}
          </div>
        ) : null}
        <div className="idea-grid">
          <Claim label="Build" claim={intelligence.developerWorkflow.build} />
          <Claim label="Tests" claim={intelligence.developerWorkflow.tests} />
          <Claim label="Lint" claim={intelligence.developerWorkflow.lint} />
          <Claim label="Typecheck" claim={intelligence.developerWorkflow.typecheck} />
          <Claim label="CI/CD" claim={intelligence.developerWorkflow.ciCd} />
          <Claim label="Contribution" claim={intelligence.developerWorkflow.contributionProcess} />
          <Claim label="Release process" claim={intelligence.developerWorkflow.releaseProcess} />
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading"><ProvenanceBadge kind="editorial" /><h2>Integration & extension</h2></div>
        <div className="idea-grid">
          <Claim label="Extension model" claim={intelligence.integration.extensionModel} />
          <Claim label="Plugin system" claim={intelligence.integration.pluginSystem} />
          <Claim label="Adding an extension" claim={intelligence.integration.addingExtension} />
        </div>
        <div className="detail-columns">
          <div><h3>APIs</h3><List items={intelligence.integration.apis} /></div>
          <div><h3>Protocols</h3><List items={intelligence.integration.protocols} /></div>
          <div><h3>Ecosystem integrations</h3><List items={intelligence.integration.integrations} /></div>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <ProvenanceBadge kind="editorial" />
          <h2>Deployment & operations</h2>
          <SectionConfidence intelligence={intelligence} section="deployment_operations" />
        </div>
        <div className="idea-grid">
          <Claim label="Minimum deployment" claim={intelligence.deploymentOperations.minimumDeployment} />
          <Claim label="Production topology" claim={intelligence.deploymentOperations.productionTopology} />
          <Claim label="Persistence" claim={intelligence.deploymentOperations.persistence} />
          <Claim label="Configuration" claim={intelligence.deploymentOperations.configuration} />
          <Claim label="Scaling" claim={intelligence.deploymentOperations.scaling} />
          <Claim label="Observability" claim={intelligence.deploymentOperations.observability} />
          <Claim label="Backup / upgrade" claim={intelligence.deploymentOperations.backupUpgrade} />
          <Claim label="Failure recovery" claim={intelligence.deploymentOperations.failureRecovery} />
          <Claim label="Resource profile" claim={intelligence.deploymentOperations.resourceProfile} />
        </div>
        <h3>Operational risks</h3>
        <List items={intelligence.deploymentOperations.operationalRisks} />
      </section>

      <section className="detail-section">
        <div className="section-heading"><ProvenanceBadge kind="editorial" /><h2>Security & privacy</h2></div>
        <div className="idea-grid">
          <Claim label="Authentication" claim={intelligence.securityPrivacy.authentication} />
          <Claim label="Authorization" claim={intelligence.securityPrivacy.authorization} />
          <Claim label="Secrets" claim={intelligence.securityPrivacy.secrets} />
          <Claim label="Network exposure" claim={intelligence.securityPrivacy.networkExposure} />
          <Claim label="Sandboxing" claim={intelligence.securityPrivacy.sandboxing} />
          <Claim label="Data persisted" claim={intelligence.securityPrivacy.dataPersisted} />
          <Claim label="Data leaving system" claim={intelligence.securityPrivacy.dataLeavesSystem} />
          <Claim label="Telemetry" claim={intelligence.securityPrivacy.telemetry} />
        </div>
        <h3>Security considerations</h3>
        <List items={intelligence.securityPrivacy.securityRisks} />
      </section>

      <section className="detail-section">
        <div className="section-heading"><ProvenanceBadge kind="editorial" /><h2>Decision guide</h2></div>
        <div className="detail-columns">
          <div><h3>Choose when</h3><List items={intelligence.decision.chooseWhen} /></div>
          <div><h3>Avoid when</h3><List items={intelligence.decision.avoidWhen} /></div>
          <div><h3>Evaluate first</h3><List items={intelligence.decision.evaluateFirst} /></div>
          <div><h3>Trade-offs</h3><List items={intelligence.decision.tradeoffs} /></div>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><span>Learning curve</span><strong>{intelligence.decision.learningCurve}</strong></div>
          <div className="metric-card"><span>Operational complexity</span><strong>{intelligence.decision.operationalComplexity}</strong></div>
          <div className="metric-card"><span>Migration cost</span><strong>{intelligence.decision.migrationCost}</strong></div>
          <div className="metric-card"><span>Lock-in</span><strong>{intelligence.decision.lockIn}</strong></div>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading"><ProvenanceBadge kind="editorial" /><h2>Project signals & learning</h2></div>
        <div className="idea-grid">
          <Claim label="Maturity" claim={intelligence.projectSignals.maturity} />
          <Claim label="Governance" claim={intelligence.projectSignals.governance} />
          <Claim label="Licensing" claim={intelligence.projectSignals.licensing} />
        </div>
        <div className="detail-columns">
          <div><h3>Adoption signals</h3><List items={intelligence.projectSignals.adoptionSignals} /></div>
          <div><h3>Ecosystem</h3><List items={intelligence.projectSignals.ecosystem} /></div>
          <div><h3>What you can learn</h3><List items={intelligence.learning.learnings} /></div>
          <div><h3>Suggested reading order</h3><List items={intelligence.learning.readingOrder} /></div>
        </div>
        <p className="muted">
          {intelligence.provider} / {intelligence.model} · {Math.round(intelligence.confidence * 100)}% overall confidence
        </p>
      </section>
    </>
  );
}
