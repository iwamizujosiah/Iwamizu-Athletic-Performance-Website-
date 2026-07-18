"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase.js';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Settings, 
  Search, ShieldAlert, Award, Activity, TrendingDown, Plus 
} from 'lucide-react';

export default function CoachingDashboard() {
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

  // Load Everything From Supabase Database Tables On Component Mount
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // 1. Fetch all athletes from table
        const { data: athletesData, error: athleteErr } = await supabase
          .from('athletes')
          .select('*')
          .order('name', { ascending: true });

        if (athleteErr) throw athleteErr;

        if (athletesData) {
          setAthletes(athletesData);
          
          // Auto-select first athlete if available
          if (athletesData.length > 0) {
            setSelectedAthlete(athletesData[0]);
          }

          // 2. Calculate dynamic metrics based on live rows
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
        console.error("Error loading dashboard metrics:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Load trend analysis bars when a new client profile card is selected
  useEffect(() => {
    if (!selectedAthlete) return;

    async function loadAthleteTrends() {
      const { data: logs, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('athlete_id', selectedAthlete.id)
        .eq('exercise_name', 'Flying 10')
        .order('logged_at', { ascending: true })
        .limit(6);

      if (!error && logs) {
        // Map table records directly to trend components
        const mappedLogs = logs.map((log, idx) => ({
          label: `S${idx + 1}`,
          val: Math.max(30, Math.min(95, 100 - (log.metric_value * 50))), // Scale factor calculation
          time: `${log.metric_value}s`
        }));
        setTrendLogs(mappedLogs);
      }
    }

    loadAthleteTrends();
  }, [selectedAthlete]);

  // Filter roster items dynamically based on search queries
  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f12] flex items-center justify-center text-white">
        <div className="text-center space-y-2">
          <Activity className="animate-spin text-red-600 mx-auto" size={40} />
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Database Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d0f12] text-white font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#12161a] border-r border-[#1f262e] flex flex-col justify-between p-6 shrink-0">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-wider text-red-600">IWAMIZU</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Athletic Performance</p>
            <div className="mt-4 bg-[#1c232b] px-3 py-2 rounded border border-[#2b3541]">
              <p className="text-xs text-gray-450 uppercase font-bold">Coaching Dashboard</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button onClick={() => setActiveTab('athletes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition ${activeTab === 'athletes' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#1c232b] hover:text-white'}`}>
              <Users size={18} /> Athletes
            </button>
            <button onClick={() => setActiveTab('workouts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition ${activeTab === 'workouts' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#1c232b] hover:text-white'}`}>
              <Dumbbell size={18} /> Workouts
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:bg-[#1c232b] transition"><Calendar size={18} /> Calendar</button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:bg-[#1c232b] transition"><MessageSquare size={18} /> Messages</button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:bg-[#1c232b] transition"><Settings size={18} /> System Settings</button>
          </nav>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[#1f262e]">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold text-white border border-red-500 shadow-md">JI</div>
          <div>
            <h4 className="text-sm font-bold">Josiah Iwamizu</h4>
            <p className="text-xs text-gray-400">Head Coach</p>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 overflow-y-auto max-w-[1400px]">
        <div className="mb-8">
          <h2 className="text-2xl font-black">Good afternoon, Coach.</h2>
          <p className="text-sm text-gray-400">Database Connection: <span className="text-green-400 font-semibold">Active Vault Linked</span></p>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Discipline</p>
              <h3 className="text-3xl font-black mt-1 text-green-400">{stats.attendance}</h3>
            </div>
            <Activity className="text-green-400 opacity-80" size={28} />
          </div>
          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Athletes</p>
              <h3 className="text-3xl font-black mt-1">{stats.activeAthletes}</h3>
            </div>
            <Users className="text-gray-400 opacity-60" size={28} />
          </div>
          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Flagged</p>
              <h3 className="text-3xl font-black mt-1 text-red-500">{stats.flagged}</h3>
            </div>
            <ShieldAlert className="text-red-500 opacity-80" size={28} />
          </div>
          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">PRs This Week</p>
              <h3 className="text-3xl font-black mt-1 text-yellow-500">--</h3>
            </div>
            <Award className="text-yellow-500 opacity-80" size={28} />
          </div>
          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Sessions / Week</p>
              <h3 className="text-3xl font-black mt-1 text-blue-400">--</h3>
            </div>
            <Dumbbell className="text-blue-400 opacity-80" size={28} />
          </div>
        </div>

        {/* CONTROLS AND SPLIT ROSTER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black tracking-wide">Athlete Roster</h3>
              <button className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14} /> Add Athlete</button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" placeholder="Search roster rows..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#12161a] border border-[#1f262e] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="bg-[#12161a] border border-[#1f262e] rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 bg-[#1c232b] px-4 py-2.5 text-left text-xs font-bold uppercase text-gray-400 border-b border-[#1f262e]">
                <div>Name</div>
                <div className="text-center">Streak</div>
                <div className="text-center">Missed</div>
                <div className="text-center">Status</div>
              </div>
              <div className="divide-y divide-[#1f262e]">
                {filteredAthletes.length > 0 ? (
                  filteredAthletes.map((athlete) => (
                    <div key={athlete.id} onClick={() => setSelectedAthlete(athlete)} className={`grid grid-cols-4 px-4 py-4 items-center text-sm cursor-pointer transition ${selectedAthlete?.id === athlete.id ? 'bg-[#1c232b]' : 'hover:bg-[#151a20]'}`}>
                      <div className="font-bold">{athlete.name}</div>
                      <div className="text-center font-semibold text-green-400">{athlete.streak_percentage}%</div>
                      <div className="text-center text-gray-400">{athlete.missed_sessions}</div>
                      <div className="text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${athlete.status === 'Flagged' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {athlete.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">No roster records found in Supabase.</div>
                )}
              </div>
            </div>
          </div>

          {/* INSPECTOR PROFILE PANEL */}
          <div>
            {selectedAthlete ? (
              <div className="bg-[#12161a] border border-[#1f262e] rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#1c232b] rounded-xl flex items-center justify-center font-black text-lg border border-[#2b3541]">
                    {selectedAthlete.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black">{selectedAthlete.name}</h3>
                    <p className="text-xs text-gray-500">{selectedAthlete.email}</p>
                  </div>
                </div>

                <div className="bg-[#161b21] p-3 rounded-lg border border-[#1f262e]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Weight Vitals</p>
                  <p className="text-lg font-black mt-0.5">{selectedAthlete.weight_lbs ? `${selectedAthlete.weight_lbs} lbs` : '--'}</p>
                </div>

                {/* Dynamic Trend Chart */}
                {trendLogs.length > 0 && (
                  <div className="border-t border-[#1f262e] pt-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Flying 10 Trend Analysis</h4>
                    <div className="bg-[#161b21] border border-[#1f262e] rounded-lg p-3 h-28 flex items-end justify-between gap-2">
                      {trendLogs.map((pt, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[9px] text-blue-300 font-mono mb-1">{pt.time}</span>
                          <div style={{ height: `${pt.val}%` }} className="w-full rounded-t bg-blue-500"></div>
                          <span className="text-[9px] text-gray-500 font-bold mt-1">{pt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-[#1f262e] pt-4">
                  <h4 className="text-xs font-black uppercase text-gray-400 mb-1.5">Coach Internal Notes</h4>
                  <p className="text-xs text-gray-300 bg-[#161b21] p-3 rounded-lg border border-[#1f262e]">
                    {selectedAthlete.coach_notes || "No session logs recorded yet."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-12 bg-[#12161a] border border-[#1f262e] rounded-xl">
                No active athlete row selected.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
