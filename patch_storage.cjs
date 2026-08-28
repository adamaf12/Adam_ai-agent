const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');

const oldList = `export const DEFAULT_MODEL_FALLBACK_LIST = [
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'pollinations/openai',
  'pollinations/mistral',
  'pollinations/qwen',
  'deepseek/deepseek-chat:free',
  'meta-llama/llama-3.1-70b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2.5-72b-instruct:free',
];`;

const newList = `export const DEFAULT_MODEL_FALLBACK_LIST = [
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
fs.writeFileSync('src/lib/storage.ts', code);
