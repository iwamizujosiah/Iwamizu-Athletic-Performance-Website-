"use client";
import { useState, useEffect } from 'react';

export default function AthletePortal() {
  const brandRed = "#ff0000";
  const [accessCode, setAccessCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [athleteData, setAthleteData] = useState(null);

  // Clear any accidental local session history on fresh load
  useEffect(() => {
    setIsAuthenticated(false);
    setAthleteData(null);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!accessCode) return;
    
    setLoading(true);
    setError("");

    try {
      // Fetching with a timestamp to force the server to get fresh data every time
      const res = await fetch(`/api/portal?code=${accessCode.trim().toUpperCase()}&t=${Date.now()}`);
      const data = await res.json();

      if (res.ok) {
        setAthleteData(data);
        setIsAuthenticated(true);
      } else {
        setError(data.error || "Access code not recognized.");
      }
    } catch (err) {
      setError("Unable to connect to your portal. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // 1. GATEKEEPER SCREEN (With Added Coach Portal Navigation Link)
  if (!isAuthenticated) {
    return (
      <main style={{ fontFamily: 'sans-serif', backgroundColor: '#000', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0' }}>
        
        {/* TOP HOMEPAGE NAVBAR LINKING COACH PORTAL */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          backgroundColor: '#000',
          borderBottom: '1px solid #111'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '35px' }} />
          </div>

          <nav style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ color: brandRed, fontSize: '14px', fontWeight: 'bold' }}>
              Client Portal
            </span>
            <a href="/portal/coach" style={{
              color: '#ffffff',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              border: `1px solid ${brandRed}`,
              padding: '6px 14px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Coach Portal
            </a>
          </nav>
        </header>

        {/* LOGOFF / ENTRY PORTAL INNER BOX */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: '#111', padding: '40px 30px', borderRadius: '12px', border: '1px solid #222', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#fff' }}>Athlete Portal</h1>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '30px' }}>Enter your exclusive access code to unlock your training dashboard.</p>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                placeholder="IW-XXXX-XXXX" 
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={loading}
                style={{ padding: '15px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#000', color: '#fff', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold' }}
              />
              {error && <p style={{ color: brandRed, margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ background: brandRed, color: '#fff', border: 'none', padding: '15px', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? "Unlocking..." : "Unlock Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // 2. LIVE ATHLETE HOME SCREEN
  return (
    <main style={{ fontFamily: 'sans-serif', backgroundColor: '#000', color: '#fff', minHeight: '100vh', paddingBottom: '60px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: `2px solid ${brandRed}`, backgroundColor: '#000' }}>
        <a href="/">
          <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
        </a>
        <h1 style={{ color: brandRed, fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{athleteData.name}</h1>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
        <div style={{ background: '#1a1a1a', padding: '15px 20px', borderRadius: '8px', border: '1px solid #222', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
            <strong>Pro-Tip:</strong> Tap "Share" and "Add to Home Screen" to use this as an app.
          </p>
        </div>

        {/* Overview Cards */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: brandRed, fontSize: '1.8rem', marginBottom: '20px' }}>Progress Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ background: '#111', border: '1px solid #222', padding: '20px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#888', display: 'block', marginBottom: '5px' }}>Sessions Missed</span>
              <strong style={{ fontSize: '1.8rem' }}>{athleteData.sessionsMissed}</strong>
            </div>
            <div style={{ background: '#111', border: '1px solid #222', padding: '20px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#888', display: 'block', marginBottom: '5px' }}>Volume (Sets)</span>
              <strong style={{ fontSize: '1.8rem' }}>{athleteData.volumeSets}</strong>
            </div>
            <div style={{ background: '#111', border: '1px solid #222', padding: '20px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#888', display: 'block', marginBottom: '5px' }}>Volume (Reps)</span>
              <strong style={{ fontSize: '1.8rem' }}>{athleteData.volumeReps}</strong>
            </div>
            <div style={{ background: '#111', border: '1px solid #222', padding: '20px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#888', display: 'block', marginBottom: '5px' }}>Load PBs</span>
              <strong style={{ fontSize: '1.8rem' }}>{athleteData.loadPBs}</strong>
            </div>
          </div>
        </section>

        {/* Advanced Performance */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: brandRed, fontSize: '1.8rem', marginBottom: '25px' }}>Advanced Performance</h2>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', padding: '10px 20px' }}>
            {[
              { label: "5-10-5 Time", value: athleteData.fiveTenFive },
              { label: "Vertical Jump", value: athleteData.verticalJump },
              { label: "Flying 10", value: athleteData.flyingTen },
              { label: "Flying 20", value: athleteData.flyingTwenty }
            ].map((metric, index, arr) => (
              <div key={metric.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: index === arr.length - 1 ? 'none' : '1px solid #222' }}>
                <span style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 'bold' }}>{metric.label}</span>
                <span style={{ fontSize: '1.05rem', color: brandRed, fontWeight: 'bold' }}>{metric.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Workout Button */}
        <section style={{ marginTop: '50px', textAlign: 'center' }}>
          <a 
            href={athleteData.workoutUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: 'block', background: brandRed, color: '#fff', textAlign: 'center', padding: '20px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 4px 15px rgba(255, 0, 0, 0.3)' }}
          >
            🔥 Today's Assigned Workout
          </a>
          <button 
            onClick={() => { setIsAuthenticated(false); setAccessCode(""); }} 
            style={{ background: 'transparent', border: 'none', color: '#555', marginTop: '20px', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Lock Dashboard
          </button>
        </section>

      </div>
    </main>
  );
}
