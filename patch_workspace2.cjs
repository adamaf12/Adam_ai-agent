const fs = require('fs');
let code = fs.readFileSync('src/components/WorkspaceHubModal.tsx', 'utf8');

const replacement = `
  // Background Auto-Backup to Google Drive
  useEffect(() => {
    let interval: any;
    if (isAuthenticated) {
      interval = setInterval(async () => {
        try {
          if (!navigator.onLine) return;
          const sessions = loadSessions();
          if (sessions.length > 0) {
            const summaryText = sessions.map(s => 
              \`Session: \${s.title}\\nDate: \${s.updatedAt}\\nMessages:\\n\` + 
              s.messages.map(m => \`[\${m.timestamp}] \${m.sender}: \${m.content}\`).join('\\n')
            ).join('\\n\\n--- \\n\\n');
            
            const fileContent = new Blob([summaryText], { type: 'text/plain' });
            
            const token = await getWorkspaceAccessToken();
            if (token) {
              const metadata = {
                name: 'Adam_Agent_Backup.txt',
                mimeType: 'text/plain'
              };
              const form = new FormData();
              form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
              form.append('file', fileContent);
              
              await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + token
                },
                body: form
              });
              console.log('[WorkspaceHub] Successfully backed up conversations to Google Drive.');
            }
          }
        } catch(e) {
          console.error('[Drive Backup Error]:', e);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);
`;

code = code.replace(/  \/\/ Background Auto-Backup to Google Drive[\s\S]*?\}, \[isAuthenticated\]\);/m, replacement.trim());

fs.writeFileSync('src/components/WorkspaceHubModal.tsx', code);
