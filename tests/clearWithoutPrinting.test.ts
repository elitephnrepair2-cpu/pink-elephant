import test from 'node:test';
import assert from 'node:assert/strict';
import { clearWithoutPrinting } from '../src/clearWithoutPrinting.ts';
const visit={id:'done',procedureStatus:'completed',signature:'saved-signature',healthAnswers:{allergies:false},idPhoto:'saved-id',consentAgreed:true};

test('Cancel does not mutate the database or start printing', async()=>{
  const client={rpc:async()=>{throw Error('must not run');}};
  assert.equal(await clearWithoutPrinting(client,[visit],false,async()=>{throw Error('must not refresh');}),false);
});
test('explicit no-print confirmation clears only completed visits and verifies preserved records', async()=>{
  const calls:any[]=[];const original=structuredClone(visit);let row={...visit,isArchived:false};
  const client={rpc:async(name:string,args:any)=>{calls.push([name,args]);row.isArchived=true;return {data:[{id:'done'}],error:null};}};
  assert.equal(await clearWithoutPrinting(client,[visit,{id:'waiting'},{...visit,id:'old',isArchived:true}],true,async()=>{calls.push('refresh');return [row];}),true);
  assert.deepEqual(calls,[['pe_clear_queue',{p_ids:['done']}],'refresh']);
  const {isArchived,...retained}=row;assert.deepEqual(retained,original);assert.deepEqual(visit,original);
});
test('empty and waiting-only selections cannot become clear-all', async()=>{
  for(const selected of [[],[{id:'waiting'}]])
    await assert.rejects(clearWithoutPrinting({rpc:async()=>{throw Error('must not call');}},selected,true,async()=>[]),/Select between/);
});
test('failed RPC and unexpected returned IDs refresh but never report success',async()=>{
  for(const result of [{error:{code:'42501'}},{data:[],error:null},{data:[{id:'wrong'}],error:null}]){
    let refreshed=false;
    await assert.rejects(clearWithoutPrinting({rpc:async()=>result},[visit],true,async()=>{refreshed=true;return [visit];}),/queue/i);
    assert.equal(refreshed,true);
  }
});
test('refresh failure or remaining active visit is shown as unverified',async()=>{
  for(const forms of [null,[visit]])
    await assert.rejects(clearWithoutPrinting({rpc:async()=>({data:[{id:'done'}]})},[visit],true,async()=>forms),/refresh|active/i);
});
