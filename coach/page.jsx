"use client";

import React, { useState } from 'react';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Settings, 
  Search, ShieldAlert, Award, Activity, TrendingDown, Plus 
} from 'lucide-react';

export default function CoachingDashboard() {
  // Hardcoded mockup data matching your exact layout blueprint
  const [activeTab, setActiveTab] = useState('athletes');
  const [searchQuery, setSearchQuery] = useState('');
  
  const stats = {
    attendance: "87%",
    activeAthletes: 6,
    flagged: 2,
    prsThisWeek: 5,
    sessionsPerWeek: 24
  };

  const athletes = [
    { id: "IW-JD-8392", name: "John Doe", streak: "92%", missed: 0, fly10: "1.02s", vert: "33 in", status: "On Track" },
    { id: "IW-MS-2210", name: "Devon Carter", streak: "74%", missed: 2, fly10: "0.98s", vert: "35 in", status: "Flagged" },
    { id: "IW-DO-5561", name: "Tyler Reeves", streak: "100%", missed: 0, fly10: "1.21s", vert: "25 in", status: "On Track" },
    { id: "IW-AK-1187", name: "Marcus Vance", streak: "88%", missed: 1, fly10: "1.05s", vert: "31 in", status: "On Track" },
    { id: "IW-TR-3348", name: "Jaden Brooks", streak: "61%", missed: 3, fly10: "1.15s", vert: "28 in", status: "Flagged" },
    { id: "IW-PN-9903", name: "Nate Miller", streak: "95%", missed: 0, fly10: "1.01s", vert: "34 in", status: "On Track" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0d0f12] text-white font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#12161a] border-r border-[#1f262e] flex flex-col justify-between p-6 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-wider text-red-650">IWAMIZU</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Athletic Performance</p>
            <div className="mt-4 bg-[#1c232b] px-3 py-2 rounded border border-[#2b3541]">
              <p className="text-xs text-gray-450 uppercase font-bold">Coaching Dashboard</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('athletes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition ${activeTab === 'athletes' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#1c232b] hover:text-white'}`}
            >
              <Users size={18} /> Athletes
            </button>
            <button 
              onClick={() => setActiveTab('workouts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition ${activeTab === 'workouts' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#1c232b] hover:text-white'}`}
            >
              <Dumbbell size={18} /> Workouts
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:bg-[#1c232b] transition">
              <Calendar size={18} /> Calendar
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:bg-[#1c232b] transition">
              <MessageSquare size={18} /> Messages
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:bg-[#1c232b] transition">
              <Settings size={18} /> System Settings
            </button>
          </nav>
        </div>

        {/* Coach Profile Card Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#1f262e]">
          <div className="w-10 h-10 bg-red-650 rounded-full flex items-center justify-center font-bold text-white border border-red-500 shadow-md">
            JI
          </div>
          <div>
            <h4 className="text-sm font-bold">Josiah Iwamizu</h4>
            <p className="text-xs text-gray-400">Head Coach</p>
          </div>
        </div>
      </aside>

      {/* --- MAIN MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 overflow-y-auto max-w-[1400px]">
        {/* Welcome Greeting */}
        <div className="mb-8">
          <h2 className="text-2xl font-black">Good afternoon, Coach.</h2>
          <p className="text-sm text-gray-400">Tuesday, July 15. <span className="text-red-500 font-semibold">{stats.activeAthletes} athletes</span> training this week</p>
        </div>

        {/* --- PERFORMANCE METRIC METRICS CARDS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          
          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Discipline</p>
              <h3 className="text-3xl font-black mt-1 text-green-400">{stats.attendance}</h3>
              <p className="text-[11px] text-gray-400 mt-1">Avg. attendance rate</p>
            </div>
            <Activity className="text-green-400 opacity-80" size={28} />
          </div>

          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Athletes</p>
              <h3 className="text-3xl font-black mt-1">{stats.activeAthletes}</h3>
              <p className="text-[11px] text-green-400 font-medium mt-1">▲ 2 since last month</p>
            </div>
            <Users className="text-gray-400 opacity-60" size={28} />
          </div>

          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Flagged</p>
              <h3 className="text-3xl font-black mt-1 text-red-500">{stats.flagged}</h3>
              <p className="text-[11px] text-red-400 font-medium mt-1">▲ 1 needs check-in</p>
            </div>
            <ShieldAlert className="text-red-500 opacity-80" size={28} />
          </div>

          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">PRs This Week</p>
              <h3 className="text-3xl font-black mt-1 text-yellow-500">{stats.prsThisWeek}</h3>
              <p className="text-[11px] text-green-400 font-medium mt-1">▲ 3 vs. last week</p>
            </div>
            <Award className="text-yellow-500 opacity-80" size={28} />
          </div>

          <div className="bg-[#12161a] border border-[#1f262e] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Sessions / Week</p>
              <h3 className="text-3xl font-black mt-1 text-blue-400">{stats.sessionsPerWeek}</h3>
              <p className="text-[11px] text-gray-400 mt-1">Scheduled roster load</p>
            </div>
            <Dumbbell className="text-blue-400 opacity-80" size={28} />
          </div>
        </div>

        {/* --- TWO PANEL CORE CONTAINER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT PANEL: ROSTER INTERFACE */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-wide">Athlete Roster</h3>
                <span className="bg-[#1c232b] text-gray-400 px-2 py-0.5 rounded text-xs font-bold">{athletes.length} All</span>
              </div>
              <button className="bg-red-650 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition">
                <Plus size={14} /> Add Athlete
              </button>
            </div>

            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search athletes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#12161a] border border-[#1f262e] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500 transition"
              />
            </div>

            {/* Table Matrix Component */}
            <div className="bg-[#12161a] border border-[#1f262e] rounded-xl overflow-hidden shadow-inner">
              <div className="grid grid-cols-5 bg-[#1c232b] px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-[#1f262e]">
                <div>Athlete</div>
                <div className="text-center">Streak</div>
                <div className="text-center">Missed</div>
                <div className="text-center">Fly 10</div>
                <div className="text-center">Vert</div>
              </div>

              <div className="divide-y divide-[#1f262e]">
                {athletes.map((athlete) => (
                  <div key={athlete.id} className="grid grid-cols-5 px-4 py-4 items-center text-sm hover:bg-[#151a20] cursor-pointer transition">
                    <div>
                      <h4 className="font-bold text-white">{athlete.name}</h4>
                      <p className="text-xs text-gray-500">{athlete.id}</p>
                    </div>
                    <div className={`text-center font-bold ${parseInt(athlete.streak) < 75 ? 'text-red-400' : 'text-green-400'}`}>
                      {athlete.streak}
                    </div>
                    <div className={`text-center font-semibold ${athlete.missed > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {athlete.missed}
                    </div>
                    <div className="text-center font-mono font-medium text-blue-300">{athlete.fly10}</div>
                    <div className="text-center font-mono font-medium text-yellow-400">{athlete.vert}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: SELECTED PROFILE CARD INSPECTOR */}
          <div className="space-y-4">
            <h3 className="text-lg font-black tracking-wide">Athlete Profile</h3>
            
            <div className="bg-[#12161a] border border-[#1f262e] rounded-xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-green-500 opacity-5 blur-2xl rounded-full"></div>
              
              {/* Profile Main Badge Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#1c232b] rounded-xl flex items-center justify-center font-black text-lg border border-[#2b3541]">
                    JD
                  </div>
                  <div>
                    <h3 className="text-lg font-black">John Doe</h3>
                    <p className="text-xs text-gray-500 font-mono">IW-JD-8392</p>
                  </div>
                </div>
                <span className="bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-green-500/20">
                  • ON TRACK
                </span>
              </div>

              {/* Grid System Metrics Layout */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#161b21] p-3 rounded-lg border border-[#1f262e]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Volume (Sets)</p>
                  <p className="text-lg font-black mt-0.5">14</p>
                </div>
                <div className="bg-[#161b21] p-3 rounded-lg border border-[#1f262e]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Volume (Reps)</p>
                  <p className="text-lg font-black mt-0.5">68</p>
                </div>
                <div className="bg-[#161b21] p-3 rounded-lg border border-[#1f262e]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Load PBs</p>
                  <p className="text-lg font-black mt-0.5 text-yellow-500">3</p>
                </div>
                <div className="bg-[#161b21] p-3 rounded-lg border border-[#1f262e]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">5-10-5 Shuttle</p>
                  <p className="text-lg font-black mt-0.5 text-blue-300">4.3s</p>
                </div>
              </div>

              {/* Vitals Breakdown Row Section */}
              <div className="border-t border-[#1f262e] pt-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Roster Vitals</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#1c232b] p-2 rounded">
                    <p className="text-gray-500 text-[9px] font-bold uppercase">Vertical</p>
                    <p className="font-bold text-yellow-400 mt-0.5">33 in</p>
                  </div>
                  <div className="bg-[#1c232b] p-2 rounded">
                    <p className="text-gray-500 text-[9px] font-bold uppercase">Flying 10</p>
                    <p className="font-bold text-blue-300 mt-0.5">1.02s</p>
                  </div>
                  <div className="bg-[#1c232b] p-2 rounded">
                    <p className="text-gray-500 text-[9px] font-bold uppercase">Weight</p>
                    <p className="font-bold mt-0.5">178 lb</p>
                  </div>
                </div>
                {/* Micro Readiness Scores */}
                <div className="flex justify-between items-center text-[11px] text-gray-400 bg-[#161b21] px-3 py-2 rounded border border-[#1f262e]">
                  <span>Energy: <strong className="text-white">8/10</strong></span>
                  <span>Sleep: <strong className="text-white">8/10</strong></span>
                  <span>Soreness: <strong className="text-red-400">3/10</strong></span>
                </div>
              </div>

              {/* Chart Visual Simulation Block (Flying 10 Trend Analysis) */}
              <div className="border-t border-[#1f262e] pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Flying 10 Trend</h4>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1"><TrendingDown size={10}/> lower is faster</span>
                </div>
                <div className="bg-[#161b21] border border-[#1f262e] rounded-lg p-3 h-28 flex items-end justify-between gap-2 pt-6">
                  {/* Visual Simulation Bars for Trend points S1 to S6 */}
                  {[
                    { label: 'S1', val: 80, time: '1.11s' },
                    { label: 'S2', val: 75, time: '1.09s' },
                    { label: 'S3', val: 70, time: '1.06s' },
                    { label: 'S4', val: 72, time: '1.07s' },
                    { label: 'S5', val: 65, time: '1.04s' },
                    { label: 'S6', val: 60, time: '1.02s' }
                  ].map((pt, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <span className="text-[9px] text-blue-300 scale-0 group-hover:scale-100 absolute -top-5 transition duration-150 font-mono bg-[#1c232b] px-1 rounded border border-[#2b3541] z-10">{pt.time}</span>
                      <div 
                        style={{ height: `${pt.val}%` }} 
                        className={`w-full rounded-t transition-all ${idx === 5 ? 'bg-red-500 shadow-md shadow-red-500/20' : 'bg-blue-500/70 group-hover:bg-blue-400'}`}
                      ></div>
                      <span className="text-[9px] text-gray-500 font-bold mt-1">{pt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Interaction System Notes Memo */}
              <div className="border-t border-[#1f262e] pt-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Coach Notes</h4>
                <p className="text-xs text-gray-300 bg-[#161b21] p-3 rounded-lg border border-[#1f262e] leading-relaxed">
                  Strong week. Hit a new vertical PB Thursday[span_2](start_span)[span_2](end_span). Keep loading progression on schedule for the deload next week[span_3](start_span)[span_3](end_span).
                </p>
              </div>

              {/* Action Operations Command Bar */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button className="bg-[#1c232b] hover:bg-[#252f3a] border border-[#2b3541] text-xs font-bold py-2.5 rounded-lg text-center text-gray-300 transition">
                  View Full Profile
                </button>
                <button className="bg-red-650 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg text-center shadow-lg transition">
                  Assign Workout
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
