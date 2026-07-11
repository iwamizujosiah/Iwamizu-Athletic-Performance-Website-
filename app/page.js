export default function Home() {
  const applicationUrl = "https://drive.google.com/file/d/1u-OpRabHPBlcsHW5ZAXok61n6OfKfoMF/view?usp=sharing";
  const brandRed = "#ff0000";

  return (
    <main style={{ fontFamily: 'sans-serif', backgroundColor: '#000', color: '#fff', padding: '0 20px' }}>
      
      {/* Navbar */}
      <header style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
        <nav style={{ display: 'flex', gap: '10px' }}>
          {['Home', 'Philosophy', 'Principles', 'Connect'].map(item => (
            <a href={`#${item.toLowerCase()}`} style={{ color: '#fff', textDecoration: 'none' }}>{item}</a>
          ))}
          <a href={applicationUrl} style={{ background: '#333', padding: '5px 10px', textDecoration: 'none', color: '#fff', border: '1px solid #fff' }}>Apply</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1 style={{ color: brandRed, fontSize: '3rem' }}>The Way of Athletic Performance</h1>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Here at Iwamizu Athletic Performance strength is not built in a single workout. It is forged through disciplined practice, purposeful movement, and relentless refinement.</p>
        <a href={applicationUrl} style={{ display: 'inline-block', background: brandRed, color: '#fff', padding: '15px 40px', textDecoration: 'none', fontWeight: 'bold' }}>Begin Your Journey</a>
      </section>

      {/* Core Values Grid */}
      <section style={{ padding: '40px 0' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Core Values</h2>
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr' }}>
          {[
            { title: 'Continuous Improvement', desc: 'Small improvements, consistently pursued, create extraordinary results.' },
            { title: 'Disciplined Training', desc: 'Strength is earned through deliberate practice and consistency.' },
            { title: 'Sincerity', desc: 'Honest coaching. Honest effort. Honest results.' },
            { title: 'The Way', desc: 'Training is not an event. It is a lifelong practice.' }
          ].map(card => (
            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{card.title}</h3>
              <p style={{ margin: 0, color: '#ccc' }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" style={{ padding: '40px 0' }}>
        <h2 style={{ color: brandRed }}>Coach Philosophy</h2>
        <p>We believe strength is earned through disciplined practice, refined through intentional coaching, and sustained by lifelong learning. Every session is an opportunity to improve—not only as an athlete, but as a person.</p>
      </section>

      {/* The Five Principles */}
      <section id="principles" style={{ padding: '40px 0' }}>
        <h2 style={{ fontSize: '2rem' }}>The Five Principles</h2>
        {[
          { t: 'Purpose', d: 'Every movement has intent.' },
          { t: 'Precision', d: 'Quality before quantity.' },
          { t: 'Discipline', d: 'Consistency beats intensity.' },
          { t: 'Mastery', d: 'Practice never ends.' },
          { t: 'Legacy', d: 'Train for the person you will become.' }
        ].map(p => (
          <div style={{ borderBottom: '1px solid #333', padding: '15px 0' }}>
            <h3 style={{ color: brandRed, margin: 0 }}>{p.t}</h3>
            <p style={{ margin: 0 }}>{p.d}</p>
          </div>
        ))}
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
