export interface StorageEnvelope<T> {
  schema: 'adam';
  version: number;
  createdAt: number;
  payload: T;
}

export function createVersionedEnvelope<T>(version: number, payload: T, createdAt = Date.now()): StorageEnvelope<T> {
  if (!Number.isInteger(version) || version < 1) throw new Error('Storage version must be a positive integer.');
  return { schema: 'adam', version, createdAt, payload };
}

export function migrateEnvelope<T>(
  envelope: StorageEnvelope<T>,
  targetVersion: number,
  migrate: (version: number, payload: T) => T,
): StorageEnvelope<T> {
  if (envelope.schema !== 'adam') throw new Error('Unsupported storage envelope.');
  if (!Number.isInteger(targetVersion) || targetVersion < 1) throw new Error('Target storage version must be positive.');
  if (envelope.version > targetVersion) throw new Error('Cannot migrate storage backwards.');

  let version = envelope.version;
  let payload = envelope.payload;
  while (version < targetVersion) {
    payload = migrate(version, payload);
    version += 1;
  }
  return { ...envelope, version, payload };
}
