import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [actualRole, setActualRole] = useState(null); // 'admin', 'member', or null
  const [isMemberView, setIsMemberView] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    // We handle domain validation manually below, so removing the strict 'hd' parameter 
    // to ensure the popup always opens for testing.
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure email is lowercase for all checks
        const userEmail = user.email.toLowerCase();

        // 1. Domain Check
        if (!userEmail.endsWith('@skcet.ac.in') && userEmail !== 'mohamedarshad1507@gmail.com') {
          console.error("Access restricted to SKCET college accounts.");
          await signOut(auth);
          setCurrentUser(null);
          setActualRole(null);
          setLoading(false);
          return;
        }

        // 2. Whitelist & Role Check
        try {
          // Hardcode the developer email as an admin for testing purposes
          if (userEmail === 'mohamedarshad1507@gmail.com') {
            setCurrentUser(user);
            setActualRole('admin');
          } else {
            const userDocRef = doc(db, 'members', userEmail); 
            const userDocSnap = await getDoc(userDocRef);
            
            // Because the seed data had uppercase emails (e.g. 25EE174@...), 
            // we should also try to fetch the uppercase version if lowercase fails, just in case!
            let role = null;
            if (userDocSnap.exists()) {
              role = userDocSnap.data().role;
            } else {
              // Try uppercase fallback for the prefix
              const upperEmail = userEmail.split('@')[0].toUpperCase() + '@skcet.ac.in';
              const upperDocRef = doc(db, 'members', upperEmail);
              const upperDocSnap = await getDoc(upperDocRef);
              if (upperDocSnap.exists()) {
                role = upperDocSnap.data().role;
              }
            }

            if (role) {
              setCurrentUser(user);
              setActualRole(role);
            } else {
              console.error("You are not a registered member of Kurukshetra Expense Tracker.");
              await signOut(auth);
              setCurrentUser(null);
              setActualRole(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          await signOut(auth);
          setCurrentUser(null);
          setActualRole(null);
        }
      } else {
        setCurrentUser(null);
        setActualRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const userRole = (actualRole === 'admin' && isMemberView) ? 'member' : actualRole;

  const value = {
    currentUser,
    userRole,
    actualRole,
    isMemberView,
    setIsMemberView,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
