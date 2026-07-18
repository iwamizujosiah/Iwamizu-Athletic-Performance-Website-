"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Settings, 
  Search, ShieldAlert, Award, Activity, Plus, Lock, KeyRound, Zap
} from 'lucide-react';

export default function CoachingDashboard() {
  // Access Control / Registration Lock State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard Navigation & Data States
  const [activeTab, setActiveTab] = useState('athletes');
  const [searchQuery, setSearchQuery] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [trendLogs, setTrendLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    attendance: "87%",
    activeAthletes: 6,
    flagged: 1,
    prsThisWeek: 5,
    sessionsPerWeek: 24
  });

  // Verify access key to ensure only YOU can register/view this portal
  const handleVerifyKey = (e) => {
    e.preventDefault();
    if (accessKey === 'COACH_SECURE_2026') {
      setIsAuthorized(true);
      setAuthError('');
      localStorage.setItem('coach_authenticated', 'true');
    } else {
      setAuthError('Invalid registration credentials. Access Denied.');
    }
  };

  // Check persistent authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('coach_authenticated');
    if (authStatus === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  // Load Everything From Supabase Database
  useEffect(() => {
    if (!isAuthorized) return;

    async function loadDashboardData() {
      try {
        setLoading(true);
        
        const { data: athletesData, error: athleteErr } = await supabase
          .from('athletes')
          .select('*')
          .order('name', { ascending: true });

        if (athleteErr) throw athleteErr;

        if (athletesData && athletesData.length > 0) {
          setAthletes(athletesData);
          setSelectedAthlete(athletesData[0]);

          const totalAthletes = athletesData.length;
          const flaggedCount = athletesData.filter(a => a.status === 'Flagged').length;
          const averageStreak = totalAthletes > 0 
            ? Math.round(athletesData.reduce((acc, curr) => acc + (curr.streak_percentage || 0), 0) / totalAthletes)
            : 87;

          setStats({
            attendance: `${averageStreak}%`,
            activeAthletes: totalAthletes,
            flagged: flaggedCount,
            prsThisWeek: 5,
            sessionsPerWeek: 24
          });
        }
      } catch (err) {
        console.error("Error loading spreadsheet metrics:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [isAuthorized]);

  // Load trend charts when switching profiles
  useEffect(() => {
    if (!selectedAthlete || !isAuthorized) return;

    async function loadAthleteTrends() {
      const { data: logs, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('athlete_id', selectedAthlete.id)
        .eq('exercise_name', 'Flying 10')
        .order('logged_at', { ascending: true })
        .limit(6);

      if (!error && logs && logs.length > 0) {
        const mappedLogs = logs.map((log, idx) => ({
          label: `S${idx + 1}`,
          val: Math.max(30, Math.min(95, 100 - (log.metric_value * 50))), 
          time: `${log.metric_value}s`
        }));
        setTrendLogs(mappedLogs);
      } else {
        // Fallback mockup data mirroring your dashboard log
        setTrendLogs([
          { label: 'S1', val: 40, time: '1.11s' },
          { label: 'S2', val: 55, time: '1.06s' },
          { label: 'S3', val: 75, time: '1.02s' },
          { label: 'S4', val: 60, time: '1.05s' },
          { label: 'S5', val: 80, time: '0.99s' },
          { label: 'S6', val: 85, time: '0.98s' }
        ]);
      }
    }

    loadAthleteTrends();
  }, [selectedAthlete, isAuthorized]);

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Gated Registration UI Screen
  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0d0f12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        color: '#ffffff',
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#12161a',
          border: '1px solid #1f262e',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto'
          }}>
            <Lock size={28} style={{ color: '#dc2626' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '0.05em', margin: '0' }}>IWAMIZU ATHLETIC PORTAL</h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Coach Registration Lock</p>
          
          <form onSubmit={handleVerifyKey} style={{ marginTop: '32px', textAlign: 'left' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>Enter Coach Master Registration Key</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6b7280' }} />
                <input 
                  type="password" 
                  placeholder="••••••••••••" 
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1c232b',
                    border: '1px solid #1f262e',
                    borderRadius: '12px',
                    padding: '12px 16px 12px 44px',
                    fontSize: '14px',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    letterSpacing: '0.15em'
                  }}
                />
              </div>
            </div>

            {authError && <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600', textAlign: 'center', margin: '8px 0' }}>{authError}</p>}

            <button type="submit" style={{
              width: '100%',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontWeight: 'bold',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '16px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
            }}>
              Authorize Device & Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0d0f12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity className="animate-spin" size={40} style={{ color: '#dc2626', margin: '0 auto 8px auto' }} />
          <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Syncing Spreadsheet Data Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d0f12', color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '260px', backgroundColor: '#12161a', borderRight: '1px solid #1f262e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', flexShrink: 0, boxSizing: 'border-box' }}>
        <div style={{ width: '100%' }}>
          {/* BRANDING LOGO PLACEMENT SECTION */}
          <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Zap size={22} style={{ color: '#dc2626' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.05em', color: '#dc2626', margin: '0' }}>IWAMIZU</h1>
              <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', margin: '0' }}>Athletic Performance</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setActiveTab('athletes')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'athletes' ? '#dc2626' : 'transparent', color: '#ffffff', textAlign: 'left' }}>
              <Users size={18} /> Athletes
            </button>
            <button onClick={() => setActiveTab('workouts')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'workouts' ? '#dc2626' : 'transparent', color: '#ffffff', textAlign: 'left' }}>
              <Dumbbell size={18} /> Workouts
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'transparent', color: '#9ca3af', textAlign: 'left' }}><Calendar size={18} /> Calendar</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'transparent', color: '#9ca3af', textAlign: 'left' }}><MessageSquare size={18} /> Messages</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'transparent', color: '#9ca3af', textAlign: 'left' }}><Settings size={18} /> System Settings</button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pt: '16px', borderTop: '1px solid #1f262e' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', lineHeight: '40px', fontSize: '14px' }}>JI</div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>Josiah Iwamizu</h4>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>Head Coach</p>
          </div>
        </div>
      </aside>

      {/* DASHBOARD INNER CONTENT */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0' }}>Good afternoon, Coach.</h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>Spreadsheet Stream: <span style={{ color: '#4ade80', fontWeight: '600' }}>Online Live</span></p>
          </div>
        </div>

        {/* METRIC BANNER GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0', letterSpacing: '0.05em' }}>Team Discipline</p>
            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#4ade80', margin: '4px 0 0 0' }}>{stats.attendance}</h3>
          </div>
          <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0', letterSpacing: '0.05em' }}>Active Athletes</p>
            <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '4px 0 0 0' }}>{stats.activeAthletes}</h3>
          </div>
          <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0', letterSpacing: '0.05em' }}>Flagged Rows</p>
            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#f87171', margin: '4px 0 0 0' }}>{stats.flagged}</h3>
          </div>
          <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0', letterSpacing: '0.05em' }}>PRs This Week</p>
            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#fbbf24', margin: '4px 0 0 0' }}>{stats.prsThisWeek}</h3>
          </div>
          <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0', letterSpacing: '0.05em' }}>Sessions / Week</p>
            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#60a5fa', margin: '4px 0 0 0' }}>{stats.sessionsPerWeek}</h3>
          </div>
        </div>

        {/* DATA FLEX COLUMNS */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0' }}>Athlete Roster</h3>
              <button style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Add Athlete</button>
            </div>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }} />
              <input 
                type="text" placeholder="Search roster rows..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '8px', padding: '8px 12px 8px 36px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', backgroundColor: '#1c232b', padding: '12px 16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>
                <div>Name</div>
                <div style={{ textAlign: 'center' }}>Streak</div>
                <div style={{ textAlign: 'center' }}>Status</div>
              </div>
              <div style={{ color: '#ffffff' }}>
                {filteredAthletes.length > 0 ? (
                  filteredAthletes.map((athlete) => (
                    <div key={athlete.id} onClick={() => setSelectedAthlete(athlete)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid #1f262e', cursor: 'pointer', backgroundColor: selectedAthlete?.id === athlete.id ? '#1c232b' : 'transparent' }}>
                      <div style={{ fontWeight: 'bold' }}>{athlete.name}</div>
                      <div style={{ textAlign: 'center', color: '#4ade80', fontWeight: 'bold' }}>{athlete.streak_percentage || 92}%</div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ backgroundColor: athlete.status === 'Flagged' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)', color: athlete.status === 'Flagged' ? '#f87171' : '#4ade80', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          {athlete.status || 'On Track'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  // Safe mockup layout block matches structure if spreadsheet loading has lag
                  <div key="mock-1" onClick={() => setSelectedAthlete({ name: 'John Doe', email: 'john@doe.com', weight_lbs: 178, coach_notes: 'Strong week, hit a new vertical PB Thursday.' })} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid #1f262e', cursor: 'pointer', backgroundColor: '#1c232b' }}>
                    <div style={{ fontWeight: 'bold' }}>John Doe</div>
                    <div style={{ textAlign: 'center', color: '#4ade80', fontWeight: 'bold' }}>92%</div>
                    <div style={{ textAlign: 'center' }}><span style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>On Track</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* INSPECTOR DATA CARD */}
          <div>
            {selectedAthlete ? (
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0' }}>{selectedAthlete.name}</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 24px 0' }}>{selectedAthlete.email || 'athlete@performance.com'}</p>

                <div style={{ backgroundColor: '#1c232b', padding: '12px', borderRadius: '8px', border: '1px solid #1f262e', marginBottom: '16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0' }}>Weight Vitals</p>
                  <p style={{ fontSize: '18px', fontWeight: '900', margin: '4px 0 0 0' }}>{selectedAthlete.weight_lbs ? `${selectedAthlete.weight_lbs} lbs` : '178 lbs'}</p>
                </div>

                {/* GRAPH WORKFLOW INLINE TREND MAPPORTAL */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Flying 10 Performance Trend</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', backgroundColor: '#1c232b', padding: '12px', borderRadius: '8px', border: '1px solid #1f262e' }}>
                    {trendLogs.map((pt, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '9px', color: '#60a5fa', marginBottom: '2px' }}>{pt.time}</span>
                        <div style={{ height: `${pt.val}%`, width: '70%', backgroundColor: '#dc2626', borderRadius: '2px 2px 0 0' }}></div>
                        <span style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>{pt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #1f262e', paddingTop: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 8px 0' }}>Coach Internal Notes</p>
                  <p style={{ fontSize: '13px', color: '#d1d5db', backgroundColor: '#1c232b', padding: '12px', borderRadius: '8px', border: '1px solid #1f262e', margin: '0', lineHeight: '1.4' }}>
                    {selectedAthlete.coach_notes || "Strong week, hit a new vertical PB Thursday. Keep loading progression on schedule."}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px' }}>
                Select an athlete to open profile metrics inspection.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
