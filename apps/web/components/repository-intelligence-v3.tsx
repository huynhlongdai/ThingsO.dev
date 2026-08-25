import { ProvenanceBadge } from "@/components/provenance-badge";
import type {
  IntelligenceClaim,
  RepositoryIntelligenceV3,
} from "@/lib/intelligence";

const NOT_ESTABLISHED = "Not established from available evidence.";

function EmptyState() {
  return <p className="empty-evidence"><span aria-hidden="true">?</span>{NOT_ESTABLISHED}</p>;
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <EmptyState />;
  return <ul className="intelligence-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function Claim({ label, claim }: { label: string; claim: IntelligenceClaim }) {
  const established = Boolean(claim.value);
  return (
    <article className={`knowledge-card knowledge-card--${claim.state}`}>
      <div className="knowledge-card__topline">
        <h3>{label}</h3>
        <span className={`knowledge-state knowledge-state--${claim.state}`}>{claim.state}</span>
      </div>
      <p className={established ? undefined : "muted"}>{claim.value ?? NOT_ESTABLISHED}</p>
      {claim.confidence !== null ? <small>{Math.round(claim.confidence * 100)}% confidence</small> : null}
    </article>
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
  if (confidence === null || confidence === undefined) {
    return <span className="section-confidence section-confidence--incomplete">Evidence incomplete</span>;
  }
  return <span className="section-confidence">{Math.round(confidence * 100)}% confidence</span>;
}

function SectionHeader({
  intelligence,
  section,
  eyebrow,
  title,
  description,
}: {
  intelligence: RepositoryIntelligenceV3;
  section: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="intelligence-heading">
      <div>
        <div className="intelligence-heading__meta">
          <ProvenanceBadge kind="editorial" />
          <span>{eyebrow}</span>
        </div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <SectionConfidence intelligence={intelligence} section={section} />
    </div>
  );
}

function TechnicalSection({
  id,
  title,
  eyebrow,
  confidence,
  children,
}: {
  id: string;
  title: string;
  eyebrow: string;
  confidence: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details className="technical-section" id={id}>
      <summary>
        <div>
          <span className="technical-section__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="technical-section__summary-meta">
          {confidence}
          <span className="technical-section__toggle">Open details</span>
        </div>
      </summary>
      <div className="technical-section__body">{children}</div>
    </details>
  );
}

export function RepositoryIntelligenceV3View({
  intelligence,
}: {
  intelligence: RepositoryIntelligenceV3;
}) {
  return (
    <div className="repository-intelligence">
      <section className="intelligence-section intelligence-section--overview" id="overview">
        <SectionHeader
          intelligence={intelligence}
          section="identity"
          eyebrow="Overview"
          title="What it is"
          description="A concise repository identity before the deeper technical analysis."
        />
        <p className="intelligence-definition">{intelligence.identity.definition}</p>
        <div className="identity-metrics">
          <div><span>Product type</span><strong>{intelligence.identity.productType}</strong></div>
          <div><span>Primary role</span><strong>{intelligence.identity.primaryRole}</strong></div>
          <div><span>Category</span><strong>{intelligence.identity.primaryCategory}</strong></div>
          <div><span>Interaction</span><strong>{intelligence.identity.interactionModel ?? "Not established"}</strong></div>
        </div>
      </section>

      <section className="intelligence-section intelligence-section--problem" id="problem-solution">
        <SectionHeader
          intelligence={intelligence}
          section="problem"
          eyebrow="Context"
          title="Problem → solution"
          description="What the project is trying to solve and how the repository approaches it."
        />
        <div className="intelligence-split intelligence-split--problem">
          <article className="content-panel content-panel--problem">
            <span className="content-panel__label">The problem</span>
            <p className="content-panel__lead">{intelligence.problem.problemStatement}</p>
            <h3>Pain points</h3>
            <List items={intelligence.problem.painPoints} />
          </article>
          <article className="content-panel content-panel--solution">
            <span className="content-panel__label">The solution</span>
            <p className="content-panel__lead">{intelligence.problem.solutionApproach}</p>
            <h3>Why it matters</h3>
            {intelligence.problem.whyItMatters ? <p>{intelligence.problem.whyItMatters}</p> : <EmptyState />}
          </article>
        </div>
      </section>

      <section className="intelligence-section intelligence-section--different" id="differentiation">
        <SectionHeader
          intelligence={intelligence}
          section="differentiation"
          eyebrow="Positioning"
          title="Why it is different"
          description="Only evidence-backed differentiation is shown; missing evidence stays explicit."
        />
        <div className="intelligence-grid intelligence-grid--four">
          <article className="content-panel"><span className="content-panel__label">Differentiators</span><List items={intelligence.differentiation.differentiators} /></article>
          <article className="content-panel"><span className="content-panel__label">Unique capabilities</span><List items={intelligence.differentiation.uniqueCapabilities} /></article>
          <article className="content-panel"><span className="content-panel__label">Design philosophy</span><List items={intelligence.differentiation.designPhilosophy} /></article>
          <article className="content-panel"><span className="content-panel__label">Design trade-offs</span><List items={intelligence.differentiation.tradeoffsCreatedByDesign} /></article>
        </div>
      </section>

      <section className="intelligence-section intelligence-section--capabilities" id="capabilities-limitations">
        <SectionHeader
          intelligence={intelligence}
          section="problem"
          eyebrow="Product reality"
          title="Capabilities & limitations"
          description="What the repository can do today, and the boundaries that matter before adoption."
        />
        <div className="intelligence-split">
          <article className="content-panel content-panel--positive">
            <span className="content-panel__label">Capabilities</span>
            <List items={intelligence.capabilities} />
          </article>
          <article className="content-panel content-panel--warning">
            <span className="content-panel__label">Limitations</span>
            <List items={intelligence.limitations} />
          </article>
        </div>
      </section>

      <section className="intelligence-section intelligence-section--decision" id="decision-guide">
        <SectionHeader
          intelligence={intelligence}
          section="decision"
          eyebrow="Decision"
          title="Fit & decision guide"
          description="Use-case fit comes before implementation detail: when to choose it, when to avoid it, and what to evaluate first."
        />
        <div className="intelligence-grid intelligence-grid--four decision-guide-grid">
          <article className="content-panel content-panel--positive"><span className="content-panel__label">Best for</span><List items={intelligence.audience.bestFor} /></article>
          <article className="content-panel content-panel--warning"><span className="content-panel__label">Poor fit</span><List items={intelligence.audience.poorFit} /></article>
          <article className="content-panel"><span className="content-panel__label">Choose when</span><List items={intelligence.decision.chooseWhen} /></article>
          <article className="content-panel"><span className="content-panel__label">Evaluate first</span><List items={intelligence.decision.evaluateFirst} /></article>
        </div>
        <div className="decision-metrics">
          <div><span>Learning curve</span><strong>{intelligence.decision.learningCurve}</strong></div>
          <div><span>Operational complexity</span><strong>{intelligence.decision.operationalComplexity}</strong></div>
          <div><span>Migration cost</span><strong>{intelligence.decision.migrationCost}</strong></div>
          <div><span>Lock-in</span><strong>{intelligence.decision.lockIn}</strong></div>
        </div>
        <div className="intelligence-split intelligence-split--compact">
          <article className="content-panel"><span className="content-panel__label">Avoid when</span><List items={intelligence.decision.avoidWhen} /></article>
          <article className="content-panel"><span className="content-panel__label">Trade-offs</span><List items={intelligence.decision.tradeoffs} /></article>
        </div>
      </section>

      <div className="technical-stack" aria-label="Technical intelligence">
        <TechnicalSection
          id="architecture"
          eyebrow="System design"
          title="Architecture"
          confidence={<SectionConfidence intelligence={intelligence} section="architecture" />}
        >
          <p className="technical-intro">{intelligence.architecture.overview}</p>
          <div className="knowledge-grid">
            <Claim label="Architecture style" claim={intelligence.architecture.style} />
            <Claim label="Execution model" claim={intelligence.architecture.executionModel} />
            <Claim label="State model" claim={intelligence.architecture.stateModel} />
            <Claim label="Persistence" claim={intelligence.architecture.persistenceModel} />
            <Claim label="Concurrency" claim={intelligence.architecture.concurrencyModel} />
            <Claim label="Scaling" claim={intelligence.architecture.scalingModel} />
          </div>
          <h3>Core components</h3>
          {intelligence.architecture.components.length ? (
            <div className="component-grid">
              {intelligence.architecture.components.map((component) => (
                <article className="component-card" key={component.name}>
                  <h3>{component.name}</h3>
                  <p>{component.responsibility}</p>
                </article>
              ))}
            </div>
          ) : <EmptyState />}
          <h3>Data / control flow</h3>
          {intelligence.architecture.dataFlow.length ? (
            <ol className="flow-list">{intelligence.architecture.dataFlow.map((step) => <li key={step}>{step}</li>)}</ol>
          ) : <EmptyState />}
        </TechnicalSection>

        <TechnicalSection
          id="technology"
          eyebrow="Stack"
          title="Technology"
          confidence={<SectionConfidence intelligence={intelligence} section="technology" />}
        >
          {intelligence.technology.items.length ? (
            <div className="technology-grid">
              {intelligence.technology.items.map((item) => (
                <article className={`technology-card technology-card--${item.state}`} key={`${item.category}-${item.name}`}>
                  <span>{item.category}</span>
                  <h3>{item.name}</h3>
                  <p>{item.role}</p>
                  <small>{item.state}</small>
                </article>
              ))}
            </div>
          ) : <EmptyState />}
        </TechnicalSection>

        <TechnicalSection
          id="codebase"
          eyebrow="Developer map"
          title="Codebase"
          confidence={<SectionConfidence intelligence={intelligence} section="codebase" />}
        >
          <p className="technical-intro">{intelligence.codebase.structureSummary}</p>
          {intelligence.codebase.importantPaths.length ? (
            <div className="component-grid">
              {intelligence.codebase.importantPaths.map((item) => (
                <article className="component-card" key={item.path}>
                  <code>{item.path}</code>
                  <p>{item.purpose}</p>
                </article>
              ))}
            </div>
          ) : <EmptyState />}
          <div className="intelligence-grid intelligence-grid--three">
            <article className="content-panel"><span className="content-panel__label">Start reading</span><List items={intelligence.codebase.startReading} /></article>
            <article className="content-panel"><span className="content-panel__label">Entry points</span><List items={intelligence.codebase.entryPoints} /></article>
            <article className="content-panel"><span className="content-panel__label">Extension points</span><List items={intelligence.codebase.extensionPoints} /></article>
          </div>
        </TechnicalSection>

        <TechnicalSection
          id="developer-workflow"
          eyebrow="Developer experience"
          title="Developer workflow"
          confidence={<SectionConfidence intelligence={intelligence} section="developer_workflow" />}
        >
          <div className="knowledge-grid"><Claim label="Local setup" claim={intelligence.developerWorkflow.localSetup} /></div>
          {intelligence.developerWorkflow.commands.length ? (
            <div className="command-list">
              {intelligence.developerWorkflow.commands.map((item) => (
                <div key={`${item.purpose}-${item.command}`}><strong>{item.purpose}</strong><code>{item.command}</code></div>
              ))}
            </div>
          ) : <EmptyState />}
          <div className="knowledge-grid">
            <Claim label="Build" claim={intelligence.developerWorkflow.build} />
            <Claim label="Tests" claim={intelligence.developerWorkflow.tests} />
            <Claim label="Lint" claim={intelligence.developerWorkflow.lint} />
            <Claim label="Typecheck" claim={intelligence.developerWorkflow.typecheck} />
            <Claim label="CI/CD" claim={intelligence.developerWorkflow.ciCd} />
            <Claim label="Contribution" claim={intelligence.developerWorkflow.contributionProcess} />
            <Claim label="Release process" claim={intelligence.developerWorkflow.releaseProcess} />
          </div>
        </TechnicalSection>

        <TechnicalSection
          id="integration"
          eyebrow="Extension model"
          title="Integration & extension"
          confidence={<SectionConfidence intelligence={intelligence} section="integration" />}
        >
          <div className="knowledge-grid">
            <Claim label="Extension model" claim={intelligence.integration.extensionModel} />
            <Claim label="Plugin system" claim={intelligence.integration.pluginSystem} />
            <Claim label="Adding an extension" claim={intelligence.integration.addingExtension} />
          </div>
          <div className="intelligence-grid intelligence-grid--three">
            <article className="content-panel"><span className="content-panel__label">APIs</span><List items={intelligence.integration.apis} /></article>
            <article className="content-panel"><span className="content-panel__label">Protocols</span><List items={intelligence.integration.protocols} /></article>
            <article className="content-panel"><span className="content-panel__label">Ecosystem integrations</span><List items={intelligence.integration.integrations} /></article>
          </div>
        </TechnicalSection>

        <TechnicalSection
          id="deployment"
          eyebrow="Operations"
          title="Deployment & operations"
          confidence={<SectionConfidence intelligence={intelligence} section="deployment_operations" />}
        >
          <div className="knowledge-grid">
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
        </TechnicalSection>

        <TechnicalSection
          id="security"
          eyebrow="Boundaries"
          title="Security & privacy"
          confidence={<SectionConfidence intelligence={intelligence} section="security_privacy" />}
        >
          <div className="knowledge-grid">
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
        </TechnicalSection>

        <TechnicalSection
          id="signals"
          eyebrow="Repository context"
          title="Project signals & learning"
          confidence={<SectionConfidence intelligence={intelligence} section="project_signals" />}
        >
          <div className="knowledge-grid">
            <Claim label="Maturity" claim={intelligence.projectSignals.maturity} />
            <Claim label="Governance" claim={intelligence.projectSignals.governance} />
            <Claim label="Licensing" claim={intelligence.projectSignals.licensing} />
          </div>
          <div className="intelligence-grid intelligence-grid--four">
            <article className="content-panel"><span className="content-panel__label">Adoption signals</span><List items={intelligence.projectSignals.adoptionSignals} /></article>
            <article className="content-panel"><span className="content-panel__label">Ecosystem</span><List items={intelligence.projectSignals.ecosystem} /></article>
            <article className="content-panel"><span className="content-panel__label">What you can learn</span><List items={intelligence.learning.learnings} /></article>
            <article className="content-panel"><span className="content-panel__label">Suggested reading order</span><List items={intelligence.learning.readingOrder} /></article>
          </div>
          <p className="intelligence-provenance-line">
            {intelligence.provider} / {intelligence.model} · {Math.round(intelligence.confidence * 100)}% overall confidence
          </p>
        </TechnicalSection>
      </div>
    </div>
  );
}
