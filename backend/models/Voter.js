/**
 * Voter.js — Lightweight file-backed voter registry.
 *
 * Schema per record:
 *   voterId       {string}  — raw 12-character National ID (never stored after hashing)
 *   identityHash  {string}  — SHA-256 hex fingerprint of the voterId (primary key)
 *   constituencyId {number} — assigned constituency
 *   wardId         {number} — assigned ward within that constituency
 *   registeredAt  {string}  — ISO timestamp
 *
 * Storage: backend/data/voterRegistry.json
 * All operations are synchronous (small dataset, admin-only writes).
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const DATA_DIR   = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'voterRegistry.json');

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Ensure the data directory and file exist. */
function ensureStore() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) writeFileSync(STORE_PATH, JSON.stringify([]), 'utf-8');
}

/** Read all voter records from disk. */
function readAll() {
  ensureStore();
  try {
    return JSON.parse(readFileSync(STORE_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

/** Persist the full registry array to disk. */
function writeAll(records) {
  ensureStore();
  writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), 'utf-8');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Derive the SHA-256 identity fingerprint for a given voterId string.
 * @param {string} voterId
 * @returns {string} hex digest
 */
export function hashVoterId(voterId) {
  return createHash('sha256').update(String(voterId)).digest('hex');
}

/**
 * Register (or overwrite) a voter in the registry.
 * @param {string} voterId         - raw 12-char National ID
 * @param {number} constituencyId
 * @param {number} wardId
 * @returns {object} saved voter record (without raw voterId)
 */
export function upsertVoter(voterId, constituencyId, wardId) {
  const identityHash = hashVoterId(voterId);
  const records      = readAll();
  const existing     = records.findIndex(r => r.identityHash === identityHash);

  if (existing !== -1) {
    throw new Error(`Duplicate entry: Voter ID is already enrolled in the registry.`);
  }

  const record = {
    identityHash,
    constituencyId: Number(constituencyId),
    wardId:         Number(wardId),
    registeredAt:   new Date().toISOString(),
  };

  records.push(record);
  writeAll(records);
  return record;
}

/**
 * Look up a voter by their raw voterId.
 * @param {string} voterId
 * @returns {object|null} voter record or null if not found
 */
export function findVoterById(voterId) {
  const identityHash = hashVoterId(voterId);
  const records      = readAll();
  return records.find(r => r.identityHash === identityHash) || null;
}

/**
 * Look up a voter directly by their pre-computed SHA-256 hash.
 * @param {string} identityHash
 * @returns {object|null}
 */
export function findVoterByHash(identityHash) {
  const records = readAll();
  return records.find(r => r.identityHash === identityHash) || null;
}

/**
 * Return every voter record (admin-only use).
 * @returns {object[]}
 */
export function getAllVoters() {
  return readAll();
}

/**
 * Total registered voters count.
 * @returns {number}
 */
export function voterCount() {
  return readAll().length;
}
