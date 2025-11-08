import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, appId } from '../firebase.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

const roles = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' }
];

const UserManagerPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load users:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userId), { role });
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update user role.');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">User Manager</h1>
        <p className="text-sm text-slate-400">Assign roles and manage access for teachers and staff.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {users.length ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/60">
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role || 'teacher'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="px-4 py-6 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagerPage;
