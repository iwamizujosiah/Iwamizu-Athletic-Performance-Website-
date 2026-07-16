export default function Home() {
  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfIeWDyCtHH8teR4vRPkNWzBdn0_0o6IYzOBC4CdTsaVi1h_w/viewform?embedded=true";
  const clientPortalUrl = "/portal"; 
  const brandRed = "#ff0000";

  return (
    <main style={{ fontFamily: 'sans-serif', backgroundColor: '#000', color: '#fff', padding: '0 20px' }}>
      
      {/* Navbar */}
      <header style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
        <nav style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#home" style={{ color: '#fff', textDecoration: 'none' }}>Home</a>
          <a href="#philosophy" style={{ color: '#fff', textDecoration: 'none' }}>Philosophy</a>
          <a href="#principles" style={{ color: '#fff', textDecoration: 'none' }}>Principles</a>
          <a href="/practice" style={{ color: brandRed, textDecoration: 'none', fontWeight: 'bold' }}>The Practice</a>
          <a href="#apply" style={{ color: '#fff', textDecoration: 'none' }}>Apply</a>
          <a href="#connect" style={{ color: '#fff', textDecoration: 'none' }}>Connect</a>
          <a href={clientPortalUrl} style={{ background: '#333', padding: '5px 10px', textDecoration: 'none', color: '#fff', border: '1px solid #fff' }}>Client Portal</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1 style={{ color: brandRed, fontSize: '3rem' }}>The Way of Athletic Performance</h1>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Here at Iwamizu Athletic Performance strength is not built in a single workout. It is forged through disciplined practice, purposeful movement, and relentless refinement.</p>
        <a href="#apply" style={{ display: 'inline-block', background: brandRed, color: '#fff', padding: '15px 40px', textDecoration: 'none', fontWeight: 'bold' }}>Begin Your Journey</a>
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
            <div key={card.title} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
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
          <div key={p.t} style={{ borderBottom: '1px solid #333', padding: '15px 0' }}>
            <h3 style={{ color: brandRed, margin: 0 }}>{p.t}</h3>
            <p style={{ margin: 0 }}>{p.d}</p>
          </div>
        ))}
      </section>

      {/* Embedded Google Form Section */}
      <section id="apply" style={{ padding: '60px 0', borderTop: '1px solid #333' }}>
        <h2 style={{ color: brandRed, fontSize: '2.5rem', textAlign: 'center', marginBottom: '10px' }}>Athlete Application</h2>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#ccc' }}>Fill out the application below to join our discipline-driven coaching space.</p>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#1a1a1a', borderRadius: '10px', padding: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '160%', maxHeight: '1400px' }}>
            <iframe 
              src={googleFormUrl} 
              width="100%" 
              height="100%" 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
              frameBorder="0" 
              marginHeight="0" 
              marginWidth="0"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </section>

      {/* Connect */}
      <section id="connect" style={{ padding: '50px 20px', textAlign: 'center', borderTop: `2px solid ${brandRed}` }}>
        <h2 style={{ color: brandRed }}>Connect</h2>
        <p style={{ color: brandRed, lineHeight: '1.6' }}>
          Jo Iwamizu <br />
          <a href="tel:5419087016" style={{ color: brandRed, fontWeight: 'bold', textDecoration: 'none' }}>
            541-908-7016
          </a> <br />
          <a href="mailto:coaching@iwamizuathleticperformance.com" style={{ color: brandRed, fontWeight: 'bold', textDecoration: 'none' }}>
            coaching@iwamizuathleticperformance.com
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
