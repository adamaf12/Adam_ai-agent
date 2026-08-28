const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldList = `      const defaultFallbackList = [
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'pollinations/openai',
        'pollinations/qwen',
        'pollinations/mistral',
        'deepseek/deepseek-chat:free',
        'meta-llama/llama-3.1-70b-instruct:free',
        'mistralai/mistral-7b-instruct:free',
        'google/gemma-2-9b-it:free',
        'qwen/qwen-2.5-72b-instruct:free',
      ];`;

const newList = `      const defaultFallbackList = [
        'gemini-3.7-pro',
        'gemini-1.5-pro',
        'gemini-3.7-flash',
        'gemini-1.5-flash',
        'gemini-3.1-flash-lite',
        'qwen/qwen-2.5-72b-instruct:free',
        'meta-llama/llama-3.1-70b-instruct:free',
        'deepseek/deepseek-chat:free',
        'pollinations/openai',
        'pollinations/qwen',
        'pollinations/mistral',
      ];`;

code = code.replace(oldList, newList);

const fallbackLogic = `      // Deduplicate while preserving order, and always ensure free pollinations fail-safes are included
      const coreFreeFallbacks = ['pollinations/openai', 'pollinations/qwen', 'pollinations/mistral'];
      const combinedCandidates = [...sanitizedList, ...coreFreeFallbacks];
      const modelsToTry = combinedCandidates.filter((m, idx, arr) => arr.indexOf(m) === idx);`;

const newFallbackLogic = `      // Deduplicate while preserving order, and always ensure free pollinations fail-safes are included
      let coreFreeFallbacks = ['pollinations/openai', 'pollinations/qwen', 'pollinations/mistral'];
      let combinedCandidates = [...sanitizedList, ...coreFreeFallbacks];
      
      // Force Gemini models for media generation based on strength
      const isMediaIntent = message.includes('صور') || message.includes('فيديو') || message.includes('ارسم') || message.includes('توليد') || message.includes('صمم');
      if (isMediaIntent) {
        combinedCandidates = [
          'gemini-3.7-pro',
          'gemini-1.5-pro',
          'gemini-3.7-flash',
          'gemini-1.5-flash',
          'gemini-3.1-flash-lite'
        ];
      }
      
      const modelsToTry = combinedCandidates.filter((m, idx, arr) => arr.indexOf(m) === idx);`;

code = code.replace(fallbackLogic, newFallbackLogic);

fs.writeFileSync('server.ts', code);
