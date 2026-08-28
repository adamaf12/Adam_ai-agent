const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldState = `const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !isOnboardingCompleted());`;
const newState = `const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    // If the user is already authenticated via Google, they don't need onboarding
    if (isUserGoogleAuthenticated()) {
      setOnboardingCompleted(true);
      return false;
    }
    return !isOnboardingCompleted();
  });`;

code = code.replace(oldState, newState);
fs.writeFileSync('src/App.tsx', code);
