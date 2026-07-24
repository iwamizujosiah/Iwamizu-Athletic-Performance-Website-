"use client";

export const dynamic = "force-dynamic";


import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
import {
  Users, Dumbbell, Calendar, MessageSquare, Settings,
  Search, ShieldAlert, Award, Activity, Plus, Lock, KeyRound, Trash2, CheckCircle, Timer,
  BookOpen, Pencil, PlayCircle, X, ClipboardList, TrendingUp, TrendingDown, Minus, FileWarning,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const DEFAULT_SECTIONS = ['Activation', 'Movement', 'Athletic Block', 'Strength'];

// Summarize a list of exercise_logs rows (already sorted newest-first) into a
// personal best, trend direction, and the most recent handful of sessions
function summarizeHistory(logs) {
  if (!logs || logs.length === 0) return null;
  const unit = logs[0].tracking_unit || 'reps';
  const numericLogs = logs.filter(l => typeof l.metric_value === 'number' && !Number.isNaN(l.metric_value));

  let pbLabel = null;
  if (numericLogs.length > 0) {
    const pbValue = unit === 'seconds'
      ? Math.min(...numericLogs.map(l => l.metric_value))
      : Math.max(...numericLogs.map(l => l.metric_value));
    const suffix = { lbs: ' lbs', seconds: 's', reps: ' reps', inches: '"', distance: '' }[unit] || '';
    pbLabel = `${pbValue}${suffix}`;
  }

  let trend = 'flat';
  if (numericLogs.length >= 2) {
    const newest = numericLogs[0].metric_value;
    const oldest = numericLogs[numericLogs.length - 1].metric_value;
    if (unit === 'seconds' ? newest < oldest : newest > oldest) trend = 'up';
    else if (unit === 'seconds' ? newest > oldest : newest < oldest) trend = 'down';
  }

  return { unit, pbLabel, trend, recent: logs.slice(0, 5) };
}

// Group a flat list of prescription/template items into ordered sections by block_type,
// preserving the order sections first appear in the list
function groupItemsBySection(items) {
  const order = [];
  const map = {};
  items.forEach(item => {
    const key = item.block_type || 'Uncategorized';
    if (!map[key]) {
      map[key] = [];
      order.push(key);
    }
    map[key].push(item);
  });
  return order.map(name => ({ name, items: map[name] }));
}

export default function CoachingDashboard() {
  // Access Control / Registration Lock State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard Navigation & Data States
  const [activeTab, setActiveTab] = useState('athletes');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [trendLogs, setTrendLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Master Exercise Library States
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [selectedBlockType, setSelectedBlockType] = useState('Activation'); // Activation, Movement, Strength, Athletic Block

  // Exercise Library Tab: Search, Filters, CRUD Modal & Stats
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryBlockFilter, setLibraryBlockFilter] = useState('All');
  const [libraryModalityFilter, setLibraryModalityFilter] = useState('All');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null); // null = add mode
  const [exerciseForm, setExerciseForm] = useState({ name: '', block_type: 'Activation', modality: 'Bodyweight', tracking_unit: 'reps', video_url: '' });
  const [libraryToast, setLibraryToast] = useState('');
  const [topProgrammed, setTopProgrammed] = useState([]);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [exerciseAlternatesMap, setExerciseAlternatesMap] = useState({}); // exercise_id -> [alternate_exercise_id,...], bidirectional
  const [exerciseFormAlternates, setExerciseFormAlternates] = useState([]); // ids selected in the Add/Edit modal
  const [alternatePickerValue, setAlternatePickerValue] = useState('');

  // Current Workout Being Built
  const [targetAthleteId, setTargetAthleteId] = useState('');
  const [workoutName, setWorkoutName] = useState('Championship GPP Protocol');
  const [currentPrescription, setCurrentPrescription] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [workoutScheduledDate, setWorkoutScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repeatMode, setRepeatMode] = useState('none'); // none | daily | weekly | monthly
  const [repeatCount, setRepeatCount] = useState(1);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('');
  const [rxTargetSection, setRxTargetSection] = useState('Activation'); // which section newly-clicked exercises land in
  const [rxManualSections, setRxManualSections] = useState([]); // custom section names created but not yet holding an item

  // History & Bests drawer (per exercise, per athlete)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyExerciseName, setHistoryExerciseName] = useState('');
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Program Templates: reusable block sequences, built the same way as a workout
  const [templates, setTemplates] = useState([]);
  const [templateItemsMap, setTemplateItemsMap] = useState({}); // template_id -> items[]
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateBlockType, setTemplateBlockType] = useState('Activation');
  const [templateBuilderName, setTemplateBuilderName] = useState('');
  const [templateBuilderItems, setTemplateBuilderItems] = useState([]);
  const [templateStatus, setTemplateStatus] = useState('');
  const [templateTargetSection, setTemplateTargetSection] = useState('Activation');
  const [templateManualSections, setTemplateManualSections] = useState([]);

  const [stats, setStats] = useState({
    attendance: "87%",
    activeAthletes: 6,
    flagged: 1,
    prsThisWeek: 5,
    sessionsPerWeek: 24
  });

  // Add Athlete Modal
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [newAthleteForm, setNewAthleteForm] = useState({ name: '', email: '', access_code: '', weight_lbs: '', status: 'On Track' });

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
    const savedSidebarPref = localStorage.getItem('coach_sidebar_expanded');
    if (savedSidebarPref === 'true') {
      setSidebarExpanded(true);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('coach_sidebar_expanded', String(next));
      return next;
    });
  };

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

        if (!athleteErr && athletesData && athletesData.length > 0) {
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
        } else {
          const fallbackAthletes = [
            { id: 'a1', name: 'Devon Allen', weight_lbs: 185, status: 'On Track', streak_percentage: 96, email: 'd.allen@olympic.sprint' },
            { id: 'a2', name: 'Christian Coleman', weight_lbs: 174, status: 'On Track', streak_percentage: 94, email: 'coleman@speed.club' },
            { id: 'a3', name: 'Erriyon Knighton', weight_lbs: 170, status: 'Flagged', streak_percentage: 78, email: 'knighton@future.pro' }
          ];
          setAthletes(fallbackAthletes);
          setSelectedAthlete(fallbackAthletes[0]);
          setTargetAthleteId(fallbackAthletes[0].id);
        }

        // 2. Fetch Master Exercise Catalog with bulletproof structural fallbacks
        const { data: exercisesData, error: exErr } = await supabase
          .from('exercises')
          .select('*');

        if (!exErr && exercisesData && exercisesData.length > 0) {
          const normalizedData = exercisesData.map(ex => ({
            ...ex,
            block_type: ex.block_type ? ex.block_type.trim() : 'Activation'
          }));
          setExerciseLibrary(normalizedData);
        } else {
          console.warn("Exercises table unreadable or empty. Applying secure frontend playbook catalog.");
          setExerciseLibrary([
            // ACTIVATION LAYER
            { id: 'f1', name: 'Banded Pull Aparts', block_type: 'Activation', modality: 'Banded', tracking_unit: 'reps' },
            { id: 'f2', name: 'External Shoulder Rotation', block_type: 'Activation', modality: 'Banded', tracking_unit: 'reps' },
            { id: 'f3', name: 'Glute Bridges', block_type: 'Activation', modality: 'Bodyweight', tracking_unit: 'reps' },
            { id: 'f4', name: 'Spanish Squat Isometric Hold', block_type: 'Activation', modality: 'Banded', tracking_unit: 'seconds' },
            
            // MOVEMENT LAYER
            { id: 'f5', name: 'High Knees Drill', block_type: 'Movement', modality: 'Bodyweight', tracking_unit: 'distance' },
            { id: 'f6', name: 'Frankensteins Drill', block_type: 'Movement', modality: 'Bodyweight', tracking_unit: 'distance' },
            { id: 'f7', name: 'A-Skips (Cadence Mechanics)', block_type: 'Movement', modality: 'Bodyweight', tracking_unit: 'distance' },
            { id: 'f8', name: 'Worlds Greatest Stretch', block_type: 'Movement', modality: 'Bodyweight', tracking_unit: 'reps' },

            // ATHLETIC BLOCK LAYER (Plyos, Speed & Explosive Power)
            { id: 'f9', name: 'Pogo Jumps (Ankle Stiffness)', block_type: 'Athletic Block', modality: 'Bodyweight', tracking_unit: 'reps' },
            { id: 'f10', name: 'Countermovement Jump (CMJ)', block_type: 'Athletic Block', modality: 'Bodyweight', tracking_unit: 'inches' },
            { id: 'f11', name: 'Flying 10 Meter Sprint', block_type: 'Athletic Block', modality: 'Bodyweight', tracking_unit: 'seconds' },
            { id: 'f12', name: 'Falling Starts (Linear Accel)', block_type: 'Athletic Block', modality: 'Bodyweight', tracking_unit: 'distance' },
            { id: 'f13', name: '5-10-5 Pro Agility Shuttle', block_type: 'Athletic Block', modality: 'Bodyweight', tracking_unit: 'seconds' },

            // STRENGTH LAYER
            { id: 'f14', name: 'Barbell Back Squat', block_type: 'Strength', modality: 'Barbell', tracking_unit: 'lbs' },
            { id: 'f15', name: 'Barbell RDL', block_type: 'Strength', modality: 'Barbell', tracking_unit: 'lbs' },
            { id: 'f16', name: 'Clean (All Variants)', block_type: 'Strength', modality: 'Barbell', tracking_unit: 'lbs' },
            { id: 'f17', name: 'Dumbbell Bulgarian Split Squat', block_type: 'Strength', modality: 'Dumbbell', tracking_unit: 'lbs' },
            { id: 'f18', name: 'MB Overhead Backwards Toss', block_type: 'Strength', modality: 'Medicine Ball', tracking_unit: 'distance' },
            { id: 'f19', name: 'MB Rotational Wall Slam', block_type: 'Strength', modality: 'Medicine Ball', tracking_unit: 'reps' }
          ]);
        }

        // 3. Fetch Alternate/Modified Exercise Links (bidirectional)
        const { data: altData, error: altErr } = await supabase
          .from('exercise_alternates')
          .select('*');

        if (!altErr && altData) {
          const altMap = {};
          altData.forEach(row => {
            if (!altMap[row.exercise_id]) altMap[row.exercise_id] = [];
            if (!altMap[row.alternate_exercise_id]) altMap[row.alternate_exercise_id] = [];
            altMap[row.exercise_id].push(row.alternate_exercise_id);
            altMap[row.alternate_exercise_id].push(row.exercise_id);
          });
          setExerciseAlternatesMap(altMap);
        }

      } catch (err) {
        console.error("Dashboard engine failure:", err.message);
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

  // Load "Most Programmed" ranking for the Exercise Library stats bar
  useEffect(() => {
    if (!isAuthorized || activeTab !== 'library') return;

    async function loadTopProgrammed() {
      const { data, error } = await supabase.from('workout_items').select('exercise_name');
      if (!error && data && data.length > 0) {
        const counts = {};
        data.forEach(row => {
          if (!row.exercise_name) return;
          counts[row.exercise_name] = (counts[row.exercise_name] || 0) + 1;
        });
        const ranked = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }));
        setTopProgrammed(ranked);
      } else {
        setTopProgrammed([]);
      }
    }

    loadTopProgrammed();
  }, [activeTab, isAuthorized]);

  // Auto-dismiss library toast messages
  useEffect(() => {
    if (!libraryToast) return;
    const timer = setTimeout(() => setLibraryToast(''), 3500);
    return () => clearTimeout(timer);
  }, [libraryToast]);

  // Load saved Program Templates + their items
  useEffect(() => {
    if (!isAuthorized || activeTab !== 'templates') return;

    async function loadTemplates() {
      try {
        setTemplatesLoading(true);
        const { data: templateRows, error: templateErr } = await supabase
          .from('workout_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (templateErr) throw templateErr;

        const { data: itemRows, error: itemErr } = await supabase
          .from('template_items')
          .select('*')
          .order('order_index', { ascending: true });

        if (itemErr) throw itemErr;

        const grouped = {};
        (itemRows || []).forEach(item => {
          if (!grouped[item.template_id]) grouped[item.template_id] = [];
          grouped[item.template_id].push(item);
        });

        setTemplates(templateRows || []);
        setTemplateItemsMap(grouped);
      } catch (err) {
        console.error("Failed loading program templates:", err.message);
        setTemplateStatus(`❌ ${err.message}`);
      } finally {
        setTemplatesLoading(false);
      }
    }

    loadTemplates();
  }, [activeTab, isAuthorized]);

  // Auto-dismiss template status messages
  useEffect(() => {
    if (!templateStatus) return;
    const timer = setTimeout(() => setTemplateStatus(''), 4000);
    return () => clearTimeout(timer);
  }, [templateStatus]);

  // Open the Add/Edit Movement modal
  const openAddExerciseModal = () => {
    setEditingExercise(null);
    setExerciseForm({ name: '', block_type: 'Activation', modality: 'Bodyweight', tracking_unit: 'reps', video_url: '' });
    setExerciseFormAlternates([]);
    setAlternatePickerValue('');
    setShowExerciseModal(true);
  };

  const openEditExerciseModal = (ex) => {
    setEditingExercise(ex);
    setExerciseForm({
      name: ex.name || '',
      block_type: ex.block_type || 'Activation',
      modality: ex.modality || 'Bodyweight',
      tracking_unit: ex.tracking_unit || 'reps',
      video_url: ex.video_url || ''
    });
    setExerciseFormAlternates(exerciseAlternatesMap[ex.id] || []);
    setAlternatePickerValue('');
    setShowExerciseModal(true);
  };

  const addAlternateToForm = (idStr) => {
    const id = parseInt(idStr, 10);
    if (!id || exerciseFormAlternates.includes(id)) return;
    if (editingExercise && id === editingExercise.id) return;
    setExerciseFormAlternates(prev => [...prev, id]);
    setAlternatePickerValue('');
  };

  const removeAlternateFromForm = (id) => {
    setExerciseFormAlternates(prev => prev.filter(x => x !== id));
  };

  // Replace every alternate link involving this exercise with the current selection
  const syncExerciseAlternates = async (exerciseId, alternateIds) => {
    await supabase.from('exercise_alternates').delete().eq('exercise_id', exerciseId);
    await supabase.from('exercise_alternates').delete().eq('alternate_exercise_id', exerciseId);

    if (alternateIds.length > 0) {
      const rows = alternateIds.map(altId => ({ exercise_id: exerciseId, alternate_exercise_id: altId }));
      const { error } = await supabase.from('exercise_alternates').insert(rows);
      if (error) throw error;
    }

    setExerciseAlternatesMap(prev => {
      const next = { ...prev };
      // Strip this exercise out of every other exercise's list, then rebuild both directions
      Object.keys(next).forEach(key => {
        next[key] = next[key].filter(id => id !== exerciseId);
      });
      next[exerciseId] = alternateIds;
      alternateIds.forEach(altId => {
        next[altId] = next[altId] ? [...new Set([...next[altId], exerciseId])] : [exerciseId];
      });
      return next;
    });
  };

  // Create or update a movement in the Supabase exercises table
  const handleSaveExercise = async (e) => {
    e.preventDefault();
    if (!exerciseForm.name.trim()) return;

    const payload = {
      name: exerciseForm.name.trim(),
      block_type: exerciseForm.block_type,
      modality: exerciseForm.modality,
      tracking_unit: exerciseForm.tracking_unit,
      video_url: exerciseForm.video_url.trim() || null
    };

    try {
      let savedExercise;
      if (editingExercise) {
        const { data, error } = await supabase
          .from('exercises')
          .update(payload)
          .eq('id', editingExercise.id)
          .select()
          .single();
        if (error) throw error;
        savedExercise = data;
        setExerciseLibrary(prev => prev.map(ex => (ex.id === editingExercise.id ? data : ex)));
        setLibraryToast(`✅ Updated "${data.name}"`);
      } else {
        const { data, error } = await supabase
          .from('exercises')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        savedExercise = data;
        setExerciseLibrary(prev => [...prev, data]);
        setLibraryToast(`✅ Added "${data.name}" to the library`);
      }

      await syncExerciseAlternates(savedExercise.id, exerciseFormAlternates);

      setShowExerciseModal(false);
      setEditingExercise(null);
    } catch (err) {
      setLibraryToast(`❌ ${err.message}`);
    }
  };

  const handleDeleteExercise = async (ex) => {
    if (!window.confirm(`Delete "${ex.name}" from the library? This can't be undone.`)) return;
    try {
      const { error } = await supabase.from('exercises').delete().eq('id', ex.id);
      if (error) throw error;
      setExerciseLibrary(prev => prev.filter(item => item.id !== ex.id));
      setExerciseAlternatesMap(prev => {
        const next = { ...prev };
        delete next[ex.id];
        Object.keys(next).forEach(key => {
          next[key] = next[key].filter(id => id !== ex.id);
        });
        return next;
      });
      setLibraryToast(`🗑️ Removed "${ex.name}"`);
    } catch (err) {
      setLibraryToast(`❌ ${err.message}`);
    }
  };

  // Convert common YouTube link formats into an embeddable URL
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

  // Add Exercise to Current Workout Prescription. Pass sectionOverride to place it
  // into a specific section the coach picked, instead of the exercise's native block_type.
  const addExerciseToWorkout = (exercise, sectionOverride) => {
    const targetUnit = exercise.tracking_unit || 'reps';
    const newEntry = {
      uniqueId: Date.now() + Math.random(),
      exercise_id: exercise.id,
      name: exercise.name,
      block_type: sectionOverride || exercise.block_type || selectedBlockType,
      modality: exercise.modality || 'Bodyweight',
      tracking_unit: targetUnit,
      sets: 3,
      rest_timer: '60s',
      reps: targetUnit === 'inches' ? '' : 10,
      load_value: targetUnit === 'lbs' ? 135 : '',
      seconds_value: targetUnit === 'seconds' ? 30 : '',
      distance_value: targetUnit === 'distance' ? '20yds' : ''
    };
    setCurrentPrescription([...currentPrescription, newEntry]);
  };

  // Rename every item currently tagged with oldName to newName, and rename the
  // section itself in the picker so the deck's sections stay in sync
  const handleRenameRxSection = (oldName, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed || trimmed === oldName) return;
    setCurrentPrescription(prev => prev.map(item => item.block_type === oldName ? { ...item, block_type: trimmed } : item));
    setRxManualSections(prev => prev.map(s => (s === oldName ? trimmed : s)));
    if (rxTargetSection === oldName) setRxTargetSection(trimmed);
  };

  // Handles the per-item "Section" dropdown, including the "+ New Section" option
  const handleChangeItemSection = (uniqueId, newValue) => {
    if (newValue === '__new__') {
      const name = window.prompt('New section name:');
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      setRxManualSections(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      updatePrescriptionField(uniqueId, 'block_type', trimmed);
    } else {
      updatePrescriptionField(uniqueId, 'block_type', newValue);
    }
  };

  // Handles the "Add to Section" target dropdown above the curriculum picker
  const handlePickRxTargetSection = (value) => {
    if (value === '__new__') {
      const name = window.prompt('New section name:');
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      setRxManualSections(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setRxTargetSection(trimmed);
    } else {
      setRxTargetSection(value);
    }
  };

  // Open the History & Bests drawer for one exercise, scoped to the currently targeted athlete
  const openHistoryDrawer = async (exerciseName) => {
    setHistoryExerciseName(exerciseName);
    setShowHistoryDrawer(true);
    setHistoryError('');

    if (!targetAthleteId) {
      setHistoryLogs([]);
      return;
    }

    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('athlete_id', targetAthleteId)
        .eq('exercise_name', exerciseName)
        .order('logged_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistoryLogs(data || []);
    } catch (err) {
      console.error("Failed loading exercise history:", err.message);
      setHistoryError(err.message);
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Quick-add straight from the Exercise Library tab without switching to Workouts
  const handleQuickAddToProgram = (ex) => {
    addExerciseToWorkout(ex);
    const athleteName = athletes.find(a => a.id === targetAthleteId)?.name || 'the';
    setLibraryToast(`➕ Added "${ex.name}" to ${athleteName}'s draft — finish it in the Workouts tab.`);
  };

  const updatePrescriptionField = (uniqueId, field, val) => {
    setCurrentPrescription(currentPrescription.map(item => 
      item.uniqueId === uniqueId ? { ...item, [field]: val } : item
    ));
  };

  const removeExerciseFromWorkout = (uniqueId) => {
    setCurrentPrescription(currentPrescription.filter(item => item.uniqueId !== uniqueId));
  };

  // Compute the list of scheduled dates a push should land on, based on the repeat setting
  const computeScheduledDates = (startDateStr, mode, count) => {
    const dates = [];
    const safeCount = mode === 'none' ? 1 : Math.min(Math.max(parseInt(count, 10) || 1, 1), 104);
    for (let i = 0; i < safeCount; i++) {
      const d = new Date(`${startDateStr}T00:00:00`);
      if (mode === 'daily') d.setDate(d.getDate() + i);
      else if (mode === 'weekly') d.setDate(d.getDate() + i * 7);
      else if (mode === 'monthly') d.setMonth(d.getMonth() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };

  // Commit Workout Prescription Live to Relational Supabase Tables — one row per
  // scheduled date, so a coach can build out a week/month/quarter/year in one push
  const handleSaveWorkout = async () => {
    if (!targetAthleteId || currentPrescription.length === 0) {
      setSaveStatus('⚠️ Please select an athlete and add exercises.');
      return;
    }

    const scheduledDates = computeScheduledDates(workoutScheduledDate, repeatMode, repeatCount);

    try {
      setSaveStatus(`Publishing ${scheduledDates.length > 1 ? `${scheduledDates.length} sessions` : 'routine'} to cloud database...`);

      for (const dateStr of scheduledDates) {
        const { data: workoutData, error: workoutErr } = await supabase
          .from('workouts')
          .insert([{
            athlete_id: targetAthleteId,
            title: workoutName,
            scheduled_date: dateStr
          }])
          .select()
          .single();

        if (workoutErr) throw workoutErr;

        const newWorkoutId = workoutData.id;

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

        const { error: itemsErr } = await supabase
          .from('workout_items')
          .insert(itemsToInsert);

        if (itemsErr) throw itemsErr;
      }

      setSaveStatus(scheduledDates.length > 1
        ? `✅ Pushed ${scheduledDates.length} sessions (${scheduledDates[0]} → ${scheduledDates[scheduledDates.length - 1]}) to the Athlete Portal!`
        : '✅ Workout successfully pushed to Athlete Portal!');
      setCurrentPrescription([]);
      setRepeatMode('none');
      setRepeatCount(1);

    } catch (err) {
      console.error("Relational schema write failure:", err.message);
      setSaveStatus(`❌ Error saving program: ${err.message}`);
    }
  };

  // Persist whatever is currently in the Rx Prescription Deck as a reusable template
  const handleConfirmSaveAsTemplate = async (e) => {
    e.preventDefault();
    if (!saveAsTemplateName.trim() || currentPrescription.length === 0) return;

    try {
      const { data: templateData, error: templateErr } = await supabase
        .from('workout_templates')
        .insert([{ name: saveAsTemplateName.trim() }])
        .select()
        .single();

      if (templateErr) throw templateErr;

      const itemsToInsert = currentPrescription.map((item, idx) => ({
        template_id: templateData.id,
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

      const { data: insertedItems, error: itemsErr } = await supabase
        .from('template_items')
        .insert(itemsToInsert)
        .select();

      if (itemsErr) throw itemsErr;

      setTemplates(prev => [templateData, ...prev]);
      setTemplateItemsMap(prev => ({ ...prev, [templateData.id]: insertedItems || [] }));
      setSaveStatus(`✅ Saved as template "${templateData.name}"`);
      setShowSaveAsTemplateModal(false);
      setSaveAsTemplateName('');
    } catch (err) {
      setSaveStatus(`❌ Error saving template: ${err.message}`);
    }
  };

  // Template Builder: add/edit/remove rows in the draft template (mirrors the workout builder)
  const addExerciseToTemplateBuilder = (exercise, sectionOverride) => {
    const targetUnit = exercise.tracking_unit || 'reps';
    const newEntry = {
      uniqueId: Date.now() + Math.random(),
      exercise_id: exercise.id,
      name: exercise.name,
      block_type: sectionOverride || exercise.block_type || templateBlockType,
      modality: exercise.modality || 'Bodyweight',
      tracking_unit: targetUnit,
      sets: 3,
      rest_timer: '60s',
      reps: targetUnit === 'inches' ? '' : 10,
      load_value: targetUnit === 'lbs' ? 135 : '',
      seconds_value: targetUnit === 'seconds' ? 30 : '',
      distance_value: targetUnit === 'distance' ? '20yds' : ''
    };
    setTemplateBuilderItems(prev => [...prev, newEntry]);
  };

  // Rename every template item currently tagged with oldName to newName
  const handleRenameTemplateSection = (oldName, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed || trimmed === oldName) return;
    setTemplateBuilderItems(prev => prev.map(item => item.block_type === oldName ? { ...item, block_type: trimmed } : item));
    setTemplateManualSections(prev => prev.map(s => (s === oldName ? trimmed : s)));
    if (templateTargetSection === oldName) setTemplateTargetSection(trimmed);
  };

  // Handles the per-item "Section" dropdown in the template canvas, including "+ New Section"
  const handleChangeTemplateItemSection = (uniqueId, newValue) => {
    if (newValue === '__new__') {
      const name = window.prompt('New section name:');
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      setTemplateManualSections(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      updateTemplateBuilderField(uniqueId, 'block_type', trimmed);
    } else {
      updateTemplateBuilderField(uniqueId, 'block_type', newValue);
    }
  };

  // Handles the "Add to Section" target dropdown above the template curriculum picker
  const handlePickTemplateTargetSection = (value) => {
    if (value === '__new__') {
      const name = window.prompt('New section name:');
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      setTemplateManualSections(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setTemplateTargetSection(trimmed);
    } else {
      setTemplateTargetSection(value);
    }
  };

  const updateTemplateBuilderField = (uniqueId, field, val) => {
    setTemplateBuilderItems(prev => prev.map(item =>
      item.uniqueId === uniqueId ? { ...item, [field]: val } : item
    ));
  };

  const removeExerciseFromTemplateBuilder = (uniqueId) => {
    setTemplateBuilderItems(prev => prev.filter(item => item.uniqueId !== uniqueId));
  };

  // Commit the draft template (no athlete attached) to Supabase
  const handleSaveNewTemplate = async () => {
    if (!templateBuilderName.trim() || templateBuilderItems.length === 0) {
      setTemplateStatus('⚠️ Please name the template and add at least one exercise.');
      return;
    }

    try {
      setTemplateStatus('Publishing template to cloud database...');

      const { data: templateData, error: templateErr } = await supabase
        .from('workout_templates')
        .insert([{ name: templateBuilderName.trim() }])
        .select()
        .single();

      if (templateErr) throw templateErr;

      const itemsToInsert = templateBuilderItems.map((item, idx) => ({
        template_id: templateData.id,
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

      const { data: insertedItems, error: itemsErr } = await supabase
        .from('template_items')
        .insert(itemsToInsert)
        .select();

      if (itemsErr) throw itemsErr;

      setTemplates(prev => [templateData, ...prev]);
      setTemplateItemsMap(prev => ({ ...prev, [templateData.id]: insertedItems || [] }));
      setTemplateStatus(`✅ Template "${templateData.name}" saved!`);
      setTemplateBuilderItems([]);
      setTemplateBuilderName('');
    } catch (err) {
      console.error("Template write failure:", err.message);
      setTemplateStatus(`❌ Error saving template: ${err.message}`);
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Delete the "${template.name}" template? This can't be undone.`)) return;
    try {
      const { error } = await supabase.from('workout_templates').delete().eq('id', template.id);
      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      setTemplateItemsMap(prev => {
        const next = { ...prev };
        delete next[template.id];
        return next;
      });
      setTemplateStatus(`🗑️ Removed template "${template.name}"`);
    } catch (err) {
      setTemplateStatus(`❌ ${err.message}`);
    }
  };

  // Load a saved template's block sequence into the Workout Builder so a coach can
  // pick the athlete and personalize sets/reps/rest before pushing it live
  const handleLoadTemplateIntoBuilder = (template) => {
    const items = templateItemsMap[template.id] || [];
    const mapped = items.map(item => ({
      uniqueId: Date.now() + Math.random(),
      exercise_id: item.exercise_id || null,
      name: item.exercise_name,
      block_type: item.block_type,
      modality: item.modality || 'Bodyweight',
      tracking_unit: item.tracking_unit || 'reps',
      sets: item.sets || 3,
      rest_timer: item.rest_timer || '60s',
      reps: item.reps || '',
      load_value: item.load_value || '',
      seconds_value: item.seconds_value || '',
      distance_value: item.distance_value || ''
    }));
    setCurrentPrescription(mapped);
    setWorkoutName(template.name);
    setSaveStatus(`📋 Loaded "${template.name}" — pick the athlete and personalize sets/reps, then push.`);
    setActiveTab('workouts');
  };

  // Suggest an access code in the same IW-XX-0000 format used elsewhere in the app
  const generateAccessCode = (name) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.length > 0
      ? (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase()
      : 'XX';
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `IW-${initials}-${digits}`;
  };

  const openAddAthleteModal = () => {
    setNewAthleteForm({ name: '', email: '', access_code: '', weight_lbs: '', status: 'On Track' });
    setShowAddAthleteModal(true);
  };

  const handleAthleteNameChange = (name) => {
    setNewAthleteForm(prev => ({
      ...prev,
      name,
      access_code: prev.access_code && prev.access_code !== generateAccessCode(prev.name) ? prev.access_code : (name.trim() ? generateAccessCode(name) : '')
    }));
  };

  // Create a new athlete profile in the roster
  const handleSaveAthlete = async (e) => {
    e.preventDefault();
    if (!newAthleteForm.name.trim()) return;

    const payload = {
      name: newAthleteForm.name.trim(),
      email: newAthleteForm.email.trim() || null,
      access_code: newAthleteForm.access_code.trim() || generateAccessCode(newAthleteForm.name),
      weight_lbs: newAthleteForm.weight_lbs ? parseInt(newAthleteForm.weight_lbs, 10) : null,
      status: newAthleteForm.status,
      streak_percentage: 100
    };

    try {
      const { data, error } = await supabase
        .from('athletes')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      setAthletes(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedAthlete(data);
      setTargetAthleteId(data.id);
      setShowAddAthleteModal(false);
      setLibraryToast(`✅ Added "${data.name}" (code: ${data.access_code}) to the roster`);
    } catch (err) {
      setLibraryToast(`❌ ${err.message}`);
    }
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExercises = exerciseLibrary.filter(ex => ex.block_type === selectedBlockType);
  const filteredTemplateExercises = exerciseLibrary.filter(ex => ex.block_type === templateBlockType);

  // All section names currently available to place exercises into: the 4 defaults,
  // any custom sections created but still empty, and any already in use by items
  const rxSectionOptions = Array.from(new Set([
    ...DEFAULT_SECTIONS,
    ...rxManualSections,
    ...currentPrescription.map(i => i.block_type)
  ]));
  const templateSectionOptions = Array.from(new Set([
    ...DEFAULT_SECTIONS,
    ...templateManualSections,
    ...templateBuilderItems.map(i => i.block_type)
  ]));

  const rxSections = groupItemsBySection(currentPrescription);
  const templateSections = groupItemsBySection(templateBuilderItems);
  const historySummary = summarizeHistory(historyLogs);
  const historyAthleteName = athletes.find(a => a.id === targetAthleteId)?.name || 'this athlete';

  // Look up alternate names for a deck/template item. Falls back to matching by name
  // when exercise_id isn't available (e.g. items loaded back in from a saved template,
  // since template_items only ever stored the exercise name, not its id).
  const getAlternateNamesForItem = (item) => {
    let exId = item.exercise_id;
    if (!exId) {
      const match = exerciseLibrary.find(e => e.name.toLowerCase() === (item.name || '').toLowerCase());
      exId = match?.id;
    }
    if (!exId) return [];
    return (exerciseAlternatesMap[exId] || []).map(id => exerciseLibrary.find(e => e.id === id)?.name).filter(Boolean);
  };

  // Exercise Library tab: search + block/modality filters, and stats bar figures
  const libraryBlockOptions = ['All', 'Activation', 'Movement', 'Athletic Block', 'Strength'];
  const libraryModalityOptions = ['All', ...Array.from(new Set(exerciseLibrary.map(ex => ex.modality).filter(Boolean))).sort()];

  const filteredLibraryExercises = exerciseLibrary.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(librarySearchQuery.toLowerCase());
    const matchesBlock = libraryBlockFilter === 'All' || ex.block_type === libraryBlockFilter;
    const matchesModality = libraryModalityFilter === 'All' || ex.modality === libraryModalityFilter;
    return matchesSearch && matchesBlock && matchesModality;
  });

  const missingMediaCount = exerciseLibrary.filter(ex => !ex.video_url).length;

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0d0f12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#ffffff', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <Lock size={28} style={{ color: '#dc2626' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '0.05em', margin: '0' }}>GUIDANCE CORE ENTRY</h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>System Administrator Core Lock</p>
          
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
        <div style={{ textAlign: 'center' }}>
          <Activity className="animate-spin" size={40} style={{ color: '#dc2626', margin: '0 auto 8px auto' }} />
          <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Syncing Performance Architecture Ecosystem...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d0f12', color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: sidebarExpanded ? '260px' : '76px', backgroundColor: '#12161a', borderRight: '1px solid #1f262e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: sidebarExpanded ? '24px' : '24px 14px', flexShrink: 0, boxSizing: 'border-box', transition: 'width 0.18s ease, padding 0.18s ease', overflow: 'hidden' }}>
        <div>
          <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'space-between' : 'center', gap: '8px' }}>
            {sidebarExpanded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ backgroundColor: '#12161a', borderRadius: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  <img src="/logo.png" alt="Iwamizu Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.05em', color: '#dc2626', margin: '0', whiteSpace: 'nowrap' }}>IWAMIZU</h1>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', margin: '0', whiteSpace: 'nowrap' }}>Athletic Performance</p>
                </div>
              </div>
            )}
            <button onClick={toggleSidebar} title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'} style={{ backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}>
              {sidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setActiveTab('athletes')} title="Athletes" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '12px', width: '100%', padding: sidebarExpanded ? '12px 16px' : '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'athletes' ? '#dc2626' : 'transparent', color: '#ffffff', textAlign: 'left' }}>
              <Users size={18} /> {sidebarExpanded && 'Athletes'}
            </button>
            <button onClick={() => setActiveTab('workouts')} title="Workouts" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '12px', width: '100%', padding: sidebarExpanded ? '12px 16px' : '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'workouts' ? '#dc2626' : 'transparent', color: '#ffffff', textAlign: 'left' }}>
              <Dumbbell size={18} /> {sidebarExpanded && 'Workouts'}
            </button>
            <button onClick={() => setActiveTab('library')} title="Exercise Library" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '12px', width: '100%', padding: sidebarExpanded ? '12px 16px' : '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'library' ? '#dc2626' : 'transparent', color: '#ffffff', textAlign: 'left' }}>
              <BookOpen size={18} /> {sidebarExpanded && 'Exercise Library'}
            </button>
            <button onClick={() => setActiveTab('templates')} title="Program Templates" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '12px', width: '100%', padding: sidebarExpanded ? '12px 16px' : '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'templates' ? '#dc2626' : 'transparent', color: '#ffffff', textAlign: 'left' }}>
              <ClipboardList size={18} /> {sidebarExpanded && 'Program Templates'}
            </button>
            <button title="Calendar" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '12px', width: '100%', padding: sidebarExpanded ? '12px 16px' : '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'transparent', color: '#9ca3af', textAlign: 'left' }}><Calendar size={18} /> {sidebarExpanded && 'Calendar'}</button>
            <button title="Messages" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '12px', width: '100%', padding: sidebarExpanded ? '12px 16px' : '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'transparent', color: '#9ca3af', textAlign: 'left' }}><MessageSquare size={18} /> {sidebarExpanded && 'Messages'}</button>
            <button title="System Settings" style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '12px', width: '100%', padding: sidebarExpanded ? '12px 16px' : '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'transparent', color: '#9ca3af', textAlign: 'left' }}><Settings size={18} /> {sidebarExpanded && 'System Settings'}</button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #1f262e' }}>
          <div title="Josiah Iwamizu - Head Coach" style={{ width: '40px', height: '40px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', lineHeight: '40px', fontSize: '14px', flexShrink: 0 }}>JI</div>
          {sidebarExpanded && (
            <div style={{ minWidth: 0 }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0', whiteSpace: 'nowrap' }}>Josiah Iwamizu</h4>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0', whiteSpace: 'nowrap' }}>Head Coach</p>
            </div>
          )}
        </div>
      </aside>

      {/* DASHBOARD INNER CONTENT */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {/* TAB 1: ATHLETES ROSTER INSPECTOR VIEW */}
        {activeTab === 'athletes' && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0' }}>Good afternoon, Coach.</h2>
              <p style={{ fontSize: '14px', color: '#4ade80', margin: '4px 0 0 0' }}>Spreadsheet Stream: <span style={{ color: '#4ade80', fontWeight: '600' }}>Online Live</span></p>
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
                  <button onClick={openAddAthleteModal} style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Add Athlete</button>
                </div>

                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }} />
                  <input type="text" placeholder="Search roster rows..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '8px', padding: '8px 12px 8px 36px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', backgroundColor: '#1c232b', padding: '12px 16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>
                    <div>Name</div>
                    <div style={{ textAlignment: 'center' }}>Streak</div>
                    <div style={{ textAlignment: 'center' }}>Status</div>
                  </div>
                  <div style={{ color: '#ffffff' }}>
                    {filteredAthletes.length > 0 ? (
                      filteredAthletes.map((athlete) => (
                        <div key={athlete.id} onClick={() => setSelectedAthlete(athlete)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid #1f262e', cursor: 'pointer', backgroundColor: selectedAthlete?.id === athlete.id ? '#1c232b' : 'transparent' }}>
                          <div style={{ fontWeight: 'bold' }}>{athlete.name}</div>
                          <div style={{ textAlignment: 'center', color: '#4ade80', fontWeight: 'bold' }}>{athlete.streak_percentage || 92}%</div>
                          <div style={{ textAlignment: 'center' }}>
                            <span style={{ backgroundColor: athlete.status === 'Flagged' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)', color: athlete.status === 'Flagged' ? '#f87171' : '#4ade80', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                              {athlete.status || 'On Track'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlignment: 'center', color: '#9ca3af' }}>No matching athletes found.</div>
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
                  <div style={{ textAlignment: 'center', color: '#9ca3af', padding: '24px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px' }}>Select an athlete to view metrics.</div>
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
            <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: repeatMode === 'none' ? '1fr 1fr' : '1fr 1fr 1fr', gap: '20px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>3. Scheduled Date</label>
                  <input type="date" value={workoutScheduledDate} onChange={(e) => setWorkoutScheduledDate(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px', borderRadius: '8px', color: '#ffffff', outline: 'none', fontSize: '14px', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>4. Build Out</label>
                  <select value={repeatMode} onChange={(e) => setRepeatMode(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px', borderRadius: '8px', color: '#ffffff', outline: 'none', fontSize: '14px', cursor: 'pointer' }}>
                    <option value="none">Just this one day</option>
                    <option value="daily">Repeat Daily</option>
                    <option value="weekly">Repeat Weekly</option>
                    <option value="monthly">Repeat Monthly</option>
                  </select>
                </div>
                {repeatMode !== 'none' && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Occurrences</label>
                    <input type="number" min="1" max="104" value={repeatCount} onChange={(e) => setRepeatCount(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px', borderRadius: '8px', color: '#ffffff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>

              {repeatMode !== 'none' && (() => {
                const previewDates = computeScheduledDates(workoutScheduledDate, repeatMode, repeatCount);
                return (
                  <p style={{ fontSize: '12px', color: '#60a5fa', margin: '12px 0 0 0' }}>
                    Will create {previewDates.length} session{previewDates.length === 1 ? '' : 's'}: {previewDates[0]} → {previewDates[previewDates.length - 1]}
                  </p>
                );
              })()}
            </div>

            {/* TWO COLUMN INTERACTIVE PALETTE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
              
              {/* LEFT COLUMN: THE MASTER CURRICULUM SELECTOR */}
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>Database Curriculum</h4>

                {/* SYSTEM FLOW BLOCK BUTTON TABS */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', backgroundColor: '#1c232b', padding: '4px', borderRadius: '6px', overflowX: 'auto' }}>
                  {['Activation', 'Movement', 'Athletic Block', 'Strength'].map(b => (
                    <button key={b} onClick={() => { setSelectedBlockType(b); setRxTargetSection(b); }} style={{ flex: '1 0 auto', padding: '8px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: selectedBlockType === b ? '#dc2626' : 'transparent', color: '#ffffff', whiteSpace: 'nowrap' }}>
                      {b}
                    </button>
                  ))}
                </div>

                {/* TARGET SECTION: WHERE CLICKED EXERCISES LAND IN THE DECK */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Add To Section</label>
                  <select value={rxTargetSection} onChange={(e) => handlePickRxTargetSection(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '8px 10px', borderRadius: '6px', color: '#ffffff', outline: 'none', fontSize: '13px', cursor: 'pointer' }}>
                    {rxSectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="__new__">+ New Section...</option>
                  </select>
                </div>

                {/* SCROLLABLE LIST OF EXERCISES */}
                <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map(ex => (
                      <button key={ex.id} onClick={() => addExerciseToWorkout(ex, rxTargetSection)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px 14px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s' }}>
                        <span>{ex.name}</span>
                        <span style={{ fontSize: '10px', opacity: 0.5, backgroundColor: '#0d0f12', padding: '2px 6px', borderRadius: '4px' }}>{ex.modality}</span>
                      </button>
                    ))
                  ) : (
                    <p style={{ fontSize: '12px', color: '#9ca3af', textAlignment: 'center', margin: '20px 0' }}>No exercises found for this block sequence selection.</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: DYNAMIC WORKOUT CANVAS SHEET */}
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>Active Rx Prescription Deck</h3>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>{currentPrescription.length} Rows Slotted</span>
                </div>

                {/* RENDER DYNAMIC SECTIONS OF PROGRAMMED EXERCISES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                  {rxSections.length > 0 ? (
                    rxSections.map((section) => (
                      <div key={section.name}>
                        <input
                          key={`rx-section-${section.name}`}
                          defaultValue={section.name}
                          onBlur={(e) => handleRenameRxSection(section.name, e.target.value)}
                          style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', background: 'transparent', border: 'none', borderBottom: '1px dashed #1f262e', padding: '0 0 6px 0', marginBottom: '10px', width: '100%', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {section.items.map((item) => (
                            <div key={item.uniqueId} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.6fr 1fr 1fr auto', gap: '12px', alignItems: 'center', backgroundColor: '#1c232b', padding: '14px', borderRadius: '10px', border: '1px solid #1f262e' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{item.name}</p>
                                  <button onClick={() => openHistoryDrawer(item.name)} title="History & Bests" style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                                    <TrendingUp size={13} />
                                  </button>
                                </div>
                                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>{item.modality}</span>
                                {getAlternateNamesForItem(item).length > 0 && (
                                  <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#60a5fa' }}>
                                    Alt: {getAlternateNamesForItem(item).join(', ')}
                                  </p>
                                )}
                              </div>

                              {/* COLUMN: SECTION PICKER */}
                              <div>
                                <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Section</label>
                                <select value={item.block_type} onChange={(e) => handleChangeItemSection(item.uniqueId, e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
                                  {rxSectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                  <option value="__new__">+ New Section...</option>
                                </select>
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
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" placeholder="Reps" value={item.reps} onChange={(e) => updatePrescriptionField(item.uniqueId, 'reps', e.target.value)} style={{ width: '40%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                    <input type="text" placeholder="Weight" value={item.load_value} onChange={(e) => updatePrescriptionField(item.uniqueId, 'load_value', e.target.value)} style={{ width: '60%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                  </div>
                                )}
                                {item.tracking_unit === 'seconds' && (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" placeholder="Reps" value={item.reps} onChange={(e) => updatePrescriptionField(item.uniqueId, 'reps', e.target.value)} style={{ width: '40%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                    <input type="text" placeholder="Time (s)" value={item.seconds_value} onChange={(e) => updatePrescriptionField(item.uniqueId, 'seconds_value', e.target.value)} style={{ width: '60%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                  </div>
                                )}
                                {item.tracking_unit === 'distance' && (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" placeholder="Reps" value={item.reps} onChange={(e) => updatePrescriptionField(item.uniqueId, 'reps', e.target.value)} style={{ width: '40%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                    <input type="text" placeholder="Distance" value={item.distance_value} onChange={(e) => updatePrescriptionField(item.uniqueId, 'distance_value', e.target.value)} style={{ width: '60%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                  </div>
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
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ border: '2px dashed #1f262e', borderRadius: '10px', padding: '40px', textAlignment: 'center', color: '#9ca3af' }}>
                      <Dumbbell size={28} style={{ color: '#1f262e', margin: '0 auto 12px auto' }} />
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>The training card is currently blank.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Pick a section on the left, then click exercises from the library to add rows.</p>
                    </div>
                  )}
                </div>

                {/* SUBMIT DECK PUSH BUTTON ACTION */}
                {currentPrescription.length > 0 && (
                  <div style={{ borderTop: '1px solid #1f262e', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <button onClick={() => setCurrentPrescription([])} style={{ background: 'transparent', border: '1px solid #1f262e', color: '#9ca3af', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Clear Deck</button>
                    <button onClick={() => { setSaveAsTemplateName(workoutName); setShowSaveAsTemplateModal(true); }} style={{ background: 'transparent', border: '1px solid #1f262e', color: '#60a5fa', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ClipboardList size={14} /> Save as Template
                    </button>
                    <button onClick={handleSaveWorkout} style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
                      <CheckCircle size={16} /> Push Routine to Athlete
                    </button>
                  </div>
                )}

                {saveStatus && (
                  <p style={{ fontSize: '13px', color: '#fbbf24', textAlignment: 'right', margin: '12px 0 0 0', fontWeight: '600' }}>
                    {saveStatus}
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: EXERCISE LIBRARY */}
        {activeTab === 'library' && (
          <div style={{ boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0' }}>Exercise Library</h2>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>View, edit, search, and add new movements to your database curriculum.</p>
              </div>
              <button onClick={openAddExerciseModal} style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
                <Plus size={16} /> New Movement
              </button>
            </div>

            {/* LIBRARY STATS BAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0', letterSpacing: '0.05em' }}>Total Movements</p>
                <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '4px 0 0 0' }}>{exerciseLibrary.length} Loaded</h3>
              </div>
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 6px 0', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={12} /> Most Programmed</p>
                {topProgrammed.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {topProgrammed.map((t, idx) => (
                      <span key={t.name} style={{ fontSize: '13px', fontWeight: 'bold', color: idx === 0 ? '#fbbf24' : '#ffffff' }}>{idx + 1}. {t.name} <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>({t.count})</span></span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0' }}>No programmed history yet.</p>
                )}
              </div>
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', padding: '20px', borderRadius: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}><FileWarning size={12} /> Missing Media</p>
                <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '4px 0 0 0', color: missingMediaCount > 0 ? '#f87171' : '#4ade80' }}>{missingMediaCount} Clips Needed</h3>
              </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }} />
                <input type="text" placeholder="Search movements (e.g. split squat)..." value={librarySearchQuery} onChange={(e) => setLibrarySearchQuery(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '8px 12px 8px 36px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#1c232b', padding: '4px', borderRadius: '6px', flexWrap: 'wrap' }}>
                {libraryBlockOptions.map(b => (
                  <button key={b} onClick={() => setLibraryBlockFilter(b)} style={{ padding: '7px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: libraryBlockFilter === b ? '#dc2626' : 'transparent', color: '#ffffff', whiteSpace: 'nowrap' }}>
                    {b}
                  </button>
                ))}
              </div>

              <select value={libraryModalityFilter} onChange={(e) => setLibraryModalityFilter(e.target.value)} style={{ backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '9px 10px', borderRadius: '8px', color: '#ffffff', outline: 'none', fontSize: '13px', cursor: 'pointer' }}>
                {libraryModalityOptions.map(m => <option key={m} value={m}>{m === 'All' ? 'All Modalities' : m}</option>)}
              </select>
            </div>

            {/* EXERCISE CARD GRID */}
            {filteredLibraryExercises.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {filteredLibraryExercises.map(ex => (
                  <div key={ex.id} style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0' }}>{ex.name}</h4>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#dc2626' }}>{ex.block_type}</span>
                      </div>
                      {ex.video_url ? (
                        <button onClick={() => setPreviewVideoUrl(ex.video_url)} title="Preview coaching clip" style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                          <PlayCircle size={20} />
                        </button>
                      ) : (
                        <span title="No coaching clip attached" style={{ color: '#374151', flexShrink: 0 }}>
                          <PlayCircle size={20} />
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '3px 8px', borderRadius: '4px', color: '#d1d5db' }}>{ex.modality || 'Bodyweight'}</span>
                      <span style={{ fontSize: '10px', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '3px 8px', borderRadius: '4px', color: '#d1d5db' }}>Tracks: {ex.tracking_unit || 'reps'}</span>
                    </div>

                    {(exerciseAlternatesMap[ex.id] || []).length > 0 && (
                      <p style={{ margin: '0', fontSize: '11px', color: '#9ca3af' }}>
                        Alt: {(exerciseAlternatesMap[ex.id] || []).map(id => exerciseLibrary.find(e => e.id === id)?.name).filter(Boolean).join(', ')}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px solid #1f262e', paddingTop: '10px', marginTop: '2px' }}>
                      <button onClick={() => handleQuickAddToProgram(ex)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1c232b', border: '1px solid #1f262e', color: '#4ade80', fontWeight: 'bold', fontSize: '12px', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Plus size={13} /> Add to Program
                      </button>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => openEditExerciseModal(ex)} title="Edit movement" style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px' }}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteExercise(ex)} title="Delete movement" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ border: '2px dashed #1f262e', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <BookOpen size={28} style={{ color: '#1f262e', margin: '0 auto 12px auto' }} />
                <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>No movements match this search/filter.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROGRAM TEMPLATES */}
        {activeTab === 'templates' && (
          <div style={{ boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0' }}>Program Templates</h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>Build reusable block sequences like "Offseason Speed" or "Hypertrophy Phase 1", then load one into the Workout Builder and personalize it for any athlete.</p>
            </div>

            {/* TEMPLATE BUILDER: TWO COLUMN PALETTE (mirrors the Workouts tab builder) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start', marginBottom: '32px' }}>

              {/* LEFT COLUMN: CURRICULUM SELECTOR */}
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>Database Curriculum</h4>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', backgroundColor: '#1c232b', padding: '4px', borderRadius: '6px', overflowX: 'auto' }}>
                  {['Activation', 'Movement', 'Athletic Block', 'Strength'].map(b => (
                    <button key={b} onClick={() => { setTemplateBlockType(b); setTemplateTargetSection(b); }} style={{ flex: '1 0 auto', padding: '8px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: templateBlockType === b ? '#dc2626' : 'transparent', color: '#ffffff', whiteSpace: 'nowrap' }}>
                      {b}
                    </button>
                  ))}
                </div>

                {/* TARGET SECTION: WHERE CLICKED EXERCISES LAND IN THE TEMPLATE */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Add To Section</label>
                  <select value={templateTargetSection} onChange={(e) => handlePickTemplateTargetSection(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '8px 10px', borderRadius: '6px', color: '#ffffff', outline: 'none', fontSize: '13px', cursor: 'pointer' }}>
                    {templateSectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="__new__">+ New Section...</option>
                  </select>
                </div>

                <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                  {filteredTemplateExercises.length > 0 ? (
                    filteredTemplateExercises.map(ex => (
                      <button key={ex.id} onClick={() => addExerciseToTemplateBuilder(ex, templateTargetSection)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px 14px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{ex.name}</span>
                        <span style={{ fontSize: '10px', opacity: 0.5, backgroundColor: '#0d0f12', padding: '2px 6px', borderRadius: '4px' }}>{ex.modality}</span>
                      </button>
                    ))
                  ) : (
                    <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: '20px 0' }}>No exercises found for this block sequence selection.</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: TEMPLATE DRAFT CANVAS */}
              <div style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Template Name</label>
                  <input type="text" value={templateBuilderName} onChange={(e) => setTemplateBuilderName(e.target.value)} placeholder="e.g. Offseason Speed Day 1" style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '10px', borderRadius: '8px', color: '#ffffff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>Template Block Sequence</h3>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>{templateBuilderItems.length} Rows Slotted</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                  {templateSections.length > 0 ? (
                    templateSections.map((section) => (
                      <div key={section.name}>
                        <input
                          key={`tpl-section-${section.name}`}
                          defaultValue={section.name}
                          onBlur={(e) => handleRenameTemplateSection(section.name, e.target.value)}
                          style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', background: 'transparent', border: 'none', borderBottom: '1px dashed #1f262e', padding: '0 0 6px 0', marginBottom: '10px', width: '100%', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {section.items.map((item) => (
                            <div key={item.uniqueId} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.6fr 1fr 1fr auto', gap: '12px', alignItems: 'center', backgroundColor: '#1c232b', padding: '14px', borderRadius: '10px', border: '1px solid #1f262e' }}>
                              <div>
                                <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{item.name}</p>
                                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>{item.modality}</span>
                                {getAlternateNamesForItem(item).length > 0 && (
                                  <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#60a5fa' }}>
                                    Alt: {getAlternateNamesForItem(item).join(', ')}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Section</label>
                                <select value={item.block_type} onChange={(e) => handleChangeTemplateItemSection(item.uniqueId, e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
                                  {templateSectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                  <option value="__new__">+ New Section...</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Sets</label>
                                <input type="number" value={item.sets} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'sets', parseInt(e.target.value) || 0)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', textAlign: 'center' }} />
                              </div>

                              <div>
                                <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#dc2626', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                                  Prescription ({item.tracking_unit})
                                </label>
                                {item.tracking_unit === 'reps' && (
                                  <input type="number" placeholder="Reps" value={item.reps} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'reps', e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                )}
                                {item.tracking_unit === 'lbs' && (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" placeholder="Reps" value={item.reps} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'reps', e.target.value)} style={{ width: '40%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                    <input type="text" placeholder="Weight" value={item.load_value} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'load_value', e.target.value)} style={{ width: '60%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                  </div>
                                )}
                                {item.tracking_unit === 'seconds' && (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" placeholder="Reps" value={item.reps} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'reps', e.target.value)} style={{ width: '40%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                    <input type="text" placeholder="Time (s)" value={item.seconds_value} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'seconds_value', e.target.value)} style={{ width: '60%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                  </div>
                                )}
                                {item.tracking_unit === 'distance' && (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" placeholder="Reps" value={item.reps} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'reps', e.target.value)} style={{ width: '40%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                    <input type="text" placeholder="Distance" value={item.distance_value} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'distance_value', e.target.value)} style={{ width: '60%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                  </div>
                                )}
                                {item.tracking_unit === 'inches' && (
                                  <input type="text" placeholder="Inches" value={item.reps} onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'reps', e.target.value)} style={{ width: '100%', backgroundColor: '#0d0f12', border: '1px solid #1f262e', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                )}
                              </div>

                              <div>
                                <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                                  <Timer size={10} /> Rest
                                </label>
                                <select
                                  value={item.rest_timer}
                                  onChange={(e) => updateTemplateBuilderField(item.uniqueId, 'rest_timer', e.target.value)}
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

                              <button onClick={() => removeExerciseFromTemplateBuilder(item.uniqueId)} style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ border: '2px dashed #1f262e', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                      <ClipboardList size={28} style={{ color: '#1f262e', margin: '0 auto 12px auto' }} />
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>This template is currently blank.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Pick a section on the left, then click exercises from the curriculum to add rows.</p>
                    </div>
                  )}
                </div>

                {templateBuilderItems.length > 0 && (
                  <div style={{ borderTop: '1px solid #1f262e', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px' }}>
                    <button onClick={() => { setTemplateBuilderItems([]); setTemplateBuilderName(''); }} style={{ background: 'transparent', border: '1px solid #1f262e', color: '#9ca3af', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Clear Deck</button>
                    <button onClick={handleSaveNewTemplate} style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
                      <CheckCircle size={16} /> Save Template
                    </button>
                  </div>
                )}

                {templateStatus && (
                  <p style={{ fontSize: '13px', color: '#fbbf24', textAlign: 'right', margin: '12px 0 0 0', fontWeight: '600' }}>
                    {templateStatus}
                  </p>
                )}
              </div>
            </div>

            {/* SAVED TEMPLATES LIST */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 16px 0' }}>Saved Templates</h3>
              {templatesLoading ? (
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Loading templates...</p>
              ) : templates.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {templates.map(template => {
                    const items = templateItemsMap[template.id] || [];
                    const blockCounts = {};
                    items.forEach(item => { blockCounts[item.block_type] = (blockCounts[item.block_type] || 0) + 1; });
                    return (
                      <div key={template.id} style={{ backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0' }}>{template.name}</h4>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{items.length} exercise{items.length === 1 ? '' : 's'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {Object.entries(blockCounts).map(([block, count]) => (
                            <span key={block} style={{ fontSize: '10px', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '3px 8px', borderRadius: '4px', color: '#d1d5db' }}>{block}: {count}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px solid #1f262e', paddingTop: '10px', marginTop: '2px' }}>
                          <button onClick={() => handleLoadTemplateIntoBuilder(template)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1c232b', border: '1px solid #1f262e', color: '#4ade80', fontWeight: 'bold', fontSize: '12px', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Dumbbell size={13} /> Load for Athlete
                          </button>
                          <button onClick={() => handleDeleteTemplate(template)} title="Delete template" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ border: '2px dashed #1f262e', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  <ClipboardList size={28} style={{ color: '#1f262e', margin: '0 auto 12px auto' }} />
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>No templates saved yet.</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Build one above, or push a workout in the Workouts tab and save it as a template.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* LIBRARY TOAST NOTIFICATION */}
      {libraryToast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#1c232b', border: '1px solid #1f262e', color: '#ffffff', padding: '14px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 200, maxWidth: '360px' }}>
          {libraryToast}
        </div>
      )}

      {/* ADD / EDIT MOVEMENT MODAL */}
      {showExerciseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0' }}>{editingExercise ? 'Edit Movement' : 'New Movement'}</h3>
              <button onClick={() => { setShowExerciseModal(false); setEditingExercise(null); }} style={{ backgroundColor: '#1c232b', border: 'none', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveExercise}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Exercise Name</label>
                <input type="text" required value={exerciseForm.name} onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })} placeholder="e.g. Bulgarian Split Squat" style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Block</label>
                  <select value={exerciseForm.block_type} onChange={(e) => setExerciseForm({ ...exerciseForm, block_type: e.target.value })} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px', fontSize: '14px', color: '#ffffff', outline: 'none', cursor: 'pointer' }}>
                    <option value="Activation">Activation</option>
                    <option value="Movement">Movement</option>
                    <option value="Athletic Block">Athletic Block</option>
                    <option value="Strength">Strength</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Tracking Unit</label>
                  <select value={exerciseForm.tracking_unit} onChange={(e) => setExerciseForm({ ...exerciseForm, tracking_unit: e.target.value })} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px', fontSize: '14px', color: '#ffffff', outline: 'none', cursor: 'pointer' }}>
                    <option value="reps">Reps</option>
                    <option value="lbs">Lbs</option>
                    <option value="seconds">Seconds</option>
                    <option value="distance">Distance</option>
                    <option value="inches">Inches</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Modality</label>
                <input type="text" value={exerciseForm.modality} onChange={(e) => setExerciseForm({ ...exerciseForm, modality: e.target.value })} placeholder="e.g. Barbell, Dumbbell, Bands, Bodyweight" style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Coaching Video Link (optional)</label>
                <input type="url" value={exerciseForm.video_url} onChange={(e) => setExerciseForm({ ...exerciseForm, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Alternate / Modified Exercises</label>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px 0' }}>Athletes will be able to swap to these in their workout view.</p>
                <select value={alternatePickerValue} onChange={(e) => addAlternateToForm(e.target.value)} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#ffffff', outline: 'none', cursor: 'pointer', marginBottom: '10px' }}>
                  <option value="">+ Add an alternate...</option>
                  {exerciseLibrary
                    .filter(ex => (!editingExercise || ex.id !== editingExercise.id) && !exerciseFormAlternates.includes(ex.id))
                    .map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
                {exerciseFormAlternates.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {exerciseFormAlternates.map(id => {
                      const altEx = exerciseLibrary.find(ex => ex.id === id);
                      return (
                        <span key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', backgroundColor: '#1c232b', border: '1px solid #1f262e', padding: '5px 6px 5px 10px', borderRadius: '999px', color: '#d1d5db' }}>
                          {altEx?.name || `#${id}`}
                          <button type="button" onClick={() => removeAlternateFromForm(id)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowExerciseModal(false); setEditingExercise(null); }} style={{ backgroundColor: 'transparent', border: '1px solid #1f262e', color: '#9ca3af', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>{editingExercise ? 'Save Changes' : 'Add Movement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ATHLETE MODAL */}
      {showAddAthleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0' }}>Add Athlete</h3>
              <button onClick={() => setShowAddAthleteModal(false)} style={{ backgroundColor: '#1c232b', border: 'none', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveAthlete}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Full Name</label>
                <input type="text" required value={newAthleteForm.name} onChange={(e) => handleAthleteNameChange(e.target.value)} placeholder="e.g. Katey Iwamizu" style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Email (optional)</label>
                <input type="email" value={newAthleteForm.email} onChange={(e) => setNewAthleteForm({ ...newAthleteForm, email: e.target.value })} placeholder="athlete@performance.com" style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Weight (lbs)</label>
                  <input type="number" value={newAthleteForm.weight_lbs} onChange={(e) => setNewAthleteForm({ ...newAthleteForm, weight_lbs: e.target.value })} placeholder="178" style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Status</label>
                  <select value={newAthleteForm.status} onChange={(e) => setNewAthleteForm({ ...newAthleteForm, status: e.target.value })} style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px', fontSize: '14px', color: '#ffffff', outline: 'none', cursor: 'pointer' }}>
                    <option value="On Track">On Track</option>
                    <option value="Flagged">Flagged</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Access Code</label>
                <input type="text" value={newAthleteForm.access_code} onChange={(e) => setNewAthleteForm({ ...newAthleteForm, access_code: e.target.value })} placeholder="Auto-generated from name" style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '6px 0 0 0' }}>This (or the athlete's full name) is what they'll use to log into the portal.</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddAthleteModal(false)} style={{ backgroundColor: 'transparent', border: '1px solid #1f262e', color: '#9ca3af', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Add Athlete</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAVE AS TEMPLATE MODAL */}
      {showSaveAsTemplateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#12161a', border: '1px solid #1f262e', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0' }}>Save as Template</h3>
              <button onClick={() => setShowSaveAsTemplateModal(false)} style={{ backgroundColor: '#1c232b', border: 'none', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 16px 0' }}>This saves the {currentPrescription.length} exercise{currentPrescription.length === 1 ? '' : 's'} currently in your Rx deck as a reusable template — no athlete attached.</p>
            <form onSubmit={handleConfirmSaveAsTemplate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Template Name</label>
                <input type="text" required value={saveAsTemplateName} onChange={(e) => setSaveAsTemplateName(e.target.value)} placeholder="e.g. Offseason Speed Day 1" style={{ width: '100%', backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowSaveAsTemplateModal(false)} style={{ backgroundColor: 'transparent', border: '1px solid #1f262e', color: '#9ca3af', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY & BESTS DRAWER */}
      {showHistoryDrawer && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }} onClick={() => setShowHistoryDrawer(false)}>
          <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#12161a', borderLeft: '1px solid #1f262e', padding: '24px', boxSizing: 'border-box', overflowY: 'auto', boxShadow: '-10px 0 25px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '900', margin: '0' }}>{historyExerciseName}</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>History & Bests for {historyAthleteName}</p>
              </div>
              <button onClick={() => setShowHistoryDrawer(false)} style={{ backgroundColor: '#1c232b', border: 'none', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>

            {historyLoading ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '24px' }}>Loading history...</p>
            ) : historyError ? (
              <p style={{ fontSize: '13px', color: '#f87171', marginTop: '24px' }}>❌ {historyError}</p>
            ) : !targetAthleteId ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '24px' }}>Assign a target athlete above to see their history for this movement.</p>
            ) : !historySummary ? (
              <div style={{ border: '2px dashed #1f262e', borderRadius: '10px', padding: '32px', textAlign: 'center', color: '#9ca3af', marginTop: '20px' }}>
                <TrendingUp size={24} style={{ color: '#1f262e', margin: '0 auto 10px auto' }} />
                <p style={{ margin: '0', fontSize: '13px', fontWeight: 'bold' }}>No logged history yet.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7 }}>This fills in once {historyAthleteName} completes a workout with this exercise checked off.</p>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '10px', padding: '16px', marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Personal Best</p>
                    <p style={{ fontSize: '24px', fontWeight: '900', margin: '0', color: '#fbbf24' }}>{historySummary.pbLabel || '—'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: historySummary.trend === 'up' ? '#4ade80' : historySummary.trend === 'down' ? '#f87171' : '#9ca3af' }}>
                    {historySummary.trend === 'up' && <TrendingUp size={16} />}
                    {historySummary.trend === 'down' && <TrendingDown size={16} />}
                    {historySummary.trend === 'flat' && <Minus size={16} />}
                    {historySummary.trend === 'up' ? 'Trending Up' : historySummary.trend === 'down' ? 'Trending Down' : 'Steady'}
                  </div>
                </div>

                <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', margin: '0 0 10px 0' }}>Recent Sessions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {historySummary.recent.map((log) => (
                    <div key={log.id} style={{ backgroundColor: '#1c232b', border: '1px solid #1f262e', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>{new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{log.sets_completed || 1} set{(log.sets_completed || 1) === 1 ? '' : 's'} completed</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff' }}>{log.target_value || '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewVideoUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' }} onClick={() => setPreviewVideoUrl(null)}>
          <div style={{ width: '100%', maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button onClick={() => setPreviewVideoUrl(null)} style={{ backgroundColor: '#1c232b', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1f262e' }}>
              <iframe
                src={toEmbedUrl(previewVideoUrl)}
                title="Coaching clip preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
            <a href={previewVideoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', color: '#60a5fa' }}>Open original link ↗</a>
          </div>
        </div>
      )}
    </div>
  );
}
