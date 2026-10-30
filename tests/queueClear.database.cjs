// Optional isolated PostgreSQL check; uses synthetic in-memory records only.
const {PGlite}=require(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const {readFileSync}=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try {
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;
 CREATE TABLE public.consent_forms(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),form_data jsonb NOT NULL,consent_agreed boolean,consent_signed_at timestamptz,signature_url text);
 CREATE TABLE public.test_attachments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),consent_id uuid REFERENCES public.consent_forms(id),path text);
 CREATE FUNCTION public.pink_elephant_is_staff() RETURNS boolean LANGUAGE sql AS $$ SELECT coalesce(nullif(current_setting('test.is_staff',true),''),'false')::boolean $$;`);
 await db.exec(readFileSync('maintenance/QUEUE-CLEAR-ANY-STATUS.sql','utf8'));
 const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'];
 const forms=ids.map((id,i)=>({id,signature:'saved-signature',idPhoto:'consent/'+id+'/id.png',procedureStatus:['waiting','in_progress','completed'][i],isArchived:false,healthAnswers:{allergy:false}}));
 for(let i=0;i<ids.length;i++)await db.query('INSERT INTO consent_forms VALUES($1,$2,true,now(),$3)',[ids[i],forms[i],'consent/'+ids[i]+'/signature.png']);
 await db.query('INSERT INTO test_attachments(consent_id,path) VALUES($1,$2)',[ids[0],'retained-attachment.png']);
 const before=(await db.query('SELECT * FROM consent_forms ORDER BY id')).rows;
 await assert.rejects(db.query('SELECT * FROM pe_clear_queue($1::uuid[])',[ids]),/Approved staff/);
 await db.exec("SET test.is_staff='true'");
 await db.exec('SET ROLE anon');await assert.rejects(db.query('SELECT * FROM pe_clear_queue($1::uuid[])',[ids]),/permission denied/);await db.exec('RESET ROLE');
 await assert.rejects(db.query('SELECT * FROM pe_clear_queue($1::uuid[])',[[]]),/between 1 and 200/);
 await assert.rejects(db.query('SELECT * FROM pe_clear_queue($1::uuid[])',[Array(201).fill(ids[0])]),/between 1 and 200/);
 // A missing ID must reject the whole batch, preserving waiting entries.
 await assert.rejects(db.query('SELECT * FROM pe_clear_queue($1::uuid[])',[[ids[0],'00000000-0000-4000-8000-000000000099']]),/Only selected live/);
 assert.equal((await db.query('SELECT form_data FROM consent_forms WHERE id=$1',[ids[0]])).rows[0].form_data.isArchived,false);
 await db.exec('SET ROLE authenticated');
 const cleared=await db.query('SELECT * FROM pe_clear_queue($1::uuid[])',[ids]);assert.equal(cleared.rows.length,3);
 await db.exec('RESET ROLE');
 const after=(await db.query('SELECT * FROM consent_forms ORDER BY id')).rows;
 assert.deepEqual(after,before.map(row=>({...row,form_data:{...row.form_data,isArchived:true}})));
 assert.equal((await db.query('SELECT count(*)::int total FROM test_attachments')).rows[0].total,1);
 assert.equal((await db.query("SELECT count(*)::int total FROM consent_forms WHERE form_data->>'isArchived'<>'true'")).rows[0].total,0);
 await assert.rejects(db.query('SELECT * FROM pe_clear_queue($1::uuid[])',[ids]),/Only selected live/);
 console.log('PostgreSQL checks passed: waiting/in-progress/completed batches, staff authorization, anonymous denial, limits, stale selection atomicity, unchanged procedure status, consent/signature/attachment preservation and active queue readback.');
 } finally {await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
