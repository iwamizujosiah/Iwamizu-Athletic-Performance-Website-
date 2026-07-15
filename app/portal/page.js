export default function Portal() {
  const brandRed = "#ff0000";

  return (
    <main style={{ fontFamily: 'sans-serif', backgroundColor: '#000', color: '#fff', padding: '20px', minHeight: '100vh' }}>
      
      {/* Portal Header */}
      <header style={{ paddingBottom: '20px', borderBottom: `2px solid ${brandRed}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
        <h1 style={{ color: brandRed, margin: 0, fontSize: '1.5rem' }}>Athlete Dashboard</h1>
      </header>

      {/* Pro-Tip for App usage */}
      <div style={{ background: '#333', padding: '10px', borderRadius: '5px', marginTop: '20px', fontSize: '0.9rem' }}>
        💡 <strong>Pro-Tip:</strong> Tap "Share" and "Add to Home Screen" to use this as an app.
      </div>

      {/* Primary Metrics (Gen Pop & All) */}
      <section style={{ padding: '20px 0' }}>
        <h2 style={{ color: brandRed }}>Progress Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {[
            { label: 'Sessions Missed', value: '0' },
            { label: 'Volume (Sets)', value: '12' },
            { label: 'Volume (Reps)', value: '60' },
            { label: 'Load PBs', value: '3' }
          ].map(stat => (
            <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '10px' }}>
              <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>{stat.label}</p>
              <h3 style={{ margin: '5px 0 0 0' }}>{stat.value}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Advanced Performance Metrics */}
      <section style={{ padding: '20px 0' }}>
        <h2 style={{ color: brandRed }}>Advanced Performance</h2>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
          {[
            { label: '5-10-5 Time', val: '4.4s' },
            { label: 'Vertical Jump', val: '32 in' },
            { label: 'Flying 10', val: '1.05s' },
            { label: 'Flying 20', val: '2.10s' },
            { label: '40 Yard Dash', val: '4.6s' }
          ].map(test => (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333' }}>
              <span>{test.label}</span>
              <span style={{ fontWeight: 'bold', color: brandRed }}>{test.val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Manual Data Entry Placeholder */}
      <section style={{ padding: '20px 0' }}>
        <button style={{ width: '100%', background: brandRed, color: '#fff', border: 'none', padding: '15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          Log Today's Data
        </button>
      </section>

    </main>
  );
}
