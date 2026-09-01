import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SWARM_MODELS, ModelRegistry, modelRegistry, registerRemoteModels, registrySnapshot, routeTask } from '../src/core/models/modelSwarm.ts';

test('model registry starts with usable built-in models', () => {
  const snapshot = registrySnapshot();
  assert.ok(snapshot.total >= 3);
  assert.equal(snapshot.total, snapshot.enabled);
  assert.ok(snapshot.providers.includes('gemini'));
});

test('remote catalogs can add models without hardcoding their count', () => {
  const registry = new ModelRegistry();
  const models = registerRemoteModels({ data: [{ id: 'demo-a', name: 'Demo A', capabilities: ['coding'] }, { id: 'demo-b', name: 'Demo B' }] });
  models.forEach(model => registry.register(model));
  assert.equal(registry.size(), 2);
  assert.ok(registry.get('demo-a').capabilities.includes('coding'));
});

test('router selects a coding-capable primary model', () => {
  const plan = routeTask({ prompt: 'design a secure API', capabilities: ['coding', 'reasoning'] });
  assert.ok(plan.primary.capabilities.includes('coding'));
  assert.equal(plan.strategy, 'single');
});

test('router supports a large requested swarm while execution remains bounded elsewhere', () => {
  assert.equal(MAX_SWARM_MODELS, 1000);
  const plan = routeTask({ prompt: 'deep architecture review', capabilities: ['reasoning'], maxModels: 1000 });
  assert.equal(plan.strategy, 'ensemble');
  assert.ok(plan.ensemble.length <= MAX_SWARM_MODELS);
  assert.equal(plan.ensemble[0].id, plan.primary.id);
  assert.equal(modelRegistry.size(), registrySnapshot().total);
});
