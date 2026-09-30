import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
    verificationMethod: 'phone',
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
    statusHistory: [{ status: 'Submitted', timestamp: now, updatedBy: 'Citizen', role: 'CITIZEN', remarks: 'Submitted by citizen.' }],
    createdAt: now,
    updatedAt: now,
  };
};

async function provisionAdmin(uid: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'admins', uid), { active: true });
  });
}

before(async () => {
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
after(async () => testEnv.cleanup());

describe('Firestore grievance and admin rules', () => {
  it('denies unauthenticated reads and writes', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assert.rejects(getDoc(doc(db, 'grievances', 'GRV-2026-ABCDEF12')));
    await assert.rejects(setDoc(doc(db, 'grievances', 'GRV-2026-ABCDEF12'), grievance('citizen-a')));
  });

  it('allows a citizen to create and read their own grievance only', async () => {
    const anonymousDb = testEnv.authenticatedContext('anonymous-citizen', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assert.rejects(setDoc(doc(anonymousDb, 'grievances', 'GRV-2026-ABCDEF12'), grievance('anonymous-citizen')));

    const citizenDb = testEnv.authenticatedContext('citizen-a', { phone_number: '+919999999999' }).firestore();
    await setDoc(doc(citizenDb, 'grievances', 'GRV-2026-ABCDEF12'), grievance('citizen-a'));

    const otherCitizenDb = testEnv.authenticatedContext('citizen-b', { phone_number: '+918888888888' }).firestore();
    await assert.rejects(getDoc(doc(otherCitizenDb, 'grievances', 'GRV-2026-ABCDEF12')));
    await assert.rejects(updateDoc(doc(citizenDb, 'grievances', 'GRV-2026-ABCDEF12'), { status: 'Resolved' }));

    await updateDoc(doc(citizenDb, 'grievances', 'GRV-2026-ABCDEF12'), {
      feedback: { rating: 5, comment: 'Thank you', isResolvedSatisfied: true, submittedAt: '2026-09-30T01:00:00.000Z' },
      updatedAt: '2026-09-30T01:00:00.000Z',
    });

    const emailGrievance = {
      ...grievance('email-citizen'),
      id: 'GRV-2026-1234ABCD',
      trackId: 'GRV-2026-1234ABCD',
      verificationMethod: 'email',
      citizenEmail: 'verified@example.test',
    };
    const emailDb = testEnv.authenticatedContext('email-citizen', { email: 'verified@example.test', email_verified: true }).firestore();
    await setDoc(doc(emailDb, 'grievances', emailGrievance.id), emailGrievance);
  });

  it('requires a verified, active admin record and makes audit logs immutable', async () => {
    await provisionAdmin('admin-a');
    const adminDb = testEnv.authenticatedContext('admin-a', { email: 'admin@example.test', email_verified: true }).firestore();
    const complaintRef = doc(adminDb, 'grievances', 'GRV-2026-ABCDEF12');
    await setDoc(doc(testEnv.authenticatedContext('citizen-a', { phone_number: '+919999999999' }).firestore(), 'grievances', 'GRV-2026-ABCDEF12'), grievance('citizen-a'));
    await updateDoc(complaintRef, { status: 'Under Review', updatedAt: '2026-09-30T01:00:00.000Z' });

    const audit = doc(adminDb, 'auditLogs', 'audit-1');
    await setDoc(audit, {
      id: 'audit-1', timestamp: '2026-09-30T01:00:00.000Z', userId: 'admin-a',
      userName: 'admin@example.test', userRole: 'ADMIN', action: 'STATUS_UPDATE',
      details: 'Changed grievance status', grievanceId: 'GRV-2026-ABCDEF12',
    });
    await assert.rejects(updateDoc(audit, { details: 'tampered' }));

    const unverifiedDb = testEnv.authenticatedContext('admin-a', { email: 'admin@example.test', email_verified: false }).firestore();
    await assert.rejects(getDoc(doc(unverifiedDb, 'grievances', 'GRV-2026-ABCDEF12')));
    const unprovisionedDb = testEnv.authenticatedContext('admin-b', { email: 'other@example.test', email_verified: true }).firestore();
    await assert.rejects(getDoc(doc(unprovisionedDb, 'grievances', 'GRV-2026-ABCDEF12')));
  });

  it('keeps server-written citizen profiles and verification audit events closed to clients', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'citizen-a'), { uid: 'citizen-a', phoneVerified: true });
      await setDoc(doc(context.firestore(), 'auditLogs', 'auth-PHONE_VERIFIED-citizen-a'), {
        id: 'auth-PHONE_VERIFIED-citizen-a', timestamp: '2026-09-30T01:00:00.000Z', userId: 'citizen-a',
        userName: 'Citizen', userRole: 'CITIZEN', action: 'PHONE_VERIFIED', details: 'Verified via Firebase Authentication (phone).',
      });
    });

    const citizenDb = testEnv.authenticatedContext('citizen-a', { phone_number: '+919999999999' }).firestore();
    await assert.rejects(getDoc(doc(citizenDb, 'users', 'citizen-a')));
    await assert.rejects(setDoc(doc(citizenDb, 'users', 'citizen-a'), { uid: 'citizen-a', phoneVerified: true }));
    await assert.rejects(getDoc(doc(citizenDb, 'auditLogs', 'auth-PHONE_VERIFIED-citizen-a')));
    await assert.rejects(setDoc(doc(citizenDb, 'auditLogs', 'auth-EMAIL_VERIFIED-citizen-a'), {
      id: 'auth-EMAIL_VERIFIED-citizen-a', timestamp: '2026-09-30T01:00:00.000Z', userId: 'citizen-a',
      userName: 'Citizen', userRole: 'CITIZEN', action: 'EMAIL_VERIFIED', details: 'forged',
    }));
  });
});
