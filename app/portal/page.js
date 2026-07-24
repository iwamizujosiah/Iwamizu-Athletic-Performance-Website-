"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { toLocalDateString } from '../../lib/dateUtils.js';
import {
  Dumbbell, Timer, CheckCircle, Activity, Award, User, Lock, ArrowRight, Zap, Target, Flame, X, Repeat,
  Calendar as CalendarIcon, MessageSquare, ClipboardCheck
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

  // Alternate/Modified Exercise Swaps: workout_item.id -> { id, name, modality } of the chosen alternate
  const [itemAlternatesMap, setItemAlternatesMap] = useState({});
  const [exerciseSwaps, setExerciseSwaps] = useState({});
  const [swapPickerOpenFor, setSwapPickerOpenFor] = useState(null);

  // Sidebar Navigation & Calendar View States
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [athleteView, setAthleteView] = useState('today'); // 'today' | 'calendar'
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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
    const savedSidebarPref = localStorage.getItem('athlete_sidebar_expanded');
    if (savedSidebarPref === 'true') {
      setSidebarExpanded(true);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('athlete_sidebar_expanded', String(next));
      return next;
    });
  };

  // Lazy-load the full workout calendar the first time the athlete opens that view
  useEffect(() => {
    if (athleteView === 'calendar' && currentAthlete && allWorkouts.length === 0 && !calendarLoading) {
      loadAllWorkouts(currentAthlete.id);
    }
  }, [athleteView, currentAthlete]);

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

  // Load a specific workout's exercise items and resolve alternate/swap options for it
  async function loadWorkoutDetail(workoutHeader) {
    setActiveWorkout(workoutHeader);
    setCompletedSets({});
    setExerciseSwaps({});

    const { data: itemsData, error: itemsErr } = await supabase
      .from('workout_items')
      .select('*')
      .eq('workout_id', workoutHeader.id)
      .order('order_index', { ascending: true });

    if (itemsErr) throw itemsErr;
    setWorkoutItems(itemsData || []);
    loadAlternateOptions(itemsData || []);
  }

  // Fetch whichever workout is scheduled for today; falls back to the most recently
  // created workout for legacy/undated rows, or a demo protocol if nothing exists yet
  async function fetchLatestWorkout(athleteId) {
    try {
      setLoadingWorkout(true);
      const todayStr = toLocalDateString();

      let { data: workoutHeader, error: headerErr } = await supabase
        .from('workouts')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('scheduled_date', todayStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (headerErr) throw headerErr;

      if (!workoutHeader) {
        const fallback = await supabase
          .from('workouts')
          .select('*')
          .eq('athlete_id', athleteId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (fallback.error) throw fallback.error;
        workoutHeader = fallback.data;
      }

      if (!workoutHeader) {
        // Fallback display playbook if no live relational data has been pushed yet
        setActiveWorkout({ title: "Championship GPP Protocol" });
        const fallbackItems = [
          { id: 'm1', exercise_name: 'Banded Pull Aparts', block_type: 'Activation', modality: 'Banded', tracking_unit: 'reps', sets: 3, reps: '12', rest_timer: '45s' },
          { id: 'm2', exercise_name: 'Spanish Squat Isometric Hold', block_type: 'Activation', modality: 'Banded', tracking_unit: 'seconds', sets: 3, seconds_value: '45', rest_timer: '60s' },
          { id: 'm3', exercise_name: 'Flying 10 Meter Sprint', block_type: 'Athletic Block', modality: 'Bodyweight', tracking_unit: 'seconds', sets: 4, seconds_value: '1.02', rest_timer: '3 min' },
          { id: 'm4', exercise_name: 'Barbell Back Squat', block_type: 'Strength', modality: 'Barbell', tracking_unit: 'lbs', sets: 4, load_value: '225', rest_timer: '2 min' }
        ];
        setWorkoutItems(fallbackItems);
        loadAlternateOptions(fallbackItems);
        return;
      }

      await loadWorkoutDetail(workoutHeader);

    } catch (err) {
      console.error("Failed loading performance targets:", err.message);
    } finally {
      setLoadingWorkout(false);
    }
  }

  // Fetch every workout ever scheduled for this athlete, for the Calendar view
  async function loadAllWorkouts(athleteId) {
    try {
      setCalendarLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setAllWorkouts(data || []);
    } catch (err) {
      console.error("Failed loading workout calendar:", err.message);
    } finally {
      setCalendarLoading(false);
    }
  }

  // Open a specific calendar day's workout in the modal
  const openWorkoutForDate = async (workout) => {
    try {
      setLoadingWorkout(true);
      setShowWorkoutModal(true);
      await loadWorkoutDetail(workout);
    } catch (err) {
      console.error("Failed loading that day's workout:", err.message);
    } finally {
      setLoadingWorkout(false);
    }
  };

  // "Today's Assignment" sidebar tab - refetches in case the date rolled over since
  // login, then pulls the assignment straight up (workout, video, doc, or note)
  const openTodaysAssignment = async () => {
    if (!currentAthlete) return;
    setShowWorkoutModal(true);
    await fetchLatestWorkout(currentAthlete.id);
  };

  // Resolve which alternate/modified exercises are available for each prescribed item,
  // so athletes can swap movements (e.g. no barbell available -> goblet squat instead)
  async function loadAlternateOptions(items) {
    try {
      const { data: libData, error: libErr } = await supabase.from('exercises').select('*');
      if (libErr || !libData) return;

      const { data: altData } = await supabase.from('exercise_alternates').select('*');
      const altMap = {};
      (altData || []).forEach(row => {
        if (!altMap[row.exercise_id]) altMap[row.exercise_id] = [];
        if (!altMap[row.alternate_exercise_id]) altMap[row.alternate_exercise_id] = [];
        altMap[row.exercise_id].push(row.alternate_exercise_id);
        altMap[row.alternate_exercise_id].push(row.exercise_id);
      });

      const itemMap = {};
      items.forEach(item => {
        const libEx = libData.find(e => e.name.toLowerCase() === (item.exercise_name || '').toLowerCase());
        if (!libEx) return;
        const altExercises = (altMap[libEx.id] || [])
          .map(id => libData.find(e => e.id === id))
          .filter(Boolean);
        if (altExercises.length > 0) itemMap[item.id] = altExercises;
      });

      setItemAlternatesMap(itemMap);
    } catch (err) {
      console.error("Failed loading alternate exercise options:", err.message);
    }
  }

  const toggleSetCheckbox = (itemId, setIndex) => {
    const key = `${itemId}-set-${setIndex}`;
    setCompletedSets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const chooseExerciseSwap = (itemId, altExercise) => {
    setExerciseSwaps(prev => ({ ...prev, [itemId]: altExercise }));
    setSwapPickerOpenFor(null);
  };

  const clearExerciseSwap = (itemId) => {
    setExerciseSwaps(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setSwapPickerOpenFor(null);
  };

  // Parse a prescription field (which may include units like "20yds") down to a plain number
  const parseMetricNumber = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(num) ? num : null;
  };

  // Convert common YouTube link formats into an embeddable URL, for video assignments
  const toEmbedUrl = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
      }
      if (u.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed${u.pathname}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Log one exercise_logs row per exercise that had at least one set checked off,
  // so the coach's History & Bests drawer has real session data to analyze
  const handleCompleteWorkout = async () => {
    try {
      const logsToInsert = [];
      workoutItems.forEach(item => {
        const setsCompleted = Array.from({ length: item.sets }).filter((_, idx) => completedSets[`${item.id}-set-${idx}`]).length;
        if (setsCompleted === 0) return;

        let metricValue = null;
        let targetLabel = '';
        if (item.tracking_unit === 'reps') { metricValue = parseMetricNumber(item.reps); targetLabel = `${item.reps} reps`; }
        else if (item.tracking_unit === 'lbs') { metricValue = parseMetricNumber(item.load_value); targetLabel = `${item.reps ? `${item.reps} x ` : ''}${item.load_value} lbs`; }
        else if (item.tracking_unit === 'seconds') { metricValue = parseMetricNumber(item.seconds_value); targetLabel = `${item.reps ? `${item.reps} x ` : ''}${item.seconds_value}s`; }
        else if (item.tracking_unit === 'distance') { metricValue = parseMetricNumber(item.distance_value); targetLabel = `${item.reps ? `${item.reps} x ` : ''}${item.distance_value}`; }
        else if (item.tracking_unit === 'inches') { metricValue = parseMetricNumber(item.reps || item.load_value); targetLabel = `${item.reps || item.load_value}"`; }

        logsToInsert.push({
          athlete_id: currentAthlete.id,
          workout_id: activeWorkout?.id || null,
          exercise_name: exerciseSwaps[item.id]?.name || item.exercise_name,
          block_type: item.block_type,
          tracking_unit: item.tracking_unit,
          metric_value: metricValue,
          target_value: targetLabel,
          sets_completed: setsCompleted,
          logged_at: new Date().toISOString()
        });
      });

      if (logsToInsert.length > 0) {
        const { error } = await supabase.from('exercise_logs').insert(logsToInsert);
        if (error) console.error("Failed logging session history:", error.message);
      }
    } catch (err) {
      console.error("Failed logging session history:", err.message);
    } finally {
      setShowWorkoutModal(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('athlete_profile');
    setIsAuthenticated(false);
    setCurrentAthlete(null);
    setActiveWorkout(null);
    setWorkoutItems([]);
    setShowWorkoutModal(false);
    setAthleteView('today');
    setAllWorkouts([]);
  };

  // Group workout items into whatever sections the coach built the workout with,
  // in the order those sections first appear (order_index from the fetch query)
  const KNOWN_SECTION_STYLES = {
    'Activation': { label: 'Activation', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)' },
    'Movement': { label: 'Movement Prep & Mechanics', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)' },
    'Athletic Block': { label: 'Explosive Athletic Block', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)' },
    'Strength': { label: 'Structural Strength & Ballistics', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.05)' }
  };
  const FALLBACK_SECTION_COLORS = ['#a855f7', '#14b8a6', '#eab308', '#ec4899', '#6366f1'];

  const workoutSections = [];
  const workoutSectionSeen = new Set();
  workoutItems.forEach(item => {
    const key = item.block_type || 'Uncategorized';
    if (!workoutSectionSeen.has(key)) {
      workoutSectionSeen.add(key);
      workoutSections.push(key);
    }
  });

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
          {exercises.map((item) => {
            const swap = exerciseSwaps[item.id];
            const alternates = itemAlternatesMap[item.id] || [];
            const displayName = swap?.name || item.exercise_name;
            const displayModality = swap?.modality || item.modality;
            return (
            <div key={item.id} style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0' }}>{displayName}</h4>
                    {swap && (
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>SWAPPED</span>
                    )}
                    {alternates.length > 0 && (
                      <button onClick={() => setSwapPickerOpenFor(swapPickerOpenFor === item.id ? null : item.id)} title="Swap exercise" style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                        <Repeat size={13} />
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>{displayModality}</span>

                  {swapPickerOpenFor === item.id && (
                    <div style={{ marginTop: '8px', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {swap && (
                        <button onClick={() => clearExerciseSwap(item.id)} style={{ textAlign: 'left', background: 'transparent', border: 'none', color: '#f87171', fontSize: '12px', fontWeight: 'bold', padding: '6px', cursor: 'pointer' }}>
                          ↺ Use Original: {item.exercise_name}
                        </button>
                      )}
                      {alternates.filter(alt => alt.name !== swap?.name).map(alt => (
                        <button key={alt.id} onClick={() => chooseExerciseSwap(item.id, alt)} style={{ textAlign: 'left', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '12px', padding: '6px', cursor: 'pointer' }}>
                          {alt.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {item.rest_timer && item.rest_timer !== 'None' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', flexShrink: 0 }}>
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
                    {item.tracking_unit === 'lbs' && `${item.reps ? `${item.reps} x ` : ''}${item.load_value} lbs`}
                    {item.tracking_unit === 'seconds' && `${item.reps ? `${item.reps} x ` : ''}${item.seconds_value}s`}
                    {item.tracking_unit === 'distance' && `${item.reps ? `${item.reps} x ` : ''}${item.distance_value}`}
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
            );
          })}
        </div>
      </div>
    );
  };

  // Build the Sun-Sat grid of cells for the currently viewed calendar month
  const renderCalendarGrid = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayStr = toLocalDateString();

    const workoutsByDate = {};
    allWorkouts.forEach(w => {
      if (!w.scheduled_date) return;
      if (!workoutsByDate[w.scheduled_date]) workoutsByDate[w.scheduled_date] = [];
      workoutsByDate[w.scheduled_date].push(w);
    });

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) cells.push(day);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} style={{ backgroundColor: '#111111', border: '1px solid #1f262e', color: '#ffffff', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>‹</button>
          <h3 style={{ fontSize: '16px', fontWeight: '900', margin: '0' }}>{calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} style={{ backgroundColor: '#111111', border: '1px solid #1f262e', color: '#ffffff', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>›</button>
        </div>

        {calendarLoading ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Loading calendar...</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                <div key={idx} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {cells.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayWorkouts = workoutsByDate[dateStr] || [];
                const hasWorkout = dayWorkouts.length > 0;
                const isToday = dateStr === todayStr;
                return (
                  <button
                    key={idx}
                    onClick={() => hasWorkout && openWorkoutForDate(dayWorkouts[0])}
                    disabled={!hasWorkout}
                    title={hasWorkout ? dayWorkouts[0].title : ''}
                    style={{
                      aspectRatio: '1',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: hasWorkout ? 'rgba(220, 38, 38, 0.12)' : '#111111',
                      border: isToday ? '1px solid #dc2626' : '1px solid #1f262e',
                      borderRadius: '8px',
                      color: hasWorkout ? '#ffffff' : '#4b5563',
                      fontSize: '12px', fontWeight: isToday ? '900' : '600',
                      cursor: hasWorkout ? 'pointer' : 'default',
                      padding: '4px'
                    }}
                  >
                    {day}
                    {hasWorkout && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#dc2626', marginTop: '2px' }} />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#ffffff', fontFamily: 'sans-serif', display: 'flex', boxSizing: 'border-box' }}>

      {/* COLLAPSIBLE SIDEBAR NAVIGATION */}
      <aside style={{ width: sidebarExpanded ? '200px' : '60px', backgroundColor: '#0a0a0a', borderRight: '1px solid #1f262e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: sidebarExpanded ? '16px' : '16px 8px', flexShrink: 0, boxSizing: 'border-box', transition: 'width 0.18s ease, padding 0.18s ease', overflow: 'hidden', minHeight: '100vh' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'space-between' : 'center', marginBottom: '24px', gap: '6px' }}>
            {sidebarExpanded && (
              <div style={{ backgroundColor: '#111', padding: '4px', borderRadius: '6px', border: '1px solid #222', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}
            <button onClick={toggleSidebar} title={sidebarExpanded ? 'Collapse' : 'Expand'} style={{ backgroundColor: '#111111', border: '1px solid #1f262e', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}>
              {sidebarExpanded ? '‹' : '›'}
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setAthleteView('today')} title="Home Screen" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '10px', width: '100%', padding: sidebarExpanded ? '10px 12px' : '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: athleteView === 'today' ? '#dc2626' : 'transparent', color: '#ffffff' }}>
              <Flame size={16} /> {sidebarExpanded && 'Home Screen'}
            </button>
            <button onClick={openTodaysAssignment} title="Today's Assignment" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '10px', width: '100%', padding: sidebarExpanded ? '10px 12px' : '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: 'transparent', color: '#ffffff' }}>
              <ClipboardCheck size={16} /> {sidebarExpanded && "Today's Assignment"}
            </button>
            <button onClick={() => setAthleteView('calendar')} title="Calendar" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '10px', width: '100%', padding: sidebarExpanded ? '10px 12px' : '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: athleteView === 'calendar' ? '#dc2626' : 'transparent', color: '#ffffff' }}>
              <CalendarIcon size={16} /> {sidebarExpanded && 'Calendar'}
            </button>
            <button onClick={() => setAthleteView('messages')} title="Messages" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '10px', width: '100%', padding: sidebarExpanded ? '10px 12px' : '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: athleteView === 'messages' ? '#dc2626' : 'transparent', color: '#ffffff' }}>
              <MessageSquare size={16} /> {sidebarExpanded && 'Messages'}
            </button>
          </nav>
        </div>

        <div>
          {sidebarExpanded && <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 8px 4px', whiteSpace: 'nowrap' }}>{currentAthlete?.name || 'Athlete'}</p>}
          <button onClick={handleLogout} title="Lock Dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '10px', width: '100%', padding: sidebarExpanded ? '10px 12px' : '10px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: 'transparent', color: '#4b5563' }}>
            <Lock size={14} /> {sidebarExpanded && 'Lock Dashboard'}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '16px', boxSizing: 'border-box', minWidth: 0 }}>

        {athleteView === 'today' && (
          <>
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
              onClick={openTodaysAssignment}
              style={{ width: '100%', backgroundColor: '#ff0000', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '18px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(255, 0, 0, 0.3)', marginBottom: '16px' }}
            >
              {activeWorkout?.assignment_type === 'video' && "🎬 Today's Video Assignment"}
              {activeWorkout?.assignment_type === 'document' && "📄 Today's Document"}
              {activeWorkout?.assignment_type === 'note' && "📝 Today's Note"}
              {(!activeWorkout?.assignment_type || activeWorkout.assignment_type === 'workout') && "🔥 Today's Assigned Workout"}
            </button>
          </>
        )}

        {athleteView === 'calendar' && (
          <>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#dc2626', margin: '0 0 16px 0', letterSpacing: '0.02em' }}>My Calendar</h3>
            <div style={{ backgroundColor: '#111111', border: '1px solid #1f262e', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              {renderCalendarGrid()}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>Tap a highlighted day to view that session.</p>
          </>
        )}

        {athleteView === 'messages' && (
          <>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#dc2626', margin: '0 0 16px 0', letterSpacing: '0.02em' }}>Messages</h3>
            <div style={{ border: '2px dashed #1f262e', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <MessageSquare size={28} style={{ color: '#1f262e', margin: '0 auto 12px auto' }} />
              <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>Direct messaging with your coach is on the roadmap, not built yet.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Say the word and this becomes the next build.</p>
            </div>
          </>
        )}
      </main>

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
          ) : activeWorkout?.assignment_type && activeWorkout.assignment_type !== 'workout' ? (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ backgroundColor: '#111111', border: '1px solid #1f262e', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeWorkout.assignment_type === 'video' ? '🎬 Video Assignment' : activeWorkout.assignment_type === 'document' ? '📄 Document Assignment' : '📝 Coach Note'}
                </span>

                {activeWorkout.notes && (
                  <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.6', margin: '12px 0 0 0', whiteSpace: 'pre-wrap' }}>{activeWorkout.notes}</p>
                )}

                {activeWorkout.assignment_type === 'video' && activeWorkout.content_url && (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', marginTop: '16px' }}>
                    <iframe
                      src={toEmbedUrl(activeWorkout.content_url)}
                      title="Assignment video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                )}

                {activeWorkout.assignment_type === 'document' && activeWorkout.content_url && (
                  <a href={activeWorkout.content_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', backgroundColor: '#1c232b', border: '1px solid #1f262e', color: '#60a5fa', fontWeight: 'bold', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
                    View Document ↗
                  </a>
                )}
              </div>

              <button
                onClick={() => setShowWorkoutModal(false)}
                style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', color: '#ffffff', fontWeight: 'bold', padding: '14px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Got It, Close
              </button>
            </div>
          ) : workoutItems.length > 0 ? (
            <div style={{ maxWidth: '600px', margin: '0 auto', pb: '40px' }}>
              {workoutSections.map((sectionName, idx) => {
                const style = KNOWN_SECTION_STYLES[sectionName] || {
                  label: sectionName,
                  color: FALLBACK_SECTION_COLORS[idx % FALLBACK_SECTION_COLORS.length],
                  bg: 'rgba(255, 255, 255, 0.04)'
                };
                const items = workoutItems.filter(item => item.block_type === sectionName);
                return renderBlockSection(`${idx + 1}. ${style.label}`, items, style.color, style.bg);
              })}
              
              <button
                onClick={handleCompleteWorkout}
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
