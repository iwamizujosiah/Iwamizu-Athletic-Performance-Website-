export default function Home() {
  return (
    <main style={{ backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
      
      {/* Navigation */}
      <nav style={{ padding: '20px', borderBottom: '2px solid red' }}>
        <h1>Iwamizu Athletic Performance</h1>
      </nav>

      {/* Sections */}
      <section id="about" style={{ padding: '40px' }}>
        <h2>About Us</h2>
      </section>

      <section id="services" style={{ padding: '40px', backgroundColor: '#1a1a1a' }}>
        <h2>Services Provided</h2>
      </section>

      <section id="pricing" style={{ padding: '40px' }}>
        <h2>Pricing Tiers</h2>
      </section>

      <section id="testimonials" style={{ padding: '40px', backgroundColor: '#1a1a1a' }}>
        <h2>Testimonials</h2>
      </section>

      <footer style={{ padding: '20px', textAlign: 'center', borderTop: '2px solid red' }}>
        <p>Follow us on <a href="https://instagram.com" style={{ color: 'red' }}>Instagram</a></p>
      </footer>
      
    </main>
  );
}
