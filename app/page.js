export default function Home() {
  return (
    <main>
      {/* Header Section */}
      <header>
        {/* ... existing header content ... */}
        <a 
          href="YOUR_FORM_LINK_HERE" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ marginLeft: '10px', padding: '8px 20px', background: 'transparent', border: '1px solid #fff', color: '#fff', cursor: 'pointer', textDecoration: 'none' }}
        >
          Apply
        </a>
      </header>

      {/* Hero Section */}
      <section>
        <h1>The Way of Athletic Performance</h1>
        <p>Here at Iwamizu Athletic Performance, strength is not built in a single workout. It is forged through disciplined practice, purposeful movement, and relentless refinement.</p>
        
        <a 
          href="YOUR_FORM_LINK_HERE" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none' }}
        >
          <button style={{ marginTop: '20px', padding: '15px 40px', background: '#ff0000', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            Begin Your Journey
          </button>
        </a>
      </section>
      
      {/* ... rest of your page content ... */}
    </main>
  );
}
