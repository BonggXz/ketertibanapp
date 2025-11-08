import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Download } from 'lucide-react';
import { db, appId } from '../firebase.js';
import LoadingScreen from '../components/LoadingScreen.jsx';
import exportToCSV from '../utils/csvExporter.js';

const HistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setLogs(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load logs:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '-';
    return timestamp.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (loading) {
    return <LoadingScreen message="Loading attendance history..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Attendance History</h1>
          <p className="text-sm text-slate-400">View all recorded tardiness and period leave incidents.</p>
        </div>
        <button
          onClick={() => exportToCSV(logs, 'attendance_logs.csv')}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          <Download className="h-4 w-4" /> Download CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Class</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Details</th>
              <th className="px-4 py-3 text-left font-semibold">Logged By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {logs.length ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/60">
                  <td className="px-4 py-3">{formatDate(log.timestamp)}</td>
                  <td className="px-4 py-3 font-medium">{log.studentName}</td>
                  <td className="px-4 py-3">{log.studentClass}</td>
                  <td className="px-4 py-3 capitalize">{log.type?.replace('-', ' ')}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {log.type === 'late'
                      ? `${log.minutesLate} minutes late${log.reason ? ` - ${log.reason}` : ''}`
                      : log.reason || 'Period leave'}
                  </td>
                  <td className="px-4 py-3">{log.loggedByEmail}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-slate-400">
                  No attendance logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPage;
