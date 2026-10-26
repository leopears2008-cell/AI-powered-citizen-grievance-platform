import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICT_SLA, DEPARTMENT_SLA, getDistrictSla } from '../src/data/slaMatrix.ts';
import {
  DISTRICT_NAMES,
  getAllMLAs,
  getConstituenciesForDistrict,
  getMLAForConstituency,
  plainConstituency,
} from '../src/data/mlaProfiles.ts';

const mlas = getAllMLAs();

test('SLA matrix covers 38 unique districts and 234 constituencies', () => {
  assert.equal(DISTRICT_SLA.length, 38);
  assert.equal(new Set(DISTRICT_SLA.map((d) => d.district)).size, 38);
  assert.equal(DISTRICT_SLA.reduce((n, d) => n + d.acCount, 0), 234);
  assert.equal(DEPARTMENT_SLA.length, 8);
});

test('every district in the roster has an SLA row with a matching constituency count', () => {
  assert.equal(DISTRICT_NAMES.length, 38);
  for (const name of DISTRICT_NAMES) {
    const sla = getDistrictSla(name);
    assert.ok(sla, `missing SLA row for ${name}`);
    assert.equal(getConstituenciesForDistrict(name).length, sla.acCount, `AC count mismatch for ${name}`);
  }
});

test('SLA figures are well-formed', () => {
  for (const d of DISTRICT_SLA) {
    assert.ok(d.compliance > 0 && d.compliance <= 100, d.district);
    assert.match(d.portal, /^[a-z]+\.nic\.in$/, d.district);
    assert.match(d.emergency, /^\d+ Hrs$/, d.district);
    assert.match(d.revenue, /^\d+ Days$/, d.district);
    assert.ok(d.escalation.length > 0, d.district);
  }
});

test('directory lists 234 unique constituencies numbered 1-234', () => {
  assert.equal(mlas.length, 234);
  assert.deepEqual(
    mlas.map((m) => m.no).sort((a, b) => a - b),
    Array.from({ length: 234 }, (_, i) => i + 1)
  );
});

test('constituency labels are unique within each district', () => {
  for (const name of DISTRICT_NAMES) {
    const labels = getConstituenciesForDistrict(name);
    assert.equal(new Set(labels).size, labels.length, name);
  }
});

test('same-named constituencies in different districts resolve by district', () => {
  assert.equal(getMLAForConstituency('Tirupathur', 'Tiruppattur').no, 50);
  assert.equal(getMLAForConstituency('Sivaganga', 'Tiruppattur').no, 185);
});

test('vacant seats never invent a successor and 6 Oct 2026 by-election seats are filled', () => {
  const vacant = mlas.filter((m) => m.status === 'Vacant');
  assert.equal(vacant.length, 5);
  for (const v of vacant) assert.equal(v.name, 'Seat vacant');
  for (const no of [35, 101]) {
    const seat = mlas.find((m) => m.no === no)!;
    assert.equal(seat.status, 'Elected');
    assert.equal(seat.party, 'TVK');
  }
});

test('no contact details are published without an official source', () => {
  for (const m of mlas) {
    assert.equal(m.phone, '');
    assert.equal(m.email, '');
  }
});

test('key offices are present', () => {
  assert.match(mlas.find((m) => m.no === 12)!.role ?? '', /Chief Minister/);
  assert.match(mlas.find((m) => m.no === 19)!.role ?? '', /Leader of the Opposition/);
  assert.match(mlas.find((m) => m.no === 20)!.role ?? '', /Speaker/);
  assert.equal(plainConstituency('Poonamallee (SC)'), 'Poonamallee');
});
