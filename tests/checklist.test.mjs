import test from 'node:test';
import assert from 'node:assert/strict';
import {selectRequirements, reviewGaps} from '../src/checklist.js';

test('unknown and missing answers retain conditional records; only explicit no excludes them', () => {
  const records = [{id:1}, {id:2,condition_key:'taxable_sales'}, {id:3,condition_key:'uses_dba'}];
  assert.deepEqual(selectRequirements(records, {taxable_sales:'unknown',uses_dba:'no'}).map(r=>r.id), [1,2]);
  assert.equal(selectRequirements(records, {}).length, 3);
});
test('unknown employee and entity answers expose coverage gaps without asserting requirements', () => {
  const gaps=reviewGaps({});
  assert.ok(gaps.some(s=>s.startsWith('Employee-related')));
  assert.ok(gaps.some(s=>s.startsWith('Entity formation')));
});
test('explicit negative answers remove contextual prompts but retain the overall coverage limitation', () => {
  const gaps=reviewGaps({entity_type:'sole_proprietor',has_employees:'no',home_based:'no',wash_water:'no'});
  assert.equal(gaps.length,2);
  assert.ok(gaps[0].includes('boundary'));
  assert.ok(gaps[1].includes('not a complete list'));
});
