export default function Portal() {
  const brandRed = "#ff0000";

  return (
    <main style={{ fontFamily: 'sans-serif', backgroundColor: '#000', color: '#fff', padding: '20px', minHeight: '100vh' }}>
      
      {/* Portal Header */}
      <header style={{ paddingBottom: '20px', borderBottom: `2px solid ${brandRed}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
        <h1 style={{ color: brandRed, margin: 0, fontSize: '1.5rem' }}>Athlete Dashboard</h1>
      </header>

      {/* Stats Summary */}
      <section style={{ padding: '20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
          <p style={{ margin: 0, color: '#888' }}>Current Cycle</p>
          <h2 style={{ margin: '5px 0 0 0' }}>Strength Peak</h2>
        </div>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
          <p style={{ margin: 0, color: '#888' }}>Next Test Day</p>
          <h2 style={{ margin: '5px 0 0 0' }}>July 18</h2>
        </div>
      </section>

      {/* Daily Session Card */}
      <section style={{ padding: '20px 0' }}>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', borderLeft: `5px solid ${brandRed}` }}>
          <h2 style={{ marginTop: 0 }}>Today's Session</h2>
          <p>Focus: Bar Velocity & Explosive Power</p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Squat: 3x3 @ 85% (Target: 0.5 m/s)</li>
            <li>Clean Pulls: 4x2 @ 90%</li>
          </ul>
          <button style={{ background: brandRed, color: '#fff', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>Complete Session</button>
        </div>
      </section>

      {/* Progress Metric */}
      <section style={{ padding: '20px 0' }}>
        <h2 style={{ color: brandRed }}>Performance Metrics</h2>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
          <p>Bar Velocity Tracking (m/s)</p>
          <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            {/* Visual placeholder for graph */}
            {[0.4, 0.45, 0.42, 0.5].map(val => (
              <div style={{ flex: 1, background: brandRed, height: `${val * 150}px` }}></div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
