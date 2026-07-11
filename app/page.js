export default function Home() {
  const applicationUrl = "https://drive.google.com/file/d/1u-OpRabHPBlcsHW5ZAXok61n6OfKfoMF/view?usp=sharing";

  return (
    <main>
      {/* Header Section */}
      <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>IWAMIZU</div>
        <a 
          href={applicationUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #fff', color: '#fff', cursor: 'pointer', textDecoration: 'none' }}
        >
          Apply
        </a>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h1>The Way of Athletic Performance</h1>
        <p>Strength is not built in a single workout. It is forged through disciplined practice, purposeful movement, and relentless refinement.</p>
        
        <a 
          href={applicationUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none' }}
        >
          <button style={{ marginTop: '20px', padding: '15px 40px', background: '#ff0000', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            Begin Your Journey
          </button>
        </a>
      </section>
      
      {/* Add your other sections below here */}
    </main>
  );
}
