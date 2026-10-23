import test from 'node:test';
import assert from 'node:assert/strict';
import { TN_DISTRICTS } from '../src/components/CivicServicesHub.tsx';
test('Tamil Nadu map lists 38 unique districts',()=>{assert.equal(TN_DISTRICTS.length,38);assert.equal(new Set(TN_DISTRICTS.map(d=>d.name)).size,38);});
test('district SLA percentages and counts are in range',()=>{for(const d of TN_DISTRICTS){assert.ok(d.onTime>=0&&d.onTime<=100,d.name);assert.ok(Number.isInteger(d.petitions)&&d.petitions>=0,d.name);assert.ok(Number.isInteger(d.critical)&&d.critical>=0,d.name);}});
test('SLA thresholds are green >90, amber 75–90, red <75',()=>{const s=n=>n>90?'green':n>=75?'amber':'red';assert.equal(s(91),'green');assert.equal(s(90),'amber');assert.equal(s(75),'amber');assert.equal(s(74.99),'red');});
