import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import { db, appId } from '../firebase.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

const DashboardPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');
    const unsubscribe = onSnapshot(
      logsRef,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setLogs(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load dashboard data:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const tardyLogs = useMemo(() => logs.filter((log) => log.type === 'late'), [logs]);

  const topTardyStudents = useMemo(() => {
    const map = new Map();
    tardyLogs.forEach((log) => {
      const key = log.studentId;
      const entry = map.get(key) || { name: log.studentName, class: log.studentClass, tardies: 0 };
      entry.tardies += 1;
      map.set(key, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => b.tardies - a.tardies)
      .slice(0, 5);
  }, [tardyLogs]);

  const tardiesByDate = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 30 }).map((_, idx) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (29 - idx));
      const key = date.toISOString().slice(0, 10);
      return { key, label: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }), tardies: 0 };
    });
    const dayMap = new Map(days.map((d) => [d.key, d]));
    tardyLogs.forEach((log) => {
      if (!log.timestamp?.toDate) return;
      const key = log.timestamp.toDate().toISOString().slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.get(key).tardies += 1;
      }
    });
    return days;
  }, [tardyLogs]);

  const reasonDistribution = useMemo(() => {
    const map = new Map();
    tardyLogs.forEach((log) => {
      const reason = (log.reason || 'Unspecified').trim();
      map.set(reason, (map.get(reason) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [tardyLogs]);

  const incidentTypeDistribution = useMemo(() => {
    const counts = logs.reduce(
      (acc, log) => {
        if (log.type === 'late') acc.tardy += 1;
        else if (log.type === 'period-leave') acc.leave += 1;
        return acc;
      },
      { tardy: 0, leave: 0 }
    );
    return [
      { name: 'Tardy', value: counts.tardy },
      { name: 'Period Leave', value: counts.leave }
    ];
  }, [logs]);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Analytics Dashboard</h1>
        <p className="text-sm text-slate-400">Monitor trends and patterns in student discipline.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Top 5 Tardy Students</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topTardyStudents}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis allowDecimals={false} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b' }} />
              <Legend />
              <Bar dataKey="tardies" fill="#38BDF8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Tardy Incidents (30 Days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tardiesByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" stroke="#94a3b8" minTickGap={20} />
              <YAxis allowDecimals={false} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b' }} />
              <Line type="monotone" dataKey="tardies" stroke="#2563EB" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Tardy Reason Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b' }} />
              <Pie data={reasonDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {reasonDistribution.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={['#38BDF8', '#818CF8', '#F97316', '#F472B6', '#22C55E'][index % 5]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Incident Type Share</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b' }} />
              <Pie data={incidentTypeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {incidentTypeDistribution.map((entry, index) => (
                  <Cell key={`type-${entry.name}`} fill={['#2563EB', '#38BDF8'][index % 2]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
