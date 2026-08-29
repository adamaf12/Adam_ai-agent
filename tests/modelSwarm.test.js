import test from 'node:test';
import assert from 'node:assert/strict';
import { modelRegistry, registrySnapshot, routeTask } from '../src/core/models/modelSwarm.ts';

test('model registry keeps metadata lightweight and exposes provider inventory', () => {
  const snapshot = registrySnapshot();
  assert.ok(snapshot.total >= 6);
  assert.equal(snapshot.total, snapshot.enabled);
  assert.ok(snapshot.providers.includes('gemini'));
  assert.ok(snapshot.providers.includes('pollinations'));
});

test('router selects a coding-capable primary model', () => {
  const plan = routeTask({ prompt: 'design a secure API', capabilities: ['coding', 'reasoning'] });
  assert.ok(plan.primary.capabilities.includes('coding'));
  assert.equal(plan.strategy, 'single');
});

test('router can form a bounded ensemble without loading model weights', () => {
  const plan = routeTask({ prompt: 'deep architecture review', capabilities: ['reasoning'], maxModels: 4 });
  assert.equal(plan.strategy, 'ensemble');
  assert.ok(plan.ensemble.length <= 4);
  assert.equal(plan.ensemble[0].id, plan.primary.id);
  assert.equal(modelRegistry.size(), registrySnapshot().total);
});
