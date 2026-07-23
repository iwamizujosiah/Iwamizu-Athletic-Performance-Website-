"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { 
  Dumbbell, Timer, CheckCircle, Activity, Award, User, Lock, ArrowRight, Zap, Target, Flame, X
} from 'lucide-react';

export default function AthleteGatePortal() {
  // Authentication Barrier States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [athleteIdentifier, setAthleteIdentifier] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentAthlete, setCurrentAthlete] = useState(null);

  // Workout View Modal State
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutItems, setWorkoutItems] = useState([]);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const [completedSets, setCompletedSets] = useState({});

  // Performance Dashboard Data States (Mock aggregates matching image structure)
  const [metrics, setMetrics] = useState({
    sessionsMissed: 0,
    volumeSets: 48,
    volumeReps: 380,
    loadPBs: 3
  });

  const [advancedPerformance, setAdvancedPerformance] = useState({
    proAgility: "4.15s",
    verticalJump: '34.5"',
    flying10: "1.02s",
    flying20: "1.98s"
  });

  // Check persistent login token state on mount
  useEffect(() => {
    const savedAthlete = localStorage.getItem('athlete_profile');
    if (savedAthlete) {
      const parsedProfile = JSON.parse(savedAthlete);
      setCurrentAthlete(parsedProfile);
      setIsAuthenticated(true);
      fetchLatestWorkout(parsedProfile.id);
    }
  }, []);

  // Validate athlete against database checking BOTH access code and name matches cleanly
  const handleAthleteLogin = async (e) => {
    e.preventDefault();
    const input = athleteIdentifier.trim().toLowerCase();
    if (!input) return;

    try {
      setAuthError('');
      setLoadingWorkout(true);
      
      // Pull down roster rows safely without strict row count constraints
      const { data: athletesData, error } = await supabase
        .from('athletes')
        .select('*');

      if (error) {
        console.error("Supabase pull mismatch:", error.message);
        // Show exact error message to debug permission/table issues
        setAuthError(`❌ DB Error: ${error.message} (${error.code || 'No Code'})`);
        setLoadingWorkout(false);
        return;
      }

      // Find a clean matching profile row using robust JavaScript filtering
      const athleteData = athletesData?.find(a => 
        (a.access_code && String(a.access_code).toLowerCase() === input) ||
        (a.name && String(a.name).toLowerCase() === input)
      );

      if (!athleteData) {
        setAuthError('❌ Profile row not found. Check spelling or use your unique Sheet Access Code.');
        setLoadingWorkout(false);
        return;
      }

      setCurrentAthlete(athleteData);
      setIsAuthenticated(true);
      localStorage.setItem('athlete_profile', JSON.stringify(athleteData));
      fetchLatestWorkout(athleteData.id);

    } catch (err) {
      setAuthError(`Network timeout connecting to performance registry: ${err.message}`);
    } finally {
      setLoadingWorkout(false);
    }
  };

  // Fetch the latest master protocol prescribed by the coach
  async function fetchLatestWorkout(athleteId) {
    try {
      setLoadingWorkout(true);
      
      const { data: workoutHeader, error: headerErr } = await supabase
        .from('workouts')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (headerErr) throw headerErr;

      if (!workoutHeader) {
        // Fallback display playbook if no live relational data has been pushed yet
        setActiveWorkout({ title: "Championship GPP Protocol" });
        setWorkoutItems([
          { id: 'm1', exercise_name: 'Banded Pull Aparts', block_type: 'Activation', modality: 'Banded', tracking_unit: 'reps', sets: 3, reps: '12', rest_timer: '45s' },
          { id: 'm2', exercise_name: 'Spanish Squat Isometric Hold', block_type: 'Activation', modality: 'Banded', tracking_unit: 'seconds', sets: 3, seconds_value: '45', rest_timer: '60s' },
          { id: 'm3', exercise_name: 'Flying 10 Meter Sprint', block_type: 'Athletic Block', modality: 'Bodyweight', tracking_unit: 'seconds', sets: 4, seconds_value: '1.02', rest_timer: '3 min' },
          { id: 'm4', exercise_name: 'Barbell Back Squat', block_type: 'Strength', modality: 'Barbell', tracking_unit: 'lbs', sets: 4, load_value: '225', rest_timer: '2 min' }
        ]);
        return;
      }

      setActiveWorkout(workoutHeader);

      const { data: itemsData, error: itemsErr } = await supabase
        .from('workout_items')
        .select('*')
        .eq('workout_id', workoutHeader.id)
        .order('order_index', { ascending: true });

      if (itemsErr) throw itemsErr;
      setWorkoutItems(itemsData || []);

    } catch (err) {
      console.error("Failed loading performance targets:", err.message);
    } finally {
      setLoadingWorkout(false);
    }
  }

  const toggleSetCheckbox = (itemId, setIndex) => {
    const key = `${itemId}-set-${setIndex}`;
    setCompletedSets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('athlete_profile');
    setIsAuthenticated(false);
    setCurrentAthlete(null);
    setActiveWorkout(null);
    setWorkoutItems([]);
    setShowWorkoutModal(false);
  };

  const activationExercises = workoutItems.filter(item => item.block_type === 'Activation');
  const movementExercises = workoutItems.filter(item => item.block_type === 'Movement');
  const athleticExercises = workoutItems.filter(item => item.block_type === 'Athletic Block');
  const strengthExercises = workoutItems.filter(item => item.block_type === 'Strength');

  // Gated Access Screening Window
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0d0f12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#ffffff', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Zap size={26} style={{ color: '#dc2626' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0', letterSpacing: '0.02em' }}>ATHLETE PROFILE GATE</h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '6px', marginBottom: '28px' }}>Sync your device with the coaching command deck to access your custom protocols.</p>

          <form onSubmit={handleAthleteLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>Use First and Last or Code Provided</label>
              <input 
                type="text" 
                placeholder="First Last or IW-XX-0000"
                value={athleteIdentifier} 
                onChange={(e) => setAthleteIdentifier(e.target.value)} 
                style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '10px', padding: '14px', fontSize: '15px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {authError && <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600', margin: '0 0 16px 0', lineHeight: '1.4' }}>{authError}</p>}
            <button type="submit" style={{ width: '100%', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '14px', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
              Sync Performance Line <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER MODAL SECTIONS HELPER
  const renderBlockSection = (title, exercises, iconColor, accentBg) => {
    if (exercises.length === 0) return null;
    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', backgroundColor: accentBg, padding: '8px 12px', borderRadius: '6px', borderLeft: `3px solid ${iconColor}` }}>
          <h3 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', margin: '0' }}>{title}</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {exercises.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0' }}>{item.exercise_name}</h4>
                  <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>{item.modality}</span>
                </div>
                {item.rest_timer && item.rest_timer !== 'None' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                    <Timer size={10} /> Rest: {item.rest_timer}
                  </span>
                )}
              </div>

              <div style={{ backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '6px', padding: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af', display: 'block' }}>Sets</span>
                  <span style={{ fontSize: '15px', fontWeight: '900' }}>{item.sets}</span>
                </div>
                <div style={{ borderLeft: '1px solid #1f262e', height: '16px' }}></div>
                <div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#dc2626', fontWeight: 'bold', display: 'block' }}>Prescription</span>
                  <span style={{ fontSize: '15px', fontWeight: '900' }}>
                    {item.tracking_unit === 'reps' && `${item.reps} Reps`}
                    {item.tracking_unit === 'lbs' && `${item.load_value} lbs`}
                    {item.tracking_unit === 'seconds' && `${item.seconds_value}s`}
                    {item.tracking_unit === 'distance' && `${item.distance_value}`}
                    {item.tracking_unit === 'inches' && `${item.reps || item.load_value || 'Max'}"`}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {Array.from({ length: item.sets }).map((_, idx) => {
                    const setKey = `${item.id}-set-${idx}`;
                    const isChecked = !!completedSets[setKey];
                    return (
                      <button 
                        key={idx} 
                        onClick={() => toggleSetCheckbox(item.id, idx)}
                        style={{ flex: 1, backgroundColor: isChecked ? '#dc2626' : '#1c232b', border: isChecked ? '1px solid #dc2626' : '1px solid #1f262e', color: isChecked ? '#ffffff' : '#9ca3af', fontWeight: 'bold', padding: '6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        S{idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#ffffff', fontFamily: 'sans-serif', padding: '16px', boxSizing: 'border-box' }}>
      
      {/* BRAND HEADER LAYER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #111', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: '#111', padding: '6px', borderRadius: '6px', border: '1px solid #222', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: '900', letterSpacing: '0.05em', display: 'block', lineHeight: '1' }}>IWAMIZU</span>
            <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Athletic Performance</span>
          </div>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#dc2626', margin: '0' }}>{currentAthlete?.name || 'Athlete'}</h2>
      </div>

      {/* HOMESCREEN APP PRO-TIP BANNER */}
      <div style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <span style={{ fontSize: '20px' }}>💡</span>
        <p style={{ margin: '0', fontSize: '13px', color: '#d1d5db', fontWeight: '500', lineHeight: '1.4' }}>
          <strong style={{ color: '#ffffff' }}>Pro-Tip:</strong> Tap "Share" and "Add to Home Screen" to use this as an app.
        </p>
      </div>

      {/* SECTION 1: PROGRESS OVERVIEW BANNER */}
      <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#dc2626', margin: '0 0 16px 0', letterSpacing: '0.02em' }}>Progress Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#111111', border: '1px solid #1f262e', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Sessions Missed</span>
          <span style={{ fontSize: '22px', fontWeight: '900' }}>{metrics.sessionsMissed}</span>
        </div>
        <div style={{ backgroundColor: '#111111', border: '1px solid #1f262e', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Volume (Sets)</span>
          <span style={{ fontSize: '22px', fontWeight: '900' }}>{metrics.volumeSets}</span>
        </div>
        <div style={{ backgroundColor: '#111111', border: '1px solid #1f262e', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Volume (Reps)</span>
          <span style={{ fontSize: '22px', fontWeight: '900' }}>{metrics.volumeReps}</span>
        </div>
        <div style={{ backgroundColor: '#111111', border: '1px solid #1f262e', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Load PBs</span>
          <span style={{ fontSize: '22px', fontWeight: '900', color: '#fbbf24' }}>{metrics.loadPBs}</span>
        </div>
      </div>

      {/* SECTION 2: ADVANCED PERFORMANCE METRICS */}
      <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#dc2626', margin: '0 0 16px 0', letterSpacing: '0.02em' }}>Advanced Performance</h3>
      <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1c232b', borderRadius: '12px', padding: '16px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #111' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>5-10-5 Time</span>
          <span style={{ fontSize: '15px', fontWeight: '900', color: '#60a5fa' }}>{advancedPerformance.proAgility}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #111' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Vertical Jump</span>
          <span style={{ fontSize: '15px', fontWeight: '900', color: '#4ade80' }}>{advancedPerformance.verticalJump}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #111' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Flying 10</span>
          <span style={{ fontSize: '15px', fontWeight: '900', color: '#fbbf24' }}>{advancedPerformance.flying10}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Flying 20</span>
          <span style={{ fontSize: '15px', fontWeight: '900', color: '#fbbf24' }}>{advancedPerformance.flying20}</span>
        </div>
      </div>

      {/* CORE INTERACTIVE WORKOUT LAUNCH BUTTON */}
      <button 
        onClick={() => setShowWorkoutModal(true)}
        style={{ width: '100%', backgroundColor: '#ff0000', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '18px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(255, 0, 0, 0.3)', marginBottom: '16px' }}
      >
        🔥 Today's Assigned Workout
      </button>

      <div onClick={handleLogout} style={{ textAlign: 'center', fontSize: '13px', color: '#444444', cursor: 'pointer', padding: '8px 0' }}>
        Lock Dashboard
      </div>

      {/* DYNAMIC FULL-SCREEN INTERACTIVE WORKOUT MODAL */}
      {showWorkoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000000', zIndex: 100, overflowY: 'auto', padding: '16px', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#111', padding: '12px', borderRadius: '10px', border: '1px solid #222' }}>
            <div>
              <span style={{ fontSize: '9px', fontWeight: '900', color: '#dc2626', textTransform: 'uppercase', display: 'block' }}>Active Session Protocol</span>
              <h2 style={{ fontSize: '16px', fontWeight: '900', margin: '0' }}>{activeWorkout?.title || "Championship GPP Protocol"}</h2>
            </div>
            <button 
              onClick={() => setShowWorkoutModal(false)}
              style={{ backgroundColor: '#222', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {loadingWorkout ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>
              <Activity className="animate-spin" size={28} style={{ color: '#dc2626', margin: '0 auto 12px auto' }} />
              <span>Syncing customized prescription lines...</span>
            </div>
          ) : workoutItems.length > 0 ? (
            <div style={{ maxWidth: '600px', margin: '0 auto', pb: '40px' }}>
              {renderBlockSection('1. Activation Layer', activationExercises, '#3b82f6', 'rgba(59, 130, 246, 0.05)')}
              {renderBlockSection('2. Movement Prep & Mechanics', movementExercises, '#10b981', 'rgba(16, 185, 129, 0.05)')}
              {renderBlockSection('3. Explosive Athletic Block', athleticExercises, '#f59e0b', 'rgba(245, 158, 11, 0.05)')}
              {renderBlockSection('4. Structural Strength & Ballistics', strengthExercises, '#dc2626', 'rgba(220, 38, 38, 0.05)')}
              
              <button 
                onClick={() => setShowWorkoutModal(false)}
                style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', color: '#ffffff', fontWeight: 'bold', padding: '14px', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}
              >
                Complete Workout & Close Session
              </button>
            </div>
          ) : (
            <div style={{ border: '2px dashed #222', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#666', marginTop: '40px' }}>
              <Flame size={24} style={{ margin: '0 auto 12px auto' }} />
              <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#999' }}>Active training slate is empty.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
