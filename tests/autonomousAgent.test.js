import test from 'node:test';
import assert from 'node:assert/strict';
import {
  executeCodeInBrowser,
  executeTerminalCommand,
  createAgentFile,
  createAgentTask,
  extractAgentActions,
  checkAndExecuteDirectAutonomousCommand,
} from '../src/core/agent/ademDuoAutonomousAgent.ts';

test('autonomous agent executes code in safe sandbox', () => {
  const result = executeCodeInBrowser('const a = 10; const b = 20; return a + b;');
  assert.equal(result.success, true);
  assert.equal(result.output, '30');
  assert.ok(result.executionTimeMs >= 0);
});

test('autonomous agent captures console output in code execution', () => {
  const result = executeCodeInBrowser('console.log("Hello ADEM"); return 100;');
  assert.equal(result.success, true);
  assert.ok(result.stdout.some(s => s.includes('Hello ADEM')));
});

test('autonomous agent executes terminal commands with exit code 0', () => {
  const uname = executeTerminalCommand('uname -a', 'linux');
  assert.equal(uname.exitCode, 0);
  assert.ok(uname.output.includes('Linux'));

  const ls = executeTerminalCommand('ls -la /workspace', 'linux');
  assert.equal(ls.exitCode, 0);
  assert.ok(ls.output.includes('package.json'));
});

test('autonomous agent creates files with data download URLs', () => {
  const file = createAgentFile('test.py', 'print("Hello from ADEM")', 'python');
  assert.equal(file.fileName, 'test.py');
  assert.ok(file.sizeBytes > 0);
  assert.ok(file.downloadUrl && file.downloadUrl.length > 0);
});

test('autonomous agent creates and stores tasks', () => {
  const taskPayload = createAgentTask('Deploy ADEM Server', 'Run automated healthcheck', 'high');
  assert.equal(taskPayload.task.title, 'Deploy ADEM Server');
  assert.equal(taskPayload.task.priority, 'high');
  assert.equal(taskPayload.task.completed, false);
});

test('extractAgentActions extracts agent-action payloads from text', () => {
  const sample = `Some intro
:::agent-action
{
  "actionType": "code_exec",
  "title": "Code Run",
  "engine": "engine_1_executive",
  "authorityLevel": "root_unrestricted",
  "timestamp": 123456,
  "payload": {
    "type": "code_exec",
    "data": {
      "code": "return 1;",
      "language": "javascript",
      "output": "1",
      "success": true,
      "executionTimeMs": 5,
      "stdout": []
    }
  }
}
:::
More text`;
  const actions = extractAgentActions(sample);
  assert.equal(actions.length, 1);
  assert.equal(actions[0].actionType, 'code_exec');
  assert.equal(actions[0].title, 'Code Run');
});

test('checkAndExecuteDirectAutonomousCommand intercepts direct user triggers in Arabic and English', () => {
  const codeActionAr = checkAndExecuteDirectAutonomousCommand('شغل كود: return 5 * 5;', 'ar');
  assert.ok(codeActionAr);
  assert.equal(codeActionAr.actionType, 'code_exec');
  assert.equal(codeActionAr.payload.type === 'code_exec' && codeActionAr.payload.data.output, '25');

  const cmdAction = checkAndExecuteDirectAutonomousCommand('نفذ أمر: uname -a', 'ar');
  assert.ok(cmdAction);
  assert.equal(cmdAction.actionType, 'terminal_command');

  const fileAction = checkAndExecuteDirectAutonomousCommand('اصنع ملف script.sh: #!/bin/bash\necho "ok"', 'ar');
  assert.ok(fileAction);
  assert.equal(fileAction.actionType, 'file_created');

  const taskAction = checkAndExecuteDirectAutonomousCommand('create task: Setup firewall rules', 'en');
  assert.ok(taskAction);
  assert.equal(taskAction.actionType, 'task_created');
});
