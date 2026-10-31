import test from 'node:test';
import assert from 'node:assert/strict';
import { completeVisitForPrinting } from '../src/completeVisitForPrinting.ts';
function fakeClient(row:any,readError:any=null) {
  const calls:any[]=[];
  const client={rpc:async(name:string,args:any)=>{calls.push([name,args]);return {error:null};},
    from:(table:string)=>{calls.push(['from',table]);return {select:(columns:string)=>{calls.push(['select',columns]);return {eq:(key:string,value:string)=>{calls.push(['eq',key,value]);return {single:async()=>{calls.push('single');return {data:row,error:readError};}};}};}};}};
  return {client,calls};
}
test('completion verifies only the affected visit, without loading queue or private image links',async()=>{
  const {client,calls}=fakeClient({id:'visit',form_data:{procedureStatus:'completed',isArchived:false,signature:'saved-path'}});
  const saved=await completeVisitForPrinting(client,'visit');
  assert.equal(saved.procedureStatus,'completed');assert.equal(saved.signature,'saved-path');
  assert.deepEqual(calls,[['pe_complete_visit',{p_id:'visit'}],['from','consent_forms'],['select','id, form_data'],['eq','id','visit'],'single']);
});
test('failed completion cannot enable printing',async()=>{
  await assert.rejects(completeVisitForPrinting({rpc:async()=>({error:{code:'42501'}})},'visit'),/Could not mark/);
});
test('failed or stale single-visit read cannot enable printing or clearing',async()=>{
  for(const row of [null,{id:'other',form_data:{procedureStatus:'completed'}},{id:'visit',form_data:{procedureStatus:'waiting'}},{id:'visit',form_data:{procedureStatus:'completed',isArchived:true}}])
    await assert.rejects(completeVisitForPrinting(fakeClient(row).client,'visit'),/could not be verified/);
  await assert.rejects(completeVisitForPrinting(fakeClient(null,{message:'offline'}).client,'visit'),/could not be verified/);
});
