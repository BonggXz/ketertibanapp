import React from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-slate-100">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
    <p className="mt-4 text-lg font-medium text-slate-200">{message}</p>
  </div>
);

export default LoadingScreen;
