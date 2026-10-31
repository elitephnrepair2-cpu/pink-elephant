import test from 'node:test';
import assert from 'node:assert/strict';
import { ageOnDate, validateDraft, validateImage } from '../server/intakeValidation.ts';
import { createIntakeHandler } from '../server/intakeHandler.ts';

const today = '2026-10-16';
const adult = { type: 'tattoo', name: 'Test Person', dob: '2000-01-01', phone: '7135550123', address: 'Test address' };
const id = '11111111-1111-4111-8111-111111111111';
const token = 'a'.repeat(64);
const png = `data:image/png;base64,${Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(32)]).toString('base64')}`;

test('checks age at the birthday boundary and rejects impossible or future dates', () => {
  assert.equal(ageOnDate('2008-10-16', today), 18);
  assert.equal(ageOnDate('2008-10-17', today), 17);
  for (const date of ['2000-02-30','2027-01-01','not-a-date']) assert.throws(() => ageOnDate(date,today));
  assert.throws(() => validateDraft({ ...adult, dob: '2010-01-01' },today), /18/);
});

test('minor intake requires an adult guardian and strips forged permissions', () => {
  const minor = { ...adult, type: 'minor-piercing', dob:'2010-01-01', guardianDOB:'1980-01-01', parentGuardianName:'Test Guardian', minorName:'Test Minor', relationToMinor:'Parent', staffVerified:true, isArchived:true, signature:'forged', idPhoto:'arbitrary/path' };
  const result = validateDraft(minor,today);
  for (const field of ['staffVerified','isArchived','signature','idPhoto']) assert.equal(field in result,false);
  assert.throws(() => validateDraft({...minor,guardianDOB:'2010-01-01'},today), /guardian/);
  assert.throws(() => validateDraft({...minor,guardianDOB:''},today));
});

test('rejects arbitrary files, oversized files, and missing signatures', () => {
  for (const value of [null, 'data:text/html;base64,AAAA', 'https://other.test/image.png', 'data:image/png;base64,'+'A'.repeat(900000)]) assert.throws(() => validateImage(value,'Signature'));
});

const env = { SUPABASE_URL:'https://example.supabase.co', SUPABASE_SERVER_KEY:'server-test-key', INTAKE_ALLOWED_ORIGINS:'https://intake.example' };
function fixture() {
  let session: any = null;
  let pinOutcome: string | undefined;
  const uploaded: string[] = [];
  const db = {
    rpc: async (name: string, args: any) => {
      if (name === 'pe_qr_create') session ||= { status:'uploading', form_data:args.p_form, hash:args.p_hash };
      if (name === 'pe_qr_ready') { session.status = 'awaiting_id_check'; session.form_data = {...session.form_data,...args.p_paths}; }
      if (name === 'pe_qr_cancel') session = null;
      if (name === 'pe_qr_try_pin') {
        const outcome = pinOutcome || (args.p_matches ? 'approved' : 'incorrect');
        if (outcome === 'approved') session.status = 'approved';
        return { error: null, data: outcome };
      }
      if (name === 'pe_qr_finish') { session.status='completed'; session.consent_form_id='saved-row'; }
      return { error:null, data: name === 'pe_qr_session' ? (session?.hash === args.p_hash ? session : null) : null };
    },
    storage: { from: () => ({ upload: async (path:string) => { uploaded.push(path); return {error:null}; } }) },
  };
  const handler = createIntakeHandler({env:{...env, INTAKE_APPROVAL_PIN:'TESTPIN9', INTAKE_APPROVAL_STAFF_ID:id},createDb: (() => db) as any});
  const request = async (body: any, origin='https://intake.example') => {
    let result: any;
    const res = {statusCode:0,setHeader(){},end(text:string){result={httpStatus:this.statusCode,...JSON.parse(text)};}};
    await handler({method:'POST',headers:{origin,'content-type':'application/json'},socket:{remoteAddress:'127.0.0.1'},body} as any,res as any);
    return result;
  };
  return {request,uploaded,getSession:()=>session,setPinOutcome:(outcome:string)=>{pinOutcome=outcome;}};
}

test('restricts origins and fails closed when server configuration is absent', async () => {
  const f=fixture();
  assert.equal((await f.request({id,token,action:'draft',form:adult},'https://evil.test')).httpStatus,403);
  const handler=createIntakeHandler({env:{}});
  let code=0;
  await handler({method:'POST'} as any,{setHeader(){},set statusCode(n:number){code=n;},end(){}} as any);
  assert.equal(code,503);
});

test('requires a separate staff approval before any signature upload or completed waiver', async () => {
  const f=fixture();
  assert.equal((await f.request({id,token,action:'draft',form:{...adult,idPhoto:png}})).httpStatus,200);
  assert.equal(f.getSession().status,'awaiting_id_check');
  const count=f.uploaded.length;
  assert.equal((await f.request({id,token,action:'complete',signature:png,aftercareAcknowledged:true,staffVerified:true})).httpStatus,409);
  assert.equal(f.uploaded.length,count);
  f.getSession().status='approved';
  assert.equal((await f.request({id,token,action:'complete',signature:png,aftercareAcknowledged:false})).httpStatus,400);
  assert.equal((await f.request({id,token,action:'complete',signature:png,aftercareAcknowledged:true})).saved,true);
  const completeCount=f.uploaded.length;
  assert.equal((await f.request({id,token,action:'complete',signature:png,aftercareAcknowledged:true})).saved,true);
  assert.equal(f.uploaded.length,completeCount);
});

test('a different receipt token cannot read status or submit a completed waiver', async () => {
  const f=fixture();
  await f.request({id,token,action:'draft',form:{...adult,idPhoto:png}});
  assert.equal((await f.request({id,token:'b'.repeat(64),action:'status'})).httpStatus,410);
  assert.equal((await f.request({id,token:'b'.repeat(64),action:'complete',signature:png,aftercareAcknowledged:true})).httpStatus,410);
});

test('PIN approval requires a physical-ID confirmation and a correct case-sensitive server PIN', async () => {
  const f=fixture();
  await f.request({id,token,action:'draft',form:{...adult,idPhoto:png}});
  assert.equal((await f.request({id,token,action:'approve-pin',pin:'TESTPIN9'})).httpStatus,400);
  assert.equal((await f.request({id,token,action:'approve-pin',pin:'testpin9',idChecked:true})).httpStatus,403);
  assert.equal(f.getSession().status,'awaiting_id_check');
  assert.equal((await f.request({id,token,action:'approve-pin',pin:'TESTPIN9',idChecked:true})).status,'approved');
  assert.equal(f.getSession().status,'approved');
});

test('locked PIN attempts stay blocked even with the correct PIN', async () => {
  const f=fixture();
  await f.request({id,token,action:'draft',form:{...adult,idPhoto:png}});
  f.setPinOutcome('locked');
  assert.equal((await f.request({id,token,action:'approve-pin',pin:'TESTPIN9',idChecked:true})).httpStatus,429);
  assert.equal(f.getSession().status,'awaiting_id_check');
});

test('returning a draft for correction invalidates its old receipt', async () => {
  const f=fixture();
  await f.request({id,token,action:'draft',form:{...adult,idPhoto:png}});
  assert.equal((await f.request({id,token,action:'cancel'})).cancelled,true);
  assert.equal((await f.request({id,token,action:'complete',signature:png,aftercareAcknowledged:true})).httpStatus,410);
});
