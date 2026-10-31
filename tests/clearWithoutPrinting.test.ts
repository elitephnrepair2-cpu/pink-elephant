import test from 'node:test';
import assert from 'node:assert/strict';
import { clearWithoutPrinting } from '../src/clearWithoutPrinting.ts';
const visit={id:'done',procedureStatus:'completed',signature:'saved-signature',healthAnswers:{allergies:false},idPhoto:'saved-id',consentAgreed:true};

test('Cancel does not mutate the database or start printing', async()=>{
  const client={rpc:async()=>{throw Error('must not run');}};
  assert.equal(await clearWithoutPrinting(client,[visit],false,async()=>{throw Error('must not refresh');}),false);
});
test('explicit no-print confirmation clears selected active visits and verifies preserved records', async()=>{
  const calls:any[]=[];const original=structuredClone(visit);let row={...visit,isArchived:false};
  const client={rpc:async(name:string,args:any)=>{calls.push([name,args]);row.isArchived=true;return {data:[{id:'done'}],error:null};}};
  assert.equal(await clearWithoutPrinting(client,[visit,{...visit,id:'old',isArchived:true}],true,async()=>{calls.push('refresh');return [row];}),true);
  assert.deepEqual(calls,[['pe_clear_queue',{p_ids:['done']}],'refresh']);
  const {isArchived,...retained}=row;assert.deepEqual(retained,original);assert.deepEqual(visit,original);
});
test('empty and archived-only selections cannot become clear-all', async()=>{
  for(const selected of [[],[{id:'archived',isArchived:true}]])
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

test('waiting and in-progress visits can be cleared without falsifying completion or losing consent',async()=>{
  const visits=[{...visit,id:'waiting',procedureStatus:'waiting'},{...visit,id:'chair',procedureStatus:'in_progress'}];
  const retained=visits.map(v=>({...v,isArchived:true}));let args:any;
  const client={rpc:async(name:string,input:any)=>{assert.equal(name,'pe_clear_queue');args=input;return {data:visits.map(v=>({id:v.id}))};}};
  assert.equal(await clearWithoutPrinting(client,visits,true,async()=>retained),true);
  assert.deepEqual(args,{p_ids:['waiting','chair']});
  assert.equal(retained[0].procedureStatus,'waiting');assert.equal(retained[1].procedureStatus,'in_progress');
  assert.equal(retained[0].signature,visit.signature);assert.equal(retained[1].consentAgreed,true);
});
