export default function Practice() {
  const brandRed = "#ff0000";

  return (
    <main style={{ fontFamily: 'sans-serif', backgroundColor: '#000', color: '#fff', padding: '0 20px', minHeight: '100vh' }}>
      
      {/* Simple Navbar */}
      <header style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a1a' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
        </a>
        <nav>
          <a href="/" style={{ color: '#fff', textDecoration: 'none', marginRight: '15px' }}>Back to Home</a>
          <a href="/#apply" style={{ background: brandRed, padding: '5px 15px', textDecoration: 'none', color: '#fff', fontWeight: 'bold' }}>Apply Now</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '60px 0 40px 0' }}>
        <h1 style={{ color: brandRed, fontSize: '3rem', margin: '0 0 10px 0' }}>The Practice</h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc', maxWidth: '600px', margin: '0 auto' }}>
          Coaching is not a transaction. It is a shared pursuit of physical mastery and absolute consistency.
        </p>
      </section>

      {/* What We Offer / How We Train */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
        <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: '1fr' }}>
          
          <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '10px', borderLeft: `4px solid ${brandRed}` }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>1-on-1 Private Coaching</h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              Direct, individualized coaching designed to build technical mastery, correct movement deficiencies, and push your physical limits under close supervision.
            </p>
            <span style={{ display: 'inline-block', marginTop: '15px', color: brandRed, fontWeight: 'bold' }}>By Consultation Only</span>
          </div>

          <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '10px', borderLeft: `4px solid ${brandRed}` }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>Remote Programming</h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              For the self-disciplined athlete. Custom-tailored training programs built around your specific equipment, constraints, and athletic goals, complete with video movement analysis.
            </p>
            <span style={{ display: 'inline-block', marginTop: '15px', color: brandRed, fontWeight: 'bold' }}>Monthly Enrollment</span>
          </div>

        </div>
      </section>

      {/* The Standards Section */}
      <section style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: brandRed, fontSize: '2rem' }}>Expectations</h2>
        <p style={{ color: '#ccc', lineHeight: '1.6', fontStyle: 'italic' }}>
          "We do not accept everyone who applies. We accept those who are ready to practice with intent, show up consistently, and respect the process."
        </p>
        <a href="/#apply" style={{ display: 'inline-block', marginTop: '30px', background: brandRed, color: '#fff', padding: '15px 40px', textDecoration: 'none', fontWeight: 'bold' }}>
          Submit Your Intake Application
        </a>
      </section>

    </main>
  );
}
