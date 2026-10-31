import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSignedPacket, packetFingerprint, runPrintAndClear, preparePrintWindow } from '../src/printAndClear.ts';

function flow(overrides: Record<string, any> = {}) {
  const calls: string[] = [];
  return { calls, options: {
    print: async () => { calls.push('print'); },
    confirmPrinted: async () => { calls.push('confirm'); return true; },
    clear: async () => { calls.push('clear'); },
    refresh: async () => { calls.push('refresh'); }, ...overrides,
  }};
}
test('clears only after explicit successful-print confirmation, then refreshes queue', async () => {
  const {calls,options} = flow();
  assert.equal(await runPrintAndClear(options), true);
  assert.deepEqual(calls, ['print','confirm','clear','refresh']);
});
test('printer cancellation / failure reported by staff keeps the customer queued', async () => {
  const {calls,options} = flow({confirmPrinted: async () => false});
  assert.equal(await runPrintAndClear(options), false);
  assert.deepEqual(calls, ['print']);
});
test('packet image failure or thrown print error never offers clearing', async () => {
  const {calls,options} = flow({print: async () => {throw new Error('printer unavailable');}});
  await assert.rejects(runPrintAndClear(options), /printer unavailable/);
  assert.deepEqual(calls, []);
});
test('a rejected queue update refreshes rather than reporting success', async () => {
  const {calls,options} = flow({clear: async () => {calls.push('clear');throw new Error('RPC failed');}});
  await assert.rejects(runPrintAndClear(options), /RPC failed/);
  assert.deepEqual(calls, ['print','confirm','clear','refresh']);
});
test('refresh failure is surfaced after a successful update', async () => {
  const {options} = flow({refresh: async () => {throw new Error('refresh unavailable');}});
  await assert.rejects(runPrintAndClear(options), /refresh unavailable/);
});
test('closing a packet before printing never proceeds', async () => {
  await assert.rejects(preparePrintWindow({closed:true} as Window, ''), /closed/);
});
test('adult and guardian/minor packets require their saved signatures', () => {
  assert.doesNotThrow(() => assertSignedPacket({type:'tattoo',signature:'data:image/png;base64,test'}));
  assert.throws(() => assertSignedPacket({type:'tattoo'}), /signature/);
  assert.throws(() => assertSignedPacket({type:'minor-piercing',adultSignature:'guardian'}), /signature/);
  assert.doesNotThrow(() => assertSignedPacket({type:'minor-piercing',adultSignature:'guardian',minorSignature:'minor'}));
});
test('an inaccessible saved attachment blocks the entire packet', () => {
  assert.throws(() => assertSignedPacket({signature:'sig',_documentPaths:{idPhotoFront:'consent/id/front.png'},idPhotoFront:null}), /attachment/);
});
test('changing saved consent, health answers, attachments or status invalidates the printed snapshot', () => {
  const row={id:'one',form_data:{signature:'consent/one/sig.png',healthAnswer:false,procedureStatus:'completed'},consent_agreed:true};
  const before=packetFingerprint(row);
  assert.equal(packetFingerprint(structuredClone(row)),before);
  for(const changed of [
    {...row,consent_agreed:false},
    {...row,form_data:{...row.form_data,healthAnswer:true}},
    {...row,form_data:{...row.form_data,signature:'new.png'}},
    {...row,form_data:{...row.form_data,isArchived:true}},
  ]) assert.notEqual(packetFingerprint(changed),before);
});

test('database clearing calls only the existing preservation RPC with the printed IDs', async () => {
  const { clearPrintedQueue } = await import('../src/printAndClear.ts');
  const row={id:'one',form_data:{procedureStatus:'completed',signature:'saved-signature'}};
  const calls: any[]=[];
  const client={from: (table: string) => {calls.push(table);return {select:()=>({in:async()=>({data:[row],error:null})})};},
    rpc:async(name:string,args:any)=>{calls.push([name,args]);return {data:[{id:'one'}],error:null};}};
  await clearPrintedQueue(client,['one'],new Map([['one',packetFingerprint(row)]]));
  assert.deepEqual(calls,['consent_forms',['pe_clear_queue',{p_ids:['one']}]]);
});

test('a record edited while the paper is being checked cannot be cleared', async () => {
  const { clearPrintedQueue } = await import('../src/printAndClear.ts');
  let called=false;
  const client={from:()=>({select:()=>({in:async()=>({data:[{id:'one',form_data:{changed:true}}]})})}),rpc:async()=>{called=true;}};
  await assert.rejects(clearPrintedQueue(client,['one'],new Map([['one','old snapshot']])),/changed/);
  assert.equal(called,false);
});

test('permission failures and partial RPC results cannot report a successful clear', async () => {
  const { clearPrintedQueue } = await import('../src/printAndClear.ts');
  const row={id:'one',form_data:{procedureStatus:'completed'}};
  for(const result of [{data:null,error:{code:'42501'}},{data:[],error:null}]) {
    const client={from:()=>({select:()=>({in:async()=>({data:[row]})})}),rpc:async()=>result};
    await assert.rejects(clearPrintedQueue(client,['one'],new Map([['one',packetFingerprint(row)]])), /Queue update/);
  }
});
