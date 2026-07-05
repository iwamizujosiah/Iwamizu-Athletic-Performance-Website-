
eexport default function Home() {
  return (
    <main>
      <header style={{ padding: '20px 50px', borderBottom: '1px solid #ccc' }}>
        <img 
          src="/logo.png" 
          alt="Iwamizu Athletic Performance" 
          width="150" 
          height="150" 
        />
        <nav style={{ marginTop: '20px' }}>
          <a href="#about" style={{ marginRight: '15px' }}>About</a>
          <a href="#methodology" style={{ marginRight: '15px' }}>Methodology</a>
          <a href="#rookies" style={{ marginRight: '15px' }}>Rookies Program</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section id="about" style={{ padding: '40px' }}>
        <h2>About Iwamizu Athletic Performance</h2>
        <p>Expert strength and conditioning coaching focused on technical precision and athletic longevity.</p>
      </section>

      <section id="methodology" style={{ padding: '40px', backgroundColor: '#f4f4f4' }}>
        <h2>Our Methodology</h2>
        <p>We utilize Velocity Based Training (VBT) and Reactive Strength Index (RSI) metrics to objectively track power output and ensure peak performance readiness.</p>
      </section>

      <section id="rookies" style={{ padding: '40px' }}>
        <h2>Rookies Athletic Program</h2>
        <p>Specialized youth development curriculum focusing on proper lifting habits, deceleration mechanics, and foundational athletic movement.</p>
      </section>

      <section id="contact" style={{ padding: '40px', backgroundColor: '#f4f4f4' }}>
        <h2>Contact & Training</h2>
        <p>Interested in professional coaching? Reach out to schedule your assessment.</p>
      </section>
    </main>
  );
}
