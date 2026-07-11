export default function Home() {
  const applicationUrl = "https://drive.google.com/file/d/1u-OpRabHPBlcsHW5ZAXok61n6OfKfoMF/view?usp=sharing";
  const clientPortalUrl = "#"; 
  const brandRed = "#ff0000";

  return (
    <main style={{ fontFamily: 'sans-serif', lineHeight: '1.6', backgroundColor: '#000', color: brandRed }}>
      
      {/* Header */}
      <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${brandRed}` }}>
        <img src="/logo.png" alt="Logo" style={{ height: '50px' }} />
        <nav style={{ display: 'flex', gap: '20px' }}>
          <a href="#philosophy" style={{ color: brandRed, textDecoration: 'none' }}>Philosophy</a>
          <a href="#coaching" style={{ color: brandRed, textDecoration: 'none' }}>Coaching</a>
          <a href="#about" style={{ color: brandRed, textDecoration: 'none' }}>About</a>
          <a href="#journal" style={{ color: brandRed, textDecoration: 'none' }}>Journal</a>
          <a href="#faq" style={{ color: brandRed, textDecoration: 'none' }}>FAQ</a>
          <a href="#connect" style={{ color: brandRed, textDecoration: 'none' }}>Connect</a>
          <a href={clientPortalUrl} style={{ color: brandRed, fontWeight: 'bold', textDecoration: 'none' }}>Client Portal</a>
          <a href={applicationUrl} style={{ color: brandRed, fontWeight: 'bold', textDecoration: 'none' }}>Apply</a>
        </nav>
      </header>

      {/* Philosophy */}
      <section id="philosophy" style={{ padding: '80px 20px', textAlign: 'center', background: '#111' }}>
        <h2 style={{ color: brandRed }}>Philosophy</h2>
        <p style={{ maxWidth: '800px', margin: 'auto', color: brandRed }}>We cultivate better people, not just better athletes. By focusing on conduct, intention, and high standards of accountability, we ensure excellence in every rep.</p>
      </section>

      {/* Coaching */}
      <section id="coaching" style={{ padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center', color: brandRed }}>Coaching</h2>
        <div style={{ maxWidth: '800px', margin: 'auto', color: brandRed }}>
          <p>We provide structured, purposeful athletic programming based on these 5 Principles:</p>
          <ol>
            <li><strong>Master the Basics:</strong> Perfection in simple movements creates the foundation for elite performance.</li>
            <li><strong>Continuous Improvement:</strong> The pursuit of progress, not perfection.</li>
            <li><strong>Mindful Effort:</strong> Every movement has a purpose and requires total presence.</li>
            <li><strong>Structural Integrity:</strong> Prioritizing longevity and movement quality.</li>
            <li><strong>Relentless Discipline:</strong> Doing the work, especially when it is difficult.</li>
          </ol>
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: '80px 20px', background: '#111' }}>
        <h2 style={{ textAlign: 'center', color: brandRed }}>About</h2>
        <p style={{ maxWidth: '800px', margin: 'auto', color: brandRed }}>Iwamizu Athletic Performance. Professional coaching driven by data, accountability, and the development of the athlete's total potential.</p>
      </section>

      {/* Journal */}
      <section id="journal" style={{ padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center', color: brandRed }}>Journal</h2>
        <p style={{ textAlign: 'center', color: brandRed }}>Recent insights, training updates, and performance metrics.</p>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '80px 20px', background: '#111' }}>
        <h2 style={{ textAlign: 'center', color: brandRed }}>FAQ</h2>
        <div style={{ maxWidth: '800px', margin: 'auto', color: brandRed }}>
          <p><strong>How do I start?</strong> Click the "Apply" link in the navigation bar to submit your application.</p>
          <p><strong>What is the focus?</strong> We utilize data-driven methods, including VBT (Velocity Based Training), to optimize your results.</p>
        </div>
      </section>

      {/* Connect */}
      <section id="connect" style={{ padding: '50px 20px', textAlign: 'center', borderTop: `2px solid ${brandRed}` }}>
        <h2 style={{ color: brandRed }}>Connect</h2>
        <p style={{ color: brandRed }}>
          Jo Iwamizu | 
          <a href="tel:5419087016" style={{ color: brandRed, fontWeight: 'bold', textDecoration: 'none', marginLeft: '5px' }}>
            541-908-7016
          </a>
        </p>
        <div style={{ marginTop: '10px' }}>
          <a href="https://www.facebook.com/share/1SShnyHmTz/?mibextid=wwXIfr" style={{ color: brandRed, margin: '0 10px' }}>Facebook</a>
          <a href="https://www.instagram.com/iwamizu_athletic_performance?igsh=dGl1ZTAxN25zcXBw&utm_source=qr" style={{ color: brandRed, margin: '0 10px' }}>Instagram</a>
        </div>
      </section>
    </main>
  );
}

