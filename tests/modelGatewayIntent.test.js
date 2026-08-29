import { describe, expect, it } from 'vitest';
import { inferCapabilities } from '../src/core/models/agentModelGateway.ts';

describe('agent model routing intent', () => {
  it('detects coding and reasoning tasks', () => {
    const capabilities = inferCapabilities('حلل هذا الكود وأعد تصميم architecture');
    expect(capabilities).toContain('coding');
    expect(capabilities).toContain('reasoning');
  });

  it('keeps simple prompts on the general path', () => {
    expect(inferCapabilities('مرحبا')).toEqual(['general']);
  });
});
