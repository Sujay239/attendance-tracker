import assert from 'assert';
import { calculateAttendance, recalculateCumulativeBalances } from '../attendanceCalculator';
import { DEFAULT_SETTINGS } from '../storageService';
import { combineDateAndTime } from '../timeUtils';
import { AttendanceRecord } from '../types';

function runTests() {
  console.log('--- Running Attendance Tracker Automated Logic Tests ---');

  const baseDate = '2026-10-03';
  const tz = DEFAULT_SETTINGS.timezone; // Asia/Kolkata

  // ================= TEST 1 =================
  // Clock In: 10:00, Clock Out: 19:00
  // Expected: office=540, lunch=60, buffer=15, productive=465, required=465, balance=0
  const t1In = combineDateAndTime(baseDate, '10:00', tz);
  const t1Out = combineDateAndTime(baseDate, '19:00', tz);
  const r1 = calculateAttendance(t1In, t1Out, baseDate, DEFAULT_SETTINGS);

  assert.strictEqual(r1.officeMinutes, 540, 'Test 1: officeMinutes should be 540');
  assert.strictEqual(r1.lunchMinutes, 60, 'Test 1: lunchMinutes should be 60');
  assert.strictEqual(r1.bufferMinutes, 15, 'Test 1: bufferMinutes should be 15');
  assert.strictEqual(r1.productiveMinutes, 465, 'Test 1: productiveMinutes should be 465');
  assert.strictEqual(r1.requiredProductiveMinutes, 465, 'Test 1: requiredProductiveMinutes should be 465');
  assert.strictEqual(r1.dailyBalanceMinutes, 0, 'Test 1: dailyBalanceMinutes should be 0');
  assert.strictEqual(r1.earlyMinutes, 0, 'Test 1: earlyMinutes should be 0');
  assert.strictEqual(r1.lateMinutes, 0, 'Test 1: lateMinutes should be 0');
  console.log('✅ Test 1 Passed (10:00 -> 19:00 => Balance: 0m)');

  // ================= TEST 2 =================
  // Clock In: 09:45, Clock Out: 19:00
  // Expected: office=555, productive=480, required=465, balance=+15
  const t2In = combineDateAndTime(baseDate, '09:45', tz);
  const t2Out = combineDateAndTime(baseDate, '19:00', tz);
  const r2 = calculateAttendance(t2In, t2Out, baseDate, DEFAULT_SETTINGS);

  assert.strictEqual(r2.officeMinutes, 555, 'Test 2: officeMinutes should be 555');
  assert.strictEqual(r2.productiveMinutes, 480, 'Test 2: productiveMinutes should be 480');
  assert.strictEqual(r2.requiredProductiveMinutes, 465, 'Test 2: requiredProductiveMinutes should be 465');
  assert.strictEqual(r2.dailyBalanceMinutes, 15, 'Test 2: dailyBalanceMinutes should be +15');
  assert.strictEqual(r2.earlyMinutes, 15, 'Test 2: earlyMinutes should be 15');
  assert.strictEqual(r2.lateMinutes, 0, 'Test 2: lateMinutes should be 0');
  console.log('✅ Test 2 Passed (09:45 -> 19:00 => Balance: +15m, 15m Early)');

  // ================= TEST 3 =================
  // Clock In: 10:15, Clock Out: 19:00
  // Expected: office=525, productive=450, required=465, balance=-15
  const t3In = combineDateAndTime(baseDate, '10:15', tz);
  const t3Out = combineDateAndTime(baseDate, '19:00', tz);
  const r3 = calculateAttendance(t3In, t3Out, baseDate, DEFAULT_SETTINGS);

  assert.strictEqual(r3.officeMinutes, 525, 'Test 3: officeMinutes should be 525');
  assert.strictEqual(r3.productiveMinutes, 450, 'Test 3: productiveMinutes should be 450');
  assert.strictEqual(r3.requiredProductiveMinutes, 465, 'Test 3: requiredProductiveMinutes should be 465');
  assert.strictEqual(r3.dailyBalanceMinutes, -15, 'Test 3: dailyBalanceMinutes should be -15');
  assert.strictEqual(r3.earlyMinutes, 0, 'Test 3: earlyMinutes should be 0');
  assert.strictEqual(r3.lateMinutes, 15, 'Test 3: lateMinutes should be 15');
  console.log('✅ Test 3 Passed (10:15 -> 19:00 => Balance: -15m, 15m Late)');

  // ================= TEST 4 =================
  // Clock In: 10:15, Clock Out: 19:30
  // Expected: office=555, productive=480, required=465, balance=+15
  // (Notice: user was 15m late, but worked till 19:30, so net balance is +15m!)
  const t4In = combineDateAndTime(baseDate, '10:15', tz);
  const t4Out = combineDateAndTime(baseDate, '19:30', tz);
  const r4 = calculateAttendance(t4In, t4Out, baseDate, DEFAULT_SETTINGS);

  assert.strictEqual(r4.officeMinutes, 555, 'Test 4: officeMinutes should be 555');
  assert.strictEqual(r4.productiveMinutes, 480, 'Test 4: productiveMinutes should be 480');
  assert.strictEqual(r4.requiredProductiveMinutes, 465, 'Test 4: requiredProductiveMinutes should be 465');
  assert.strictEqual(r4.dailyBalanceMinutes, 15, 'Test 4: dailyBalanceMinutes should be +15');
  assert.strictEqual(r4.lateMinutes, 15, 'Test 4: lateMinutes should be 15');
  console.log('✅ Test 4 Passed (10:15 -> 19:30 => 15m Late, but Balance: +15m Extra!)');

  // ================= TEST 5 =================
  // Clock In: 09:45, Clock Out: 19:30
  // Expected: office=585, productive=510, required=465, balance=+45
  const t5In = combineDateAndTime(baseDate, '09:45', tz);
  const t5Out = combineDateAndTime(baseDate, '19:30', tz);
  const r5 = calculateAttendance(t5In, t5Out, baseDate, DEFAULT_SETTINGS);

  assert.strictEqual(r5.officeMinutes, 585, 'Test 5: officeMinutes should be 585');
  assert.strictEqual(r5.productiveMinutes, 510, 'Test 5: productiveMinutes should be 510');
  assert.strictEqual(r5.requiredProductiveMinutes, 465, 'Test 5: requiredProductiveMinutes should be 465');
  assert.strictEqual(r5.dailyBalanceMinutes, 45, 'Test 5: dailyBalanceMinutes should be +45');
  assert.strictEqual(r5.earlyMinutes, 15, 'Test 5: earlyMinutes should be 15');
  console.log('✅ Test 5 Passed (09:45 -> 19:30 => Balance: +45m Extra!)');

  // ================= TEST 6: CUMULATIVE CHAIN & HISTORICAL CORRECTION =================
  const chainRecords: AttendanceRecord[] = [
    {
      id: '2026-10-01',
      date: '2026-10-01',
      clockIn: '2026-10-01T10:20:00+05:30',
      clockOut: '2026-10-01T19:00:00+05:30',
      officialStart: '10:00',
      officialEnd: '19:00',
      lunchMinutes: 60,
      bufferMinutes: 15,
      officeMinutes: 520,
      productiveMinutes: 445,
      requiredProductiveMinutes: 465,
      dailyBalanceMinutes: -20,
      earlyMinutes: 0,
      lateMinutes: 20,
      status: 'COMPLETED',
      notes: '',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2026-10-02',
      date: '2026-10-02',
      clockIn: '2026-10-02T09:30:00+05:30',
      clockOut: '2026-10-02T19:00:00+05:30',
      officialStart: '10:00',
      officialEnd: '19:00',
      lunchMinutes: 60,
      bufferMinutes: 15,
      officeMinutes: 570,
      productiveMinutes: 495,
      requiredProductiveMinutes: 465,
      dailyBalanceMinutes: 30,
      earlyMinutes: 30,
      lateMinutes: 0,
      status: 'COMPLETED',
      notes: '',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2026-10-03',
      date: '2026-10-03',
      clockIn: '2026-10-03T10:00:00+05:30',
      clockOut: '2026-10-03T19:15:00+05:30',
      officialStart: '10:00',
      officialEnd: '19:00',
      lunchMinutes: 60,
      bufferMinutes: 15,
      officeMinutes: 555,
      productiveMinutes: 480,
      requiredProductiveMinutes: 465,
      dailyBalanceMinutes: 15,
      earlyMinutes: 0,
      lateMinutes: 0,
      status: 'COMPLETED',
      notes: '',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const initialChain = recalculateCumulativeBalances(chainRecords);
  assert.strictEqual(initialChain.records[0].cumulativeBalanceMinutes, -20, 'Day 1 cumulative should be -20');
  assert.strictEqual(initialChain.records[1].cumulativeBalanceMinutes, 10, 'Day 2 cumulative should be +10');
  assert.strictEqual(initialChain.records[2].cumulativeBalanceMinutes, 25, 'Day 3 cumulative should be +25');
  assert.strictEqual(initialChain.finalCumulativeBalance, 25, 'Final cumulative should be +25');
  console.log('✅ Initial Cumulative Chain Passed (-20 -> +10 -> +25)');

  // Correct Day 1: changed from -20 to +10
  chainRecords[0].dailyBalanceMinutes = 10;
  chainRecords[0].status = 'CORRECTED';

  const correctedChain = recalculateCumulativeBalances(chainRecords);
  assert.strictEqual(correctedChain.records[0].cumulativeBalanceMinutes, 10, 'Corrected Day 1 cumulative should be +10');
  assert.strictEqual(correctedChain.records[1].cumulativeBalanceMinutes, 40, 'Corrected Day 2 cumulative should be +40');
  assert.strictEqual(correctedChain.records[2].cumulativeBalanceMinutes, 55, 'Corrected Day 3 cumulative should be +55');
  assert.strictEqual(correctedChain.finalCumulativeBalance, 55, 'Corrected Final cumulative should be +55');
  console.log('✅ Historical Correction Propagation Passed (Chain updated to +10 -> +40 -> +55)');

  console.log('----------------------------------------------------');
  console.log('🎉 ALL 6 AUTOMATED CALCULATION & INTEGRITY TESTS PASSED!');
}

runTests();
