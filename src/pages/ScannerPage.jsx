import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Camera } from 'lucide-react';
import useFaceApi from '../hooks/useFaceApi.js';
import useFaceMatcher from '../hooks/useFaceMatcher.js';
import Modal from '../components/Modal.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { db, appId } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.js';

const ScannerPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const { faceapi, modelsLoaded, error: faceError } = useFaceApi();
  const { faceMatcher, students, loading: matcherLoading } = useFaceMatcher();
  const { currentUser } = useAuth();

  const [cameraReady, setCameraReady] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [tardyModalOpen, setTardyModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [minutesLate, setMinutesLate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing camera...');

  useEffect(() => {
    if (!modelsLoaded) return;
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraReady(true);
            setStatusMessage('Camera ready. Looking for faces...');
          };
        }
      } catch (err) {
        console.error('Camera access denied:', err);
        setStatusMessage('Unable to access camera. Please check permissions.');
      }
    };
    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [modelsLoaded]);

  useEffect(() => {
    if (!modelsLoaded || !cameraReady || !faceMatcher) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);

    const detectFaces = async () => {
      if (!video || video.readyState !== 4) return;
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);

      if (detections.length) {
        const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
        if (bestMatch.label !== 'unknown') {
          const matchedStudent = students.find((student) => student.id === bestMatch.label);
          if (matchedStudent) {
            setActiveStudent(matchedStudent);
            setStatusMessage(`Hello ${matchedStudent.name}.`);
          }
        } else {
          setActiveStudent(null);
          setStatusMessage('Face not recognized.');
        }
      } else {
        setActiveStudent(null);
        setStatusMessage('No face detected.');
      }
    };

    detectionIntervalRef.current = setInterval(detectFaces, 1500);

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [modelsLoaded, cameraReady, faceMatcher, faceapi, students]);

  const resetModals = () => {
    setMinutesLate('');
    setReason('');
    setTardyModalOpen(false);
    setLeaveModalOpen(false);
  };

  const saveLog = async (payload) => {
    if (!activeStudent || !currentUser) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        studentClass: activeStudent.class,
        studentGender: activeStudent.gender,
        ...payload,
        loggedByEmail: currentUser.email || 'Unknown',
        timestamp: serverTimestamp()
      });
      resetModals();
    } catch (err) {
      console.error('Failed to save log', err);
      alert('Failed to save attendance log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTardySubmit = (e) => {
    e.preventDefault();
    const minutes = parseInt(minutesLate, 10);
    if (Number.isNaN(minutes) || minutes <= 0) {
      alert('Minutes late must be a positive number.');
      return;
    }
    saveLog({ type: 'late', minutesLate: minutes, reason: reason || 'No reason provided' });
  };

  const handleLeaveConfirm = () => {
    saveLog({ type: 'period-leave', minutesLate: 0, reason: 'Period leave approved' });
  };

  if (faceError) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
        Failed to load face recognition models. Please refresh the page.
      </div>
    );
  }

  if (!modelsLoaded || matcherLoading) {
    return <LoadingScreen message="Preparing face recognition..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Face Scanner</h1>
        <span className="text-sm text-slate-400">{statusMessage}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full rounded-xl bg-black object-cover" />
          <canvas ref={canvasRef} className="absolute left-0 top-0 h-full w-full" />
          {!cameraReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
              <Camera className="h-12 w-12 text-slate-500" />
              <p className="mt-3 text-sm text-slate-400">Waiting for camera...</p>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Detected Student</h2>
          {activeStudent ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xl font-bold text-primary">{activeStudent.name}</p>
                <p className="text-sm text-slate-400">{activeStudent.class}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setTardyModalOpen(true)}
                  className="rounded-lg bg-primary/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary"
                >
                  Record Tardy
                </button>
                {activeStudent.gender === 'P' && (
                  <button
                    onClick={() => setLeaveModalOpen(true)}
                    className="rounded-lg border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
                  >
                    Record Period Leave
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              Stand in front of the camera to start recognition.
            </p>
          )}
        </div>
      </div>

      <Modal
        open={tardyModalOpen}
        onClose={resetModals}
        title={`Record Tardy - ${activeStudent?.name || ''}`}
        footer={
          <>
            <button
              onClick={resetModals}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleTardySubmit}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          </>
        }
      >
        <form onSubmit={handleTardySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Minutes Late</label>
            <input
              type="number"
              min="1"
              value={minutesLate}
              onChange={(e) => setMinutesLate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Optional"
            ></textarea>
          </div>
        </form>
      </Modal>

      <Modal
        open={leaveModalOpen}
        onClose={resetModals}
        title={`Record Period Leave - ${activeStudent?.name || ''}`}
        footer={
          <>
            <button
              onClick={resetModals}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleLeaveConfirm}
              disabled={saving}
              className="rounded-lg bg-accent/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-accent disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {saving ? 'Saving...' : 'Confirm'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Confirm that {activeStudent?.name} is taking a period leave. This will be logged immediately.
        </p>
      </Modal>
    </div>
  );
};

export default ScannerPage;
