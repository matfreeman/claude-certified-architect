import type { Domain } from '../types'

interface Props {
  domains: Domain[]
  totalQuestions: number
  onStart: (domainFilter: number | null) => void
}

export default function Home({ domains, totalQuestions, onStart }: Props) {
  return (
    <div className="home">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-inner">
          <div className="badge-row">
            <span className="badge badge-cert">CERTIFICATION PREP</span>
            <span className="badge badge-v">v0.1 · Feb 2025</span>
          </div>
          <h1 className="home-title">
            Claude Certified Architect
            <span className="home-title-sub">Foundations</span>
          </h1>
          <p className="home-desc">
            Interactive study quiz covering all 5 exam domains. Scenario-based questions with
            detailed explanations and direct links to the official Claude documentation.
          </p>
          <div className="home-meta">
            <MetaStat label="Questions" value={totalQuestions.toString()} />
            <MetaStat label="Domains" value="5" />
            <MetaStat label="Passing score" value="720 / 1000" />
            <MetaStat label="Format" value="Multiple choice" />
          </div>
        </div>
      </header>

      {/* Domains */}
      <section className="home-section">
        <div className="section-inner">
          <h2 className="section-title">Exam Domains</h2>
          <div className="domain-grid">
            {domains.map((d) => (
              <DomainCard key={d.id} domain={d} onStudy={() => onStart(d.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="section-inner cta-inner">
          <div className="cta-text">
            <h2 className="cta-title">Ready to practice?</h2>
            <p className="cta-desc">
              Take a full mixed-domain quiz or focus on a specific area. Each question includes
              the correct answer, a detailed explanation, and a link to the relevant
              documentation.
            </p>
          </div>
          <div className="cta-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => onStart(null)}>
              Start Full Practice Exam
              <span className="btn-arrow">→</span>
            </button>
            <p className="cta-hint">Or click a domain card above to study by topic</p>
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="home-section home-section-alt">
        <div className="section-inner">
          <h2 className="section-title">Exam Scenarios</h2>
          <p className="scenarios-desc">
            The exam presents 4 of 6 possible scenarios. Questions are grounded in realistic
            production contexts.
          </p>
          <div className="scenarios-grid">
            {SCENARIOS.map((s) => (
              <div key={s.name} className="scenario-chip">
                <span className="scenario-icon">{s.icon}</span>
                <span className="scenario-name">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-stat">
      <span className="meta-value">{value}</span>
      <span className="meta-label">{label}</span>
    </div>
  )
}

function DomainCard({ domain, onStudy }: { domain: Domain; onStudy: () => void }) {
  return (
    <div className="domain-card" style={{ '--domain-color': domain.color, '--domain-bg': domain.bgColor } as React.CSSProperties}>
      <div className="domain-card-header">
        <span className="domain-weight">{domain.weight}%</span>
        <span className="domain-id">Domain {domain.id}</span>
      </div>
      <h3 className="domain-card-name">{domain.name}</h3>
      <p className="domain-card-desc">{domain.description}</p>
      <ul className="domain-tasks">
        {domain.taskStatements.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="domain-card-footer">
        <button className="btn btn-domain" onClick={onStudy}>
          Study this domain
        </button>
        <a
          className="domain-doc-link"
          href={domain.docLink.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {domain.docLink.text} ↗
        </a>
      </div>
    </div>
  )
}

const SCENARIOS = [
  { name: 'Customer Support Resolution Agent', icon: '🎧' },
  { name: 'Code Generation with Claude Code', icon: '💻' },
  { name: 'Multi-Agent Research System', icon: '🔬' },
  { name: 'Developer Productivity with Claude', icon: '⚡' },
  { name: 'Claude Code for Continuous Integration', icon: '🔄' },
  { name: 'Structured Data Extraction', icon: '📊' },
]
