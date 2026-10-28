const fs=require('node:fs');const path=require('node:path');const http=require('node:http');const assert=require('node:assert/strict');
const root=process.cwd();const esbuild=require(path.join(root,'node_modules/esbuild'));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=path.join(root,'maintenance/print-clear-qa');fs.mkdirSync(out,{recursive:true});
const cssFile=fs.readdirSync('dist/assets').find(f=>f.endsWith('.css'));const css=fs.readFileSync('dist/assets/'+cssFile);
const fixture=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {renderToStaticMarkup} from 'react-dom/server';
import {PrintablePacket} from './src/PrintablePacket';import {PrintConfirmation} from './src/PrintConfirmation';
import {preparePrintWindow,runPrintAndClear} from './src/printAndClear';
const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180"><rect width="600" height="180" fill="white"/><text x="30" y="100" font-size="48">SAMPLE SIGNATURE</text></svg>');
const record={id:'sample-not-a-real-customer',type:'minor-piercing',minorName:'Sample Client',name:'',dob:'2010-01-01',parentGuardianName:'Sample Guardian',guardianDOB:'1980-01-01',relationToMinor:'Parent',phone:'555-0100',address:'Sample address',city:'Houston',state:'TX',zip:'77020',submissionDate:'2026-10-26',submissionTime:'12:00',consentSignedAt:'2026-10-26T17:00:00Z',aftercareAcknowledged:true,staffVerified:true,healthAnswers:{allergies:false},procedureExplanation:'Sample piercing',healingTime:'Sample instructions',adultSignature:image,minorSignature:image,guardianIdPhotoFront:image,minorBirthCert:image,_consentEvidence:{agreed:true,signedAt:'2026-10-26T17:00:00Z',version:'v1'}};
window.fixture={clearCalls:0,refreshCalls:0,record,mode:'normal'};
function App(){const [names,setNames]=useState([]),[status,setStatus]=useState('queued'),[busy,setBusy]=useState(false);let resolver;
window.resolvePrint=(value)=>{window.pendingResolve(value);setNames([]);};
return <><h1>Local verification with sample data</h1><p id="status">{status}</p><button disabled={busy} onClick={async()=>{setBusy(true);const p=window.open('','_blank');p.print=()=>{if(window.fixture.mode==='printer-error')throw new Error('simulated printer error');p.dispatchEvent(new Event('afterprint'));};try{const done=await runPrintAndClear({print:()=>preparePrintWindow(p,renderToStaticMarkup(<PrintablePacket clients={[{...record,minorSignature:window.fixture.mode==='image-error'?'data:image/png;base64,broken':record.minorSignature}]} />)),confirmPrinted:()=>new Promise(resolve=>{window.pendingResolve=resolve;setNames(['Sample Client']);}),clear:async()=>{window.fixture.clearCalls++;window.fixture.record={...record,isArchived:true};},refresh:async()=>{window.fixture.refreshCalls++;setStatus(window.fixture.record.isArchived?'history':'queued');}});if(!done)setStatus('queued');}catch(e){setStatus(e.message);}finally{setBusy(false);}}}>Print & Clear</button>{names.length>0&&<PrintConfirmation names={names} onResolve={window.resolvePrint}/>}</>}
createRoot(document.getElementById('root')).render(<App/>);`;
(async()=>{
const built=await esbuild.build({stdin:{contents:fixture,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser'});
const server=http.createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');res.end(built.outputFiles[0].contents);}else if(req.url==='/app.css'){res.setHeader('Content-Type','text/css');res.end(css);}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
async function openPacket(){const popupEvent=page.waitForEvent('popup');await page.getByRole('button',{name:'Print & Clear',exact:true}).click();return popupEvent;}
let popup=await openPacket();await page.getByRole('dialog').waitFor();assert.equal(await page.evaluate(()=>window.fixture.clearCalls),0,'afterprint must never clear');
await popup.emulateMedia({media:'print'});await popup.pdf({path:path.join(out,'sample-signed-packet.pdf'),format:'Letter',preferCSSPageSize:true});await popup.screenshot({path:path.join(out,'sample-packet.png'),fullPage:true});
assert.equal(await popup.locator('.saved-details, .attachment').count(),0);assert.equal(await popup.locator('.print-id-section img').count(),2);assert.equal(await popup.locator('img').count(),4);assert.match(await popup.locator('body').innerText(),/Identification Verification/i);
await page.getByRole('button',{name:/Cancelled \/ failed/}).click();assert.equal(await page.evaluate(()=>window.fixture.clearCalls),0);await popup.close();
popup=await openPacket();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.fixture.clearCalls),0);await popup.close();
await page.evaluate(()=>window.fixture.mode='image-error');popup=await openPacket();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('could not load'));assert.equal(await page.evaluate(()=>window.fixture.clearCalls),0);assert.equal(await page.getByRole('dialog').count(),0);await popup.close();
await page.evaluate(()=>window.fixture.mode='printer-error');popup=await openPacket();await page.waitForFunction(()=>document.querySelector('#status').textContent==='simulated printer error');assert.equal(await page.evaluate(()=>window.fixture.clearCalls),0);await popup.close();
await page.evaluate(()=>window.fixture.mode='normal');popup=await openPacket();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:/I checked every printed page/}).click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='history');
assert.equal(await page.evaluate(()=>window.fixture.clearCalls),1);assert.equal(await page.evaluate(()=>window.fixture.refreshCalls),1);assert.equal(await page.evaluate(()=>window.fixture.record.adultSignature===window.fixture.record.minorSignature),true);assert.equal(errors.length,0,JSON.stringify(errors));
console.log('Browser checks passed: cancellation, Escape, image failure, print exception, explicit confirmation, queue refresh and record preservation. Sample PDF generated.');
}finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
