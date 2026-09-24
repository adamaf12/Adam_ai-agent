export type SandboxLanguage = 'javascript' | 'typescript' | 'python' | 'bash' | 'html';

export interface SandboxResourceLimits {
  cpuLimit: number;       // vCPU e.g. 0.5, 1.0, 2.0
  memoryLimitMb: number;  // MB e.g. 64, 128, 256, 512
  timeoutMs: number;      // ms e.g. 5000, 10000, 30000
  networkEnabled: boolean; // boolean
}

export interface SandboxExecutionRequest {
  code: string;
  language: SandboxLanguage;
  stdin?: string;
  limits?: Partial<SandboxResourceLimits>;
}

export interface SandboxExecutionResult {
  ok: boolean;
  containerId: string;
  engine: 'docker' | 'isolated_worker';
  engineDetails: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  peakMemoryMb: number;
  resourceLimits: SandboxResourceLimits;
  error?: string;
  timedOut?: boolean;
  oomKilled?: boolean;
  timestamp: number;
}

export interface DockerSandboxStatus {
  ok: boolean;
  dockerAvailable: boolean;
  engine: 'docker' | 'isolated_worker';
  version: string;
  defaultLimits: SandboxResourceLimits;
  supportedLanguages: SandboxLanguage[];
  activeContainersCount: number;
  totalExecutions: number;
  dockerImages?: Record<SandboxLanguage, string>;
}

export async function executeInDockerSandbox(
  req: SandboxExecutionRequest
): Promise<SandboxExecutionResult> {
  const response = await fetch('/api/sandbox/docker/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Sandbox execution failed`);
  }

  return response.json();
}

export async function getDockerSandboxStatus(): Promise<DockerSandboxStatus> {
  const response = await fetch('/api/sandbox/docker/status');
  if (!response.ok) {
    throw new Error(`Failed to fetch Docker status (HTTP ${response.status})`);
  }
  return response.json();
}

export async function pruneDockerContainers(): Promise<{ ok: boolean; message: string }> {
  const response = await fetch('/api/sandbox/docker/prune', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to prune temporary containers');
  }
  return response.json();
}
