export default function Home() {
  return (
    <main>
      <header style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
        <img 
          src="/logo.png" 
          alt="Iwamizu Athletic Performance" 
          width="150" 
          height="150" 
        />
        <nav style={{ marginTop: '20px' }}>
          <a href="#about" style={{ marginRight: '15px' }}>About</a>
          <a href="#methodology" style={{ marginRight: '15px' }}>Methodology</a>
          <a href="#rookies" style={{ marginRight: '15px' }}>Rookies</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section id="about" style={{ padding: '20px' }}>
        <h2>About</h2>
        <p>Expert strength and conditioning coaching focused on technical precision.</p>
      </section>

      <section id="methodology" style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
        <h2>Methodology</h2>
        <p>Utilizing VBT and RSI metrics for data-driven athletic development.</p>
      </section>

      <section id="rookies" style={{ padding: '20px' }}>
        <h2>Rookies Program</h2>
        <p>Foundational movement and deceleration mechanics for youth athletes.</p>
      </section>

      <section id="contact" style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
        <h2>Contact</h2>
        <p>Ready to train? Reach out for your assessment.</p>
      </section>
    </main>
  );
}
