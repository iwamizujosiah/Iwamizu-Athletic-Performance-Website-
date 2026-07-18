"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Settings, 
  Search, ShieldAlert, Award, Activity, Plus, Lock, KeyRound
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
    attendance: "0%",
    activeAthletes: 0,
    flagged: 0,
    prsThisWeek: 0,
    sessionsPerWeek: 0
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

        if (athletesData) {
          setAthletes(athletesData);
          if (athletesData.length > 0) {
            setSelectedAthlete(athletesData[0]);
          }

          const totalAthletes = athletesData.length;
          const flaggedCount = athletesData.filter(a => a.status === 'Flagged').length;
          const averageStreak = totalAthletes > 0 
            ? Math.round(athletesData.reduce((acc, curr) => acc + (curr.streak_percentage || 0), 0) / totalAthletes)
            : 100;

          setStats(prev => ({
            ...prev,
            activeAthletes: totalAthletes,
            flagged: flaggedCount,
            attendance: `${averageStreak}%`
          }));
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

      if (!error && logs) {
        const mappedLogs = logs.map((log, idx) => ({
          label: `S${idx + 1}`,
          val: Math.max(30, Math.min(95, 100 - (log.metric_value * 50))), 
          time: `${log.metric_value}s`
        }));
        setTrendLogs(mappedLogs);
      }
    }

    loadAthleteTrends();
  }, [selectedAthlete, isAuthorized]);

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.id.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Core Render Dashboard Layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d0f12', color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '256px', backgroundColor: '#12161a', borderRight: '1px solid #1f262e', display: 'flex', flexDirection: 'col', justifyContent: 'space-between', padding: '24px', flexShrink: 0, boxSizing: 'border-box' }}>
        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.05em', color: '#dc2626', margin: '0' }}>IWAMIZU</h1>
            <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', margin: '0' }}>Athletic Performance</p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setActiveTab('athletes')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'athletes' ? '#dc2626' : 'transparent', color: '#ffffff' }}>
              <Users size={18} /> Athletes
            </button>
            <button onClick={() => setActiveTab('workouts')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'workouts' ? '#dc2626' : 'transparent', color: '#ffffff' }}>
              <Dumbbell size={18} /> Workouts
            </button>
          </nav>
        </div>
      </aside>

      {/* DASHBOARD INNER CONTENT */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0' }}>Good afternoon, Coach.</h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>Spreadsheet Stream: <span style={{ color: '#4ade80', fontWeight: '600' }}>Online Live</span></p>
        </div>

        {/* METRIC ROW BANNER */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0' }}>Team Discipline</p>
            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#4ade80', margin: '4px 0 0 0' }}>{stats.attendance}</h3>
          </div>
          <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0' }}>Active Athletes</p>
            <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '4px 0 0 0' }}>{stats.activeAthletes}</h3>
          </div>
          <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0' }}>Flagged Rows</p>
            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#f87171', margin: '4px 0 0 0' }}>{stats.flagged}</h3>
          </div>
        </div>

        {/* DATA FLEX COLUMNS */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0' }}>Athlete Roster</h3>
            </div>

            <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', backgroundColor: '#1c232b', padding: '12px 16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>
                <div>Name</div>
                <div style={{ textAlign: 'center' }}>Streak</div>
                <div style={{ textAlign: 'center' }}>Status</div>
              </div>
              <div style={{ color: '#ffffff' }}>
                {filteredAthletes.map((athlete) => (
                  <div key={athlete.id} onClick={() => setSelectedAthlete(athlete)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid #1f262e', cursor: 'pointer', backgroundColor: selectedAthlete?.id === athlete.id ? '#1c232b' : 'transparent' }}>
                    <div style={{ fontWeight: 'bold' }}>{athlete.name}</div>
                    <div style={{ textAlign: 'center', color: '#4ade80', fontWeight: 'bold' }}>{athlete.streak_percentage}%</div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ backgroundColor: athlete.status === 'Flagged' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)', color: athlete.status === 'Flagged' ? '#f87171' : '#4ade80', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {athlete.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* INSPECTOR DATA CARD */}
          <div>
            {selectedAthlete && (
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0' }}>{selectedAthlete.name}</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 24px 0' }}>{selectedAthlete.email}</p>

                <div style={{ backgroundColor: '#1c232b', padding: '12px', borderRadius: '8px', border: '1px solid #1f262e', marginBottom: '16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0' }}>Weight Vitals</p>
                  <p style={{ fontSize: '18px', fontWeight: '900', margin: '4px 0 0 0' }}>{selectedAthlete.weight_lbs ? `${selectedAthlete.weight_lbs} lbs` : '--'}</p>
                </div>

                <div style={{ borderTop: '1px solid #1f262e', paddingTop: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 8px 0' }}>Coach Internal Notes</p>
                  <p style={{ fontSize: '13px', color: '#d1d5db', backgroundColor: '#1c232b', padding: '12px', borderRadius: '8px', border: '1px solid #1f262e', margin: '0' }}>
                    {selectedAthlete.coach_notes || "No log notes filed yet."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
