import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const projectId = 'demo-civic-grievance';
let testEnv: RulesTestEnvironment;

const grievance = (citizenId: string) => {
  const now = '2026-09-30T00:00:00.000Z';
  return {
    id: 'GRV-2026-ABCDEF12',
    trackId: 'GRV-2026-ABCDEF12',
    citizenId,
    citizenName: 'Test Citizen',
    citizenPhone: '+919999999999',
    citizenEmail: '',
    language: 'English',
    originalTranscript: 'Street light is not working.',
    summaryEn: 'Street light not working.',
    summaryTa: '',
    category: 'Street Light',
    departmentId: 'street-light',
    departmentName: 'Street Light Department',
    priority: 'Medium',
    priorityReason: 'Routine report',
    confidenceScore: 0.9,
    location: { address: 'Test Street', district: 'Chennai' },
    attachments: [],
    entities: {},
    estimatedDays: 3,
    targetResolutionDate: now,
    status: 'Submitted',
    statusHistory: [{ status: 'Submitted', timestamp: now, updatedBy: 'Citizen', role: 'CITIZEN' }],
    createdAt: now,
    updatedAt: now,
  };
};

async function provisionAdmin(uid: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'admins', uid), { active: true });
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

beforeEach(async () => testEnv.clearFirestore());
afterAll(async () => testEnv.cleanup());

describe('Firestore grievance and admin rules', () => {
  it('denies unauthenticated reads and writes', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await expect(getDoc(doc(db, 'grievances', 'GRV-2026-ABCDEF12'))).rejects.toThrow();
    await expect(setDoc(doc(db, 'grievances', 'GRV-2026-ABCDEF12'), grievance('citizen-a'))).rejects.toThrow();
  });

  it('allows a citizen to create and read their own grievance only', async () => {
    const citizenDb = testEnv.authenticatedContext('citizen-a', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await setDoc(doc(citizenDb, 'grievances', 'GRV-2026-ABCDEF12'), grievance('citizen-a'));

    const otherCitizenDb = testEnv.authenticatedContext('citizen-b', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await expect(getDoc(doc(otherCitizenDb, 'grievances', 'GRV-2026-ABCDEF12'))).rejects.toThrow();
    await expect(updateDoc(doc(citizenDb, 'grievances', 'GRV-2026-ABCDEF12'), { status: 'Resolved' })).rejects.toThrow();

    await updateDoc(doc(citizenDb, 'grievances', 'GRV-2026-ABCDEF12'), {
      feedback: { rating: 5, comment: 'Thank you', isResolvedSatisfied: true, submittedAt: '2026-09-30T01:00:00.000Z' },
      updatedAt: '2026-09-30T01:00:00.000Z',
    });
  });

  it('requires a verified, active admin record and makes audit logs immutable', async () => {
    await provisionAdmin('admin-a');
    const adminDb = testEnv.authenticatedContext('admin-a', { email_verified: true }).firestore();
    const complaintRef = doc(adminDb, 'grievances', 'GRV-2026-ABCDEF12');
    await setDoc(doc(testEnv.authenticatedContext('citizen-a').firestore(), 'grievances', 'GRV-2026-ABCDEF12'), grievance('citizen-a'));
    await updateDoc(complaintRef, { status: 'Under Review', updatedAt: '2026-09-30T01:00:00.000Z' });

    const audit = doc(adminDb, 'auditLogs', 'audit-1');
    await setDoc(audit, {
      id: 'audit-1', timestamp: '2026-09-30T01:00:00.000Z', userId: 'admin-a',
      userName: 'admin@example.test', userRole: 'ADMIN', action: 'STATUS_UPDATE',
      details: 'Changed grievance status', grievanceId: 'GRV-2026-ABCDEF12',
    });
    await expect(updateDoc(audit, { details: 'tampered' })).rejects.toThrow();

    const unverifiedDb = testEnv.authenticatedContext('admin-a', { email_verified: false }).firestore();
    await expect(getDoc(doc(unverifiedDb, 'grievances', 'GRV-2026-ABCDEF12'))).rejects.toThrow();
    const unprovisionedDb = testEnv.authenticatedContext('admin-b', { email_verified: true }).firestore();
    await expect(getDoc(doc(unprovisionedDb, 'grievances', 'GRV-2026-ABCDEF12'))).rejects.toThrow();
  });
});
