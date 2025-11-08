import { useEffect, useMemo, useState } from 'react';
import * as faceapi from 'face-api.js';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../firebase.js';

const useFaceMatcher = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setStudents(items);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load students:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const faceMatcher = useMemo(() => {
    if (!students.length) return null;
    try {
      const labeledDescriptors = students
        .filter((student) => student.faceDescriptor)
        .map((student) => {
          const descriptorArray = JSON.parse(student.faceDescriptor);
          const descriptor = new Float32Array(descriptorArray);
          return new faceapi.LabeledFaceDescriptors(student.id, [descriptor]);
        });
      if (!labeledDescriptors.length) return null;
      return new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    } catch (err) {
      console.error('Failed to build face matcher:', err);
      setError(err);
      return null;
    }
  }, [students]);

  return { faceMatcher, students, loading, error };
};

export default useFaceMatcher;
