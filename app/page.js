export default function Home() {
  const applicationUrl = "https://drive.google.com/file/d/1u-OpRabHPBlcsHW5ZAXok61n6OfKfoMF/view?usp=sharing";
  const clientPortalUrl = "#"; // Replace # with your actual Client Portal link

  return (
    <main style={{ fontFamily: 'sans-serif', lineHeight: '1.6', color: '#333' }}>
      {/* Navigation Bar */}
      <nav style={{ padding: '20px', display: 'flex', gap: '15px', justifyContent: 'center', background: '#000', color: '#fff', position: 'sticky', top: '0' }}>
        <a href="#philosophy" style={{ color: '#fff', textDecoration: 'none' }}>Philosophy</a>
        <a href="#coaching" style={{ color: '#fff', textDecoration: 'none' }}>Coaching</a>
        <a href="#about" style={{ color: '#fff', textDecoration: 'none' }}>About</a>
        <a href="#journal" style={{ color: '#fff', textDecoration: 'none' }}>Journal</a>
        <a href="#faq" style={{ color: '#fff', textDecoration: 'none' }}>FAQ</a>
        <a href="#contact" style={{ color: '#fff', textDecoration: 'none' }}>Contact</a>
        <a href={clientPortalUrl} style={{ color: '#ff0000', textDecoration: 'none', fontWeight: 'bold' }}>Client Portal</a>
        <a href={applicationUrl} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>Apply</a>
      </nav>

      {/* Philosophy */}
      <section id="philosophy" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Philosophy</h2>
        <p style={{ maxWidth: '800px', margin: 'auto' }}>We cultivate better people, not just better athletes. By focusing on conduct, intention, and high standards of accountability, we ensure excellence in every rep.</p>
      </section>

      {/* Coaching & Principles */}
      <section id="coaching" style={{ padding: '80px 20px', background: '#f4f4f4' }}>
        <h2 style={{ textAlign: 'center' }}>Coaching</h2>
        <div style={{ maxWidth: '800px', margin: 'auto' }}>
          <p>We provide structured, purposeful athletic programming. Our methodology is built on the following 5 Principles:</p>
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
      <section id="about" style={{ padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center' }}>About</h2>
        <p style={{ maxWidth: '800px', margin: 'auto' }}>Iwamizu Athletic Performance. Professional coaching driven by data, accountability, and the development of the athlete's total potential.</p>
      </section>

      {/* Journal */}
      <section id="journal" style={{ padding: '80px 20px', background: '#f4f4f4' }}>
        <h2 style={{ textAlign: 'center' }}>Journal</h2>
        <p style={{ textAlign: 'center' }}>Recent insights, training updates, and performance metrics.</p>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center' }}>FAQ</h2>
        <div style={{ maxWidth: '800px', margin: 'auto' }}>
          <p><strong>How do I start?</strong> Click the "Apply" link in the navigation bar to submit your application.</p>
          <p><strong>What is the focus?</strong> We utilize data-driven methods, including VBT (Velocity Based Training), to optimize your results.</p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '80px 20px', background: '#333', color: '#fff', textAlign: 'center' }}>
        <h2>Contact</h2>
        <p>Jo Iwamizu | 541-908-7016</p>
        <div style={{ marginTop: '10px' }}>
          <a href="https://www.facebook.com/share/1SShnyHmTz/?mibextid=wwXIfr" style={{ color: '#fff', margin: '0 10px' }}>Facebook</a>
          <a href="https://www.instagram.com/iwamizu_athletic_performance?igsh=dGl1ZTAxN25zcXBw&utm_source=qr" style={{ color: '#fff', margin: '0 10px' }}>Instagram</a>
        </div>
      </section>
    </main>
  );
}
