export default function Practice() {
  const brandRed = "#ff0000";

  const tiers = [
    {
      title: "Foundation",
      price: "$149–199",
      period: "/month",
      features: [
        "Personalized program (4-week block)",
        "Access to the client portal",
        "Exercise library",
        "Monthly program update",
        "Email support (48-hour response)"
      ],
      footerNote: "No weekly check-ins.",
      badge: null
    },
    {
      title: "Progression",
      price: "$249",
      period: "/month",
      features: [
        "Everything in Foundation, plus:",
        "Monthly training review",
        "Monthly program adjustments",
        "Priority email support",
        "Nutrition guidelines"
      ],
      footerNote: "Still no weekly calls.",
      badge: null
    },
    {
      title: "Performance",
      price: "$349",
      period: "/month",
      features: [
        "Bi-weekly programming updates",
        "Form review (up to 3 videos/month)",
        "Monthly strategy call",
        "Priority messaging"
      ],
      footerNote: "",
      badge: "Limited Spots Available"
    }
  ];

  return (
    <main style={{ fontFamily: 'sans-serif', backgroundColor: '#000', color: '#fff', padding: '0 20px', minHeight: '100vh', pb: '80px' }}>
      
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

      {/* Pricing Grid */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 0 60px 0' }}>
        <div style={{ 
          display: 'grid', 
          gap: '25px', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' 
        }}>
          {tiers.map((tier) => (
            <div 
              key={tier.title} 
              style={{ 
                background: '#1a1a1a', 
                padding: '30px', 
                borderRadius: '10px', 
                borderLeft: `4px solid ${brandRed}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                position: 'relative'
              }}
            >
              <div>
                {/* Badge for Limited Spots */}
                {tier.badge && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '15px', 
                    right: '15px', 
                    backgroundColor: brandRed, 
                    color: '#fff', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    padding: '3px 8px', 
                    borderRadius: '4px' 
                  }}>
                    {tier.badge}
                  </span>
                )}

                {/* Title and Price */}
                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>{tier.title}</h2>
                <div style={{ marginBottom: '25px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: brandRed }}>{tier.price}</span>
                  <span style={{ color: '#aaa', fontSize: '1rem' }}>{tier.period}</span>
                </div>

                {/* Features List */}
                <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 30px 0' }}>
                  {tier.features.map((feat, idx) => (
                    <li key={idx} style={{ 
                      padding: '8px 0', 
                      color: '#ccc', 
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ color: brandRed, marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer notes / Warnings */}
              <div>
                {tier.footerNote && (
                  <p style={{ margin: '0 0 20px 0', color: '#ff4d4d', fontSize: '0.9rem', fontStyle: 'italic', fontWeight: 'bold' }}>
                    ✕ {tier.footerNote}
                  </p>
                )}
                <a 
                  href="/#apply" 
                  style={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    background: 'transparent', 
                    color: '#fff', 
                    border: '1px solid #fff', 
                    padding: '12px 0', 
                    textDecoration: 'none', 
                    fontWeight: 'bold',
                    borderRadius: '5px',
                    transition: '0.2s'
                  }}
                  onMouseEnter={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#000'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                >
                  Select {tier.title}
                </a>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Footer Banner */}
      <section style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '600px', margin: '0 auto', borderTop: '1px solid #1a1a1a' }}>
        <h2 style={{ color: brandRed, fontSize: '1.8rem' }}>Ready to Begin?</h2>
        <p style={{ color: '#ccc', lineHeight: '1.6', margin: '10px 0 25px 0' }}>
          Spaces are limited to ensure elite level oversight and personalized adjustments.
        </p>
        <a href="/#apply" style={{ display: 'inline-block', background: brandRed, color: '#fff', padding: '15px 40px', textDecoration: 'none', fontWeight: 'bold' }}>
          Submit Your Intake Application
        </a>
      </section>

    </main>
  );
}
