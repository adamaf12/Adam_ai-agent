const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldEffect = `  // Multi-User Profile & Data Partition Sync Listener (When Google User changes)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const userSessions = loadSessions();
      setSessions(userSessions);
      if (userSessions.length > 0) {
        setActiveSession(userSessions[0]);
      } else {
        const newS = createNewSession();
        setActiveSession(newS);
        setSessions([newS]);
      }
      setSettings(loadSettings());
      setMemories(loadMemories());
      setNotes(loadNotes());
      setEvents(loadEvents());
      setReminders(loadReminders());
    });
    return () => unsubscribe();
  }, []);`;

const newEffect = `  // Multi-User Profile & Data Partition Sync Listener (When Google User changes)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setOnboardingCompleted(true);
        setShowOnboarding(false);
      }
      const userSessions = loadSessions();
      setSessions(userSessions);
      if (userSessions.length > 0) {
        setActiveSession(userSessions[0]);
      } else {
        const newS = createNewSession();
        setActiveSession(newS);
        setSessions([newS]);
      }
      setSettings(loadSettings());
      setMemories(loadMemories());
      setNotes(loadNotes());
      setEvents(loadEvents());
      setReminders(loadReminders());
    });
    return () => unsubscribe();
  }, []);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('src/App.tsx', code);
