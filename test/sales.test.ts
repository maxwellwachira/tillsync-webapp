import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mySales, salesByPerson, shortName } from '../src/lib/sales.ts';

const pay = (code: string, amount: number, receivedAt: number) => ({ code, amount, payerDisplay: '', phoneMasked: '', receivedAt, syncedAt: receivedAt, tillId: 't' });
const claim = (code: string, uid: string) => ({ code, uid, displayName: uid, claimedAt: 0 });
const payments = [pay('A', 2500, 300), pay('B', 1200, 200), pay('C', 800, 100), pay('D', 5000, 50)];
const claims = new Map([claim('A', 'jane'), claim('B', 'sam'), claim('C', 'jane')].map((c) => [c.code, c]));

describe('salesByPerson', () => {
  it('adds up each person, biggest first, and keeps the unclaimed apart', () => {
    const s = salesByPerson(payments, claims);
    assert.deepEqual(s.people.map((p) => [p.uid, p.total, p.count]), [['jane', 3300, 2], ['sam', 1200, 1]]);
    assert.equal(s.unclaimedTotal, 5000);
    assert.equal(s.unclaimedCount, 1);
  });
  it('ignores a claim whose payment is not in the list', () => {
    assert.equal(salesByPerson([pay('A', 1, 1)], new Map([claim('GONE', 'jane')].map((c) => [c.code, c]))).people.length, 0);
  });
});

describe('mySales', () => {
  it('totals only the person’s own claims, newest first', () => {
    const s = mySales(payments, claims, 'jane');
    assert.deepEqual(s.mine.map((p) => p.code), ['A', 'C']);
    assert.equal(s.total, 3300);
    assert.equal(s.unclaimed.length, 1);
  });
  it('is empty when signed out', () => assert.equal(mySales(payments, claims, null).count, 0));
});

describe('shortName', () => {
  it('shortens to the first name and a last initial', () => {
    assert.equal(shortName('Sam Taylor'), 'Sam T.');
    assert.equal(shortName('Sam'), 'Sam');
    assert.equal(shortName('  Mary  Jane Watson '), 'Mary J.');
  });
});
