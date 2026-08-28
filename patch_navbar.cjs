const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

if (!code.includes("usePWAInstall")) {
  code = "import { usePWAInstall } from '../hooks/usePWAInstall';\nimport { Download } from 'lucide-react';\n" + code;
  
  // Find the component start
  code = code.replace("  const [isForcedOffline, setIsForcedOffline] = useState(isForcedOfflineMode());", 
                      "  const [isForcedOffline, setIsForcedOffline] = useState(isForcedOfflineMode());\n  const { isInstallable, promptInstall } = usePWAInstall();");
  
  // Find the place to insert the button
  const newChatButton = `{/* New Chat Primary Action */}`;
  const installButton = `
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-blue-600/25 transition active:scale-95 shrink-0 animate-fadeIn"
              title={isArabic ? 'تثبيت التطبيق على جهازك' : 'Install App on your device'}
            >
              <Download className="w-3.5 h-3.5 animate-bounce" />
              <span className="hidden sm:inline">{isArabic ? 'تثبيت التطبيق' : 'Install App'}</span>
            </button>
          )}
          
          {/* New Chat Primary Action */}`;
  
  code = code.replace(newChatButton, installButton);
  fs.writeFileSync('src/components/Navbar.tsx', code);
}
