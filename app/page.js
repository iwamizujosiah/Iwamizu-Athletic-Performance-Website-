
export default function Home() {
  return (
    <main>
      <header style={{ padding: '20px 50px' }}>
        {/* Testing with standard img tag to bypass next/image */}
        <img 
          src="/logo.png" 
          alt="Iwamizu Athletic Performance" 
          width="150" 
          height="150" 
        />
      </header>

      <section id="about" style={{ padding: '40px' }}>
        <h2>About Us</h2>
      </section>
    </main>
  );
}
