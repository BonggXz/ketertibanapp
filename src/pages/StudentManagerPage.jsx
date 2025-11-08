import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, appId } from '../firebase.js';
import { Plus, Trash2, Edit2, Camera } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import useFaceApi from '../hooks/useFaceApi.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

const StudentManagerPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({ name: '', class: '', gender: 'L' });
  const [editingId, setEditingId] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { faceapi, modelsLoaded } = useFaceApi();

  useEffect(() => {
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setStudents(list);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load students:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const setupVideo = async () => {
      if (!modalOpen) return;
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.onloadedmetadata = () => videoRef.current.play();
        }
      } catch (error) {
        console.error('Failed to start camera', error);
        setScanMessage('Unable to access camera.');
      }
    };
    setupVideo();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [modalOpen]);

  const openModal = (student = null) => {
    if (student) {
      setFormData({ name: student.name, class: student.class, gender: student.gender });
      setEditingId(student.id);
      setFaceDescriptor(student.faceDescriptor || '');
    } else {
      setFormData({ name: '', class: '', gender: 'L' });
      setEditingId(null);
      setFaceDescriptor('');
    }
    setScanMessage('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setProcessing(false);
    setScanMessage('');
  };

  const handleScanFace = async () => {
    if (!modelsLoaded) {
      setScanMessage('Models not loaded yet.');
      return;
    }
    if (!videoRef.current) {
      setScanMessage('Camera not ready.');
      return;
    }
    setProcessing(true);
    setScanMessage('Scanning face...');
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        setScanMessage('Face not detected. Please try again.');
      } else {
        setFaceDescriptor(JSON.stringify(Array.from(detection.descriptor)));
        setScanMessage('Face scanned successfully!');
      }
    } catch (error) {
      console.error('Face scan failed:', error);
      setScanMessage('Face scan failed. Please retry.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', studentId));
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('Failed to delete student.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.class) {
      alert('Name and class are required.');
      return;
    }
    if (!faceDescriptor) {
      alert('Please scan the student face before saving.');
      return;
    }
    setProcessing(true);
    try {
      if (editingId) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', editingId), {
          ...formData,
          faceDescriptor
        });
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
          ...formData,
          faceDescriptor
        });
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save student:', error);
      alert('Failed to save student.');
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading students..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Student Manager</h1>
          <p className="text-sm text-slate-400">Manage student profiles and facial data.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add New Student
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Class</th>
              <th className="px-4 py-3 text-left font-semibold">Gender</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {students.length ? (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-800/60">
                  <td className="px-4 py-3 font-medium">{student.name}</td>
                  <td className="px-4 py-3">{student.class}</td>
                  <td className="px-4 py-3">{student.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(student)}
                        className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="flex items-center gap-1 rounded-lg border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-slate-400">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Student' : 'Add New Student'}
        footer={
          <>
            <button
              onClick={closeModal}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {processing ? 'Saving...' : 'Save' }
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Class</label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData((prev) => ({ ...prev, class: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-200">Face Capture</p>
            <div className="relative overflow-hidden rounded-lg border border-slate-800">
              <video ref={videoRef} autoPlay muted playsInline className="h-48 w-full bg-black object-cover" />
              {!modelsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-sm text-slate-400">
                  Loading models...
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleScanFace}
              disabled={processing}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-accent/60 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera className="h-4 w-4" /> {processing ? 'Scanning...' : 'Scan Face'}
            </button>
            {scanMessage && <p className="mt-2 text-xs text-slate-400">{scanMessage}</p>}
            {faceDescriptor && <p className="mt-2 text-xs text-emerald-400">Face data captured.</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentManagerPage;
