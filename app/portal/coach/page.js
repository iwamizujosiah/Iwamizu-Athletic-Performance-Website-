"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Settings, 
  Search, ShieldAlert, Award, Activity, Plus, Lock, KeyRound, Trash2, CheckCircle, Timer
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

  // Master Exercise Library States
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [selectedBlockType, setSelectedBlockType] = useState('Activation'); // Activation, Movement, Strength
  
  // Current Workout Being Built
  const [targetAthleteId, setTargetAthleteId] = useState('');
  const [workoutName, setWorkoutName] = useState('Championship GPP Protocol');
  const [currentPrescription, setCurrentPrescription] = useState([]); 
  const [saveStatus, setSaveStatus] = useState('');

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

  // Load Database Data (Athletes & Master Exercise Library)
  useEffect(() => {
    if (!isAuthorized) return;

    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // 1. Fetch Athletes
        const { data: athletesData, error: athleteErr } = await supabase
          .from('athletes')
          .select('*')
          .order('name', { ascending: true });

        if (athleteErr) throw athleteErr;

        if (athletesData && athletesData.length > 0) {
          setAthletes(athletesData);
          setSelectedAthlete(athletesData[0]);
          setTargetAthleteId(athletesData[0].id);

          const totalAthletes = athletesData.length;
          const flaggedCount = athletesData.filter(a => a.status === 'Flagged').length;
          const averageStreak = totalAthletes > 0 
            ? Math.round(athletesData.reduce((acc, curr) => acc + (curr.streak_percentage || 0), 0) / totalAthletes)
            : 87;

          setStats(prev => ({
            ...prev,
            attendance: `${averageStreak}%`,
            activeAthletes: totalAthletes,
            flagged: flaggedCount
          }));
        }

        // 2. Fetch Master Exercise Catalog
        const { data: exercisesData, error: exErr } = await supabase
          .from('exercises')
          .select('*')
          .order('name', { ascending: true });

        if (!exErr && exercisesData) {
          setExerciseLibrary(exercisesData);
        }

      } catch (err) {
        console.error("Error loading setup metrics:", err.message);
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

  // Add Exercise to Current Workout Prescription
  const addExerciseToWorkout = (exercise) => {
    const targetUnit = exercise.tracking_unit || 'reps';
    const newEntry = {
      uniqueId: Date.now() + Math.random(),
      exercise_id: exercise.id,
      name: exercise.name,
      block_type: exercise.block_type || selectedBlockType,
      modality: exercise.modality || 'Bodyweight',
      tracking_unit: targetUnit,
      sets: 3,
      rest_timer: '60s', 
      reps: targetUnit === 'reps' ? 10 : '',
      load_value: targetUnit === 'lbs' ? 135 : '',
      seconds_value: targetUnit === 'seconds' ? 30 : '',
      distance_value: targetUnit === 'distance' ? '20yds' : ''
    };
    setCurrentPrescription([...currentPrescription, newEntry]);
  };

  // Update specific values inside a prescription row
  const updatePrescriptionField = (uniqueId, field, val) => {
    setCurrentPrescription(currentPrescription.map(item => 
      item.uniqueId === uniqueId ? { ...item, [field]: val } : item
    ));
  };

  // Remove a row from the builder
  const removeExerciseFromWorkout = (uniqueId) => {
    setCurrentPrescription(currentPrescription.filter(item => item.uniqueId !== uniqueId));
  };

  // Commit Workout Prescription Live to Supabase Tables
  const handleSaveWorkout = async () => {
    if (!targetAthleteId || currentPrescription.length === 0) {
      setSaveStatus('⚠️ Please select an athlete and add exercises.');
      return;
    }

    try {
      setSaveStatus('Publishing routines to cloud database...');
      
      // Step 1: Insert the primary Workout header block
      const { data: workoutData, error: workoutErr } = await supabase
        .from('workouts')
        .insert([{
          athlete_id: targetAthleteId,
          title: workoutName
        }])
        .select()
        .single();

      if (workoutErr) throw workoutErr;

      const newWorkoutId = workoutData.id;

      // Step 2: Format individual prescription line cards to map structural rows cleanly
      const itemsToInsert = currentPrescription.map((item, idx) => ({
        workout_id: newWorkoutId,
        exercise_name: item.name,
        block_type: item.block_type,
        modality: item.modality || 'Bodyweight', 
        tracking_unit: item.tracking_unit,
        sets: parseInt(item.sets) || 3,
        reps: item.reps ? String(item.reps) : null,
        load_value: item.load_value ? String(item.load_value) : null,
        seconds_value: item.seconds_value ? String(item.seconds_value) : null,
        distance_value: item.distance_value ? String(item.distance_value) : null,
        rest_timer: item.rest_timer || '60s',
        order_index: idx
      }));

      // Step 3: Bulk insert child rows down to workout_items relational link
      const { error: itemsErr } = await supabase
        .from('workout_items')
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;

      setSaveStatus('✅ Workout successfully pushed to Athlete Portal!');
      setCurrentPrescription([]); // Clear canvas workspace deck on success
      
    } catch (err) {
      console.error("Database connection failure:", err.message);
      setSaveStatus(`❌ Error saving program: ${err.message}`);
    }
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter exercise catalog matching selected programming block
  const filteredExercises = exerciseLibrary.filter(ex => ex.block_type === selectedBlockType);

  // Gated Registration UI Screen
  if (!isAuthorized) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0d0f12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#ffffff', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <Lock size={28} style={{ color: '#dc2626' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '0.05em', margin: '0' }}>IWAMIZU ATHLETIC PORTAL</h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Coach Registration Lock</p>
          
          <form onSubmit={handleVerifyKey} style={{ marginTop: '32px', textAlign: 'left' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>Enter Coach Master Registration Key</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6b7280' }} />
                <input type="password" placeholder="••••••••••••" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '12px', padding: '12px 16px 12px 44px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.15em' }} />
              </div>
            </div>
            {authError && <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600', textAlign: 'center', margin: '8px 0' }}>{authError}</p>}
            <button type="submit" style={{ width: '100%', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '14px', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', marginTop: '16px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>Authorize Device & Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0d0f12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <div style={{ textalign: 'center' }}>
          <Activity className="animate-spin" size={40} style={{ color: '#dc2626', margin: '0 auto 8px auto' }} />
          <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Syncing Database Curriculum Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d0f12', color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '260px', backgroundColor: '#12161a', borderRight: '1px solid #1f262e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', flexShrink: 0, boxSizing: 'border-box' }}>
        <div>
          <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#12161a', borderRadius: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img src="/logo.png" alt="Iwamizu Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #1f262e' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', lineHeight: '40px', fontSize: '14px' }}>JI</div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>Josiah Iwamizu</h4>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>Head Coach</p>
          </div>
        </div>
      </aside>

      {/* DASHBOARD INNER CONTENT */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {/* TAB 1: ATHLETES ROSTER INSPECTOR VIEW */}
        {activeTab === 'athletes' && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0' }}>Good afternoon, Coach.</h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>Spreadsheet Stream: <span style={{ color: '#4ade80', fontWeight: '600' }}>Online Live</span></p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0' }}>Athlete Roster</h3>
                  <button style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Add Athlete</button>
                </div>

                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }} />
                  <input type="text" placeholder="Search roster rows..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '8px', padding: '8px 12px 8px 36px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
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
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No matching athletes found.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* INSPECTOR CARD */}
              <div>
                {selectedAthlete ? (
                  <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0' }}>{selectedAthlete.name}</h3>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 24px 0' }}>{selectedAthlete.email || 'athlete@performance.com'}</p>

                    <div style={{ backgroundColor: '#1c232b', padding: '12px', borderRadius: '8px', border: '1px solid #1f262e', marginBottom: '16px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0' }}>Weight Vitals</p>
                      <p style={{ fontSize: '18px', fontWeight: '900', margin: '4px 0 0 0' }}>{selectedAthlete.weight_lbs ? `${selectedAthlete.weight_lbs} lbs` : '178 lbs'}</p>
                    </div>

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
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px' }}>Select an athlete to view metrics.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: WORKOUT BUILDER ENGINE LAYER */}
        {activeTab === 'workouts' && (
          <div style={{ boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0' }}>Prescription Programming Center</h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>Select block layers from your database to build bespoke athlete training days.</p>
            </div>

            {/* TOP BAR: GLOBAL CONTROL ASSIGNMENT PANEL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>1. Assign Target Athlete</label>
                <select value={targetAthleteId} onChange={(e) => setTargetAthleteId(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px', borderRadius: '8px', color: '#ffffff', outline: 'none', fontSize: '14px' }}>
                  {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>2. Program Title Card</label>
                <input type="text" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px', borderRadius: '8px', color: '#ffffff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* TWO COLUMN INTERACTIVE PALETTE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
              
              {/* LEFT COLUMN: THE MASTER CURRICULUM SELECTOR */}
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>Database Curriculum</h4>
                
                {/* SYSTEM FLOW BLOCK BUTTON TABS */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', backgroundColor: '#1c232b', padding: '4px', borderRadius: '6px' }}>
                  {['Activation', 'Movement', 'Strength'].map(b => (
                    <button key={b} onClick={() => setSelectedBlockType(b)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: selectedBlockType === b ? '#dc2626' : 'transparent', color: '#ffffff' }}>
                      {b}
                    </button>
                  ))}
                </div>

                {/* SCROLLABLE LIST OF LOADED DATABASE EXERCISES */}
                <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map(ex => (
                      <button key={ex.id} onClick={() => addExerciseToWorkout(ex)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px 14px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s' }}>
                        <span>{ex.name}</span>
                        <span style={{ fontSize: '10px', opacity: 0.5, backgroundColor: '#0d0f12', padding: '2px 6px', borderRadius: '4px' }}>{ex.modality}</span>
                      </button>
                    ))
                  ) : (
                    <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: '20px 0' }}>No exercises found. Run SQL script to refresh database lines.</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: DYNAMIC WORKOUT CANVAS SHEET */}
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>Active Rx Prescription Deck</h3>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>{currentPrescription.length} Rows Slotted</span>
                </div>

                {/* RENDER DYNAMIC CARD ROWS FOR PROGRAMMED EXERCISES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {currentPrescription.length > 0 ? (
                    currentPrescription.map((item) => (
                      <div key={item.uniqueId} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.6fr 1fr 1fr auto', gap: '12px', alignItems: 'center', backgroundColor: '#1c232b', padding: '14px', borderRadius: '10px', border: '1px solid #1f262e' }}>
                        <div>
                          <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{item.name}</p>
                          <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>{item.block_type} | {item.modality}</span>
                        </div>

                        {/* COLUMN: SETS INPUT */}
                        <div>
                          <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Sets</label>
                          <input type="number" value={item.sets} onChange={(e) => updatePrescriptionField(item.uniqueId, 'sets', parseInt(e.target.value) || 0)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', textAlign: 'center' }} />
                        </div>

                        {/* DYNAMIC PARAMETER TARGET DEPENDING ON THE EXERCISE'S TRACKING UNIT */}
                        <div>
                          <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#dc2626', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                            Prescription ({item.tracking_unit})
                          </label>
                          
                          {item.tracking_unit === 'reps' && (
                            <input type="number" placeholder="Reps" value={item.reps} onChange={(e) => updatePrescriptionField(item.uniqueId, 'reps', e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                          )}
                          {item.tracking_unit === 'lbs' && (
                            <input type="text" placeholder="Weight" value={item.load_value} onChange={(e) => updatePrescriptionField(item.uniqueId, 'load_value', e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                          )}
                          {item.tracking_unit === 'seconds' && (
                            <input type="text" placeholder="Time (s)" value={item.seconds_value} onChange={(e) => updatePrescriptionField(item.uniqueId, 'seconds_value', e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                          )}
                          {item.tracking_unit === 'distance' && (
                            <input type="text" placeholder="Distance" value={item.distance_value} onChange={(e) => updatePrescriptionField(item.uniqueId, 'distance_value', e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                          )}
                          {item.tracking_unit === 'inches' && (
                            <input type="text" placeholder="Inches" value={item.reps} onChange={(e) => updatePrescriptionField(item.uniqueId, 'reps', e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                          )}
                        </div>

                        {/* COLUMN: REST INTERVAL SELECTION TIMER */}
                        <div>
                          <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                            <Timer size={10} /> Rest
                          </label>
                          <select 
                            value={item.rest_timer} 
                            onChange={(e) => updatePrescriptionField(item.uniqueId, 'rest_timer', e.target.value)}
                            style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="None">No Rest</option>
                            <option value="30s">30s (Density)</option>
                            <option value="45s">45s</option>
                            <option value="60s">60s (Standard)</option>
                            <option value="90s">90s (Hypertrophy)</option>
                            <option value="2 min">2 min (Strength)</option>
                            <option value="3 min">3 min (Absolute Power)</option>
                          </select>
                        </div>

                        {/* REMOVE ITEM BUTTON */}
                        <button onClick={() => removeExerciseFromWorkout(item.uniqueId)} style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ border: '2px dashed #1f262e', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                      <Dumbbell size={28} style={{ color: '#1f262e', margin: '0 auto 12px auto' }} />
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>The training card is currently blank.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Click individual items from the library layout menu on the left to add rows.</p>
                    </div>
                  )}
                </div>

                {/* SUBMIT DECK PUSH BUTTON ACTION */}
                {currentPrescription.length > 0 && (
                  <div style={{ borderTop: '1px solid #1f262e', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px' }}>
                    <button onClick={() => setCurrentPrescription([])} style={{ background: 'transparent', border: '1px solid #1f262e', color: '#9ca3af', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Clear Deck</button>
                    <button onClick={handleSaveWorkout} style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
                      <CheckCircle size={16} /> Push Routine to Athlete
                    </button>
                  </div>
                )}

                {saveStatus && (
                  <p style={{ fontSize: '13px', color: '#fbbf24', textAlign: 'right', margin: '12px 0 0 0', fontWeight: '600' }}>
                    {saveStatus}
                  </p>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
