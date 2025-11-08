import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/models';
let modelsPromise;

const loadModels = () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL)
    ]);
  }
  return modelsPromise;
};

const useFaceApi = () => {
  const [state, setState] = useState({ loaded: false, error: null });

  useEffect(() => {
    let isActive = true;
    loadModels()
      .then(() => {
        if (isActive) setState({ loaded: true, error: null });
      })
      .catch((error) => {
        console.error('Failed to load face-api models', error);
        if (isActive) setState({ loaded: false, error });
      });
    return () => {
      isActive = false;
    };
  }, []);

  return { faceapi, modelsLoaded: state.loaded, error: state.error };
};

export default useFaceApi;
