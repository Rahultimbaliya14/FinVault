import PageLayout from '../components/PageLayout';

// Replace each url below with your real profile link.
const SOCIAL_LINKS = [
  { label: 'GitHub', url: 'https://github.com/rahultimbaliya14' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/rahul-timbaliya' },
  { label: 'Instagram', url: 'https://www.instagram.com/rahultimbaliya/' },
  { label: 'YouTube', url: 'https://www.youtube.com/@ittechpoint360' },
  { label: 'Portfolio', url: 'https://rahultimbaliya14.github.io/Personal-Portfolio/' },
];

const APP_VERSION = 'v1.0.0';

const About = () => {
  return (
    <PageLayout>
      <div className="mb-4">
        <span className="eyebrow-tab">About</span>
        <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
          FinVault
        </h1>
        <p style={{ color: 'var(--ink-text-muted)' }}>
          A personal ledger for bank accounts, credit cards, SIPs, EMIs, and money owed between you and others —
          one place to see exactly where you stand.
        </p>
        <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>
          {APP_VERSION}
        </span>
      </div>

      <div className="row g-4">
        {/* Creator */}
        <div className="col-md-6">
          <div className="card-paper p-4 h-100">
            <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
              Created By
            </h2>
            <p className="font-display" style={{ fontSize: '1.3rem', color: 'var(--ink-navy)', marginBottom: '0.2rem' }}>
              Rahul Timbaliya
            </p>
            <p className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--ink-text-muted)' }}>
              rahultimbaliya555@gmail.com
            </p>
          </div>
        </div>

        {/* Social links */}
        <div className="col-md-6">
          <div className="card-paper p-4 h-100">
            <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
              Connect
            </h2>
            <div className="d-flex flex-wrap gap-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ledger"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--ink-text-muted)', textAlign: 'center', marginTop: '2rem' }}>
        © {new Date().getFullYear()} FinVault — every rupee, accounted for.
      </p>
    </PageLayout>
  );
};

export default About;