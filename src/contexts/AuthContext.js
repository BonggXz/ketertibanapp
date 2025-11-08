import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, appId, ensureInitialAuth } from '../firebase.js';

const AuthContext = createContext({ currentUser: null, userData: null, loadingAuth: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    ensureInitialAuth.finally(() => {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        setCurrentUser(user);
        if (user) {
          try {
            const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              setUserData(userSnap.data());
            } else {
              setUserData({ email: user.email || 'Unknown', role: 'teacher' });
            }
          } catch (error) {
            console.error('Failed to load user data:', error);
            setUserData({ email: user.email || 'Unknown', role: 'teacher' });
          }
        } else {
          setUserData(null);
        }
        setLoadingAuth(false);
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = React.useMemo(
    () => ({ currentUser, userData, loadingAuth, signOut: () => signOut(auth) }),
    [currentUser, userData, loadingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
