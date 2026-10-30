import test from 'node:test';
import assert from 'node:assert/strict';
import { completeVisitForPrinting } from '../src/completeVisitForPrinting.ts';

test('offers printing only after completion saves and a fresh queue read confirms it', async () => {
  const calls: any[] = [];
  const saved = {id:'visit', procedureStatus:'completed', isArchived:false};
  const client = {rpc:async (name:string,args:any)=>{calls.push([name,args]);return {error:null};}};
  assert.equal(await completeVisitForPrinting(client,'visit',async()=>{calls.push('refresh');return [saved];}),saved);
  assert.deepEqual(calls,[['pe_complete_visit',{p_id:'visit'}],'refresh']);
  assert.equal(saved.isArchived,false);
});
test('failed completion cannot open the print offer', async () => {
  let refreshed=false;
  await assert.rejects(completeVisitForPrinting({rpc:async()=>({error:{code:'42501'}})},'visit',async()=>{refreshed=true;return [];}), /Could not mark/);
  assert.equal(refreshed,false);
});
test('failed or stale queue read cannot offer printing or clearing', async () => {
  const client={rpc:async()=>({error:null})};
  for(const forms of [null,[],[{id:'visit',procedureStatus:'waiting'}],[{id:'visit',procedureStatus:'completed',isArchived:true}]])
    await assert.rejects(completeVisitForPrinting(client,'visit',async()=>forms),/could not be verified/);
});
