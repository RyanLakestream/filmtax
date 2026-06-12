// Smoke test for the redesigned single-file app.
// Verifies: guarded blocks byte-identical to the original upload, design system,
// all 6 feature upgrades, and that core pure logic still executes correctly.
const fs=require('fs');
const ORIG='/root/.claude/uploads/f78c3393-011f-5f44-8870-bd9b0938f127/a073c0f3-filmtax_7.html';
const orig=fs.readFileSync(ORIG,'utf8');
const cur=fs.readFileSync(__dirname+'/index.html','utf8');
let pass=0,fail=0;
function check(name,cond,detail){
  if(cond){pass++;console.log('  PASS  '+name);}
  else{fail++;console.log('  FAIL  '+name+(detail?' — '+detail:''));}
}
function extract(src,startMarker,endMarker){
  const s=src.indexOf(startMarker);
  if(s===-1)return null;
  const e=src.indexOf(endMarker,s);
  if(e===-1)return null;
  return src.slice(s,e);
}
function sameBlock(name,startMarker,endMarker){
  const a=extract(orig,startMarker,endMarker);
  const b=extract(cur,startMarker,endMarker);
  check(`guarded verbatim: ${name}`,a!==null&&a===b,a===null?'not found in original':b===null?'not found in new file':'content differs');
}

console.log('\nGUARDRAILS — blocks unchanged');
sameBlock('STATE_PROGRAMS (all 3 programs, rules, cats, docs)','const STATE_PROGRAMS={','const QUAL_OPTS');
sameBlock('IndexedDB persistence layer',"const DB_NAME='filmtax_manager_v3'","// ─── FILE PARSER");
sameBlock('PapaParse / SheetJS file parsing','function sanitizeHeader','// ─── MONEY PARSER');
sameBlock('parseMoney','function parseMoney(value){','// ─── QUAL TAG NORMALIZER');
sameBlock('normalizeQualTag','function normalizeQualTag(raw){','// ─── AI CLASSIFICATION');
sameBlock('requestClaude + fetchLiveRules','async function requestClaude','// Step 2: classify');
sameBlock('classifyLinesWithAI','async function classifyLinesWithAI','// ─── UI ATOMS');
check('3 programs intact: CA / NY / NY_COMMERCIAL',cur.includes('CA:{')&&cur.includes('NY:{')&&cur.includes('NY_COMMERCIAL:{'));
check('no NJ/GA/TX programs introduced',!/  NJ:\{|  GA:\{|  TX:\{/.test(cur));
check('dead STATE_PROGRAMS.NJ fallback fixed to CA',!cur.includes('STATE_PROGRAMS.NJ')&&cur.includes('STATE_PROGRAMS[stateAbbr]||STATE_PROGRAMS.CA'));

console.log('\nGUARDRAILS — ELI5 wizard content intact');
['Hey, glad you’re here.'.replace('’',"'"),"30 seconds and you're ready to go.",'One quick thing.','You need a free access code. Takes 60 seconds.',"Paste it in and you're done.",'This is the last step, promise.','50 cents per project','$10/month limit','Your code stays on your device. We never store it anywhere else.','Drop in your files','AI reads every line','Download the workbook','Skip for now'].forEach(t=>{
  check(`wizard text: "${t.slice(0,42)}"`,cur.includes(t));
});

console.log('\nCDN / single-file requirements');
['react@18/umd/react.production.min.js','react-dom@18/umd/react-dom.production.min.js','@babel/standalone/babel.min.js','xlsx@0.18.5/dist/xlsx.full.min.js','papaparse@5.4.1/papaparse.min.js'].forEach(u=>check('CDN: '+u.split('/')[0],cur.includes(u)));

console.log('\nDESIGN SYSTEM');
['--navy:#0f1b2d','--navy-2:#162236','--navy-3:#1e3a5f','--teal:#0d9488','--teal-light:#ccfbf1','--amber:#d97706','--amber-light:#fef3c7','--red:#dc2626','--red-light:#fee2e2','--green:#16a34a','--green-light:#dcfce7','--purple:#7c3aed','--purple-light:#ede9fe','--bg:#f8f7f4','--bg-2:#ffffff','--bg-3:#f1f0ec','--bg-4:#e8e6e0','--text:#111827','--text-2:#374151','--text-3:#6b7280','--text-4:#9ca3af','--border:rgba(0,0,0,0.07)','--border-strong:rgba(0,0,0,0.14)','--radius-sm:6px','--radius:10px','--radius-lg:16px','--radius-xl:20px','--shadow-sm:0 1px 3px rgba(0,0,0,0.08)','--shadow:0 4px 16px rgba(0,0,0,0.08)','--shadow-lg:0 12px 40px rgba(0,0,0,0.12)'].forEach(v=>check('var '+v.split(':')[0],cur.includes(v)));
check('font stack per spec',cur.includes("-apple-system,BlinkMacSystemFont,'Inter','SF Pro Text',sans-serif"));
check('page title 28px / 800 / -0.03em',cur.includes('fontSize:28,fontWeight:800')&&cur.includes("letterSpacing:'-0.03em'"));
check('tabular-nums utility',cur.includes('font-variant-numeric:tabular-nums'));
check('monospace utility (SF Mono / Fira Code)',cur.includes("'SF Mono','Fira Code'"));
check('sidebar 240px navy',cur.includes('width:240,background:\'var(--navy)\''));
check('sidebar logo: INCENTIVE over Manager + SVG clapper',cur.includes('>INCENTIVE<')&&cur.includes('>Manager<')&&cur.includes('function ClapperIcon'));
check('nav items 44px with teal left border on active',cur.includes('height:44')&&cur.includes("borderLeft:active?'3px solid var(--teal)'"));
check('step circles: teal fill + checkmark when done',cur.includes("done?'var(--teal)'")&&cur.includes('done?<CheckIcon'));
check('API pill Connected / Setup needed',cur.includes('● Connected')&&cur.includes('● Setup needed'));
check('sidebar footer: version + program list',cur.includes('v4.0 · CA · NY · NY Commercial'));
check('buttons: teal primary 10x20 + scale active',cur.includes("teal:{background:'var(--teal)',color:'#fff'}")&&cur.includes("padding:small?'7px 12px':'10px 20px'")&&cur.includes('transform:scale(0.98)'));
check('chips: QE teal-light / NQ red-light / Untagged amber-light / NR bg-3',cur.includes("teal:{bg:'var(--teal-light)',text:'var(--teal)'}")&&cur.includes("gray:{bg:'var(--bg-3)',text:'var(--text-3)'}"));
check('animated tab underline (TabBar)',cur.includes('function TabBar')&&cur.includes("transition:'left 0.25s ease,width 0.25s ease'"));
check('sticky table header + alternating rows',cur.includes('.sticky-th th{position:sticky')&&cur.includes("idx%2===1?'var(--bg-3)'"));
check('upload: full-width 120px drop zones, dashed→solid on dragover',cur.includes('minHeight:120')&&cur.includes("'2px solid var(--teal)':'2px dashed var(--border-strong)'")&&cur.includes('Drop file here or click to browse'));
check('upload: Ready badge on file cards',cur.includes('✓ Ready'));
check('map: prominent Auto-detect columns button',cur.includes('Auto-detect columns'));
check('map: mapping completeness progress bar',cur.includes('Mapping completeness'));
check('map: PREFERRED badge + green check on mapped dropdowns',cur.includes('>PREFERRED<')&&cur.includes('CheckIcon size={9}'));
check('AI hero before first run',cur.includes('Let Claude read every untagged line'));
check('warnings tab grouped into cards',cur.includes('more — filter the All Lines tab'));
check('projects: Your Projects hero + program cards + Start a project',cur.includes('Your Projects')&&cur.includes('Start a project →'));
check('projects: SVG clapperboard empty state',cur.includes('function ClapperEmpty'));
check('new project modal: program cards / segmented tier / pill type',cur.includes('function Segmented')&&cur.includes('function PillSelect')&&cur.includes("setForm(f=>({...f,state:k,ptype:''}))"));
check('onboarding: 4px solid teal progress bar',cur.includes("height:4,background:'var(--bg-strong)'")&&cur.includes("background:'var(--teal)',width:`${((step+1)/steps.length)*100}%`"));

console.log('\nFEATURE 1 — ATL cap calculator (NY only)');
check('computeAtlStats exists and panel renders',cur.includes('function computeAtlStats')&&cur.includes('ATL Cap Calculator — 40% Rule'));
check('panel rows: BTL / ATL / cap / overage / adjusted',cur.includes('Qualified BTL / other spend')&&cur.includes('ATL cap limit (40% of BTL)')&&cur.includes('ATL overage above cap')&&cur.includes('Adjusted qualified total'));
const atlSrc=cur.match(/function computeAtlStats\(lines,prog,stateCats\)\{[\s\S]*?\n\}/);
check('computeAtlStats extractable',!!atlSrc);
if(atlSrc){
  const sumAmt=arr=>arr.reduce((s,l)=>s+(Number(l.amount)||0),0);
  const fn=new Function('lines','prog','stateCats','sumAmt',atlSrc[0]+'\nreturn computeAtlStats(lines,prog,stateCats);');
  const cats={'Director (ATL)':{atl:true},'Crew':{}};
  const lines=[{qs:'QE',cat:'Director (ATL)',amount:50},{qs:'QE',cat:'Crew',amount:100},{qs:'NQ',cat:'Director (ATL)',amount:999}];
  const r=fn(lines,{atlCap:0.4},cats,sumAmt);
  check('math: BTL=100 ATL=50 cap=40 overage=10 adjusted=140',r.btlAmt===100&&r.atlAmt===50&&Math.abs(r.cap-40)<1e-9&&Math.abs(r.overage-10)<1e-9&&Math.abs(r.adjusted-140)<1e-9,JSON.stringify(r));
  const r2=fn(lines,{atlCap:null},cats,sumAmt);
  check('returns null for non-NY programs',r2===null);
}

console.log('\nFEATURE 2 — Qualification scorecard');
check('Qualification Health panel',cur.includes('Qualification Health'));
check('min-spend progress with green/amber/red',cur.includes('Minimum qualified spend')&&cur.includes("minMet?'var(--green)':qeTotal>=prog.minSpend*0.7?'var(--amber)':'var(--red)'"));
check('NY QPF flag',cur.includes('QPF requirement:'));
check('CA 75% test flag',cur.includes('75% test:'));
check('NY Commercial pool cap warning ($4M/$3M)',cur.includes('Pool cap warning:')&&cur.includes('$4M downstate / $3M upstate'));
check('Classify remaining shortcut → AI tab',cur.includes('Classify remaining →')&&cur.includes("onClick={()=>setTab('ai')}"));

console.log('\nFEATURE 3 — Smart category suggestions');
check('frequency analysis (no AI call)',cur.includes('function getCatSuggestions')&&cur.includes('Frequency analysis over this project'));
check('panel under row with top-3 clickable chips',cur.includes('Suggested categories')&&cur.includes('.slice(0,3)'));
const sugSrc=cur.match(/function getCatSuggestions\(line\)\{[\s\S]*?\n  \}/);
check('getCatSuggestions extractable',!!sugSrc);
if(sugSrc){
  const lines=[
    {id:'a',vendor:'CameraCo',memo:'lens rental'},
    {id:'b',vendor:'CameraCo',memo:'tripod kit',cat:'Equipment Rentals (NY vendor)'},
    {id:'c',vendor:'CameraCo',memo:'dolly',cat:'Equipment Rentals (NY vendor)'},
    {id:'d',vendor:'Other',memo:'lens cleaning kit',cat:'Production Supplies (NY)'},
    {id:'e',vendor:'X',memo:'catering week 2',cat:'Catering / Craft Services (NY)'},
  ];
  const fn=new Function('lines',sugSrc[0].replace(/^function getCatSuggestions/,'function getCatSuggestions')+'\nreturn getCatSuggestions(lines[0]);');
  const res=fn(lines);
  check('vendor match outranks memo-token match',res.length>=2&&res[0][0]==='Equipment Rentals (NY vendor)'&&res.some(([c])=>c==='Production Supplies (NY)'),JSON.stringify(res));
}

console.log('\nFEATURE 4 — Export package improvements');
check('Cover Sheet appended first',cur.indexOf("aoa_to_sheet(coverRows),'Cover Sheet')")<cur.indexOf('Summary`'));
check('cover: prepared by + disclaimer + key rules',cur.includes("['Prepared By',preparedBy")&&cur.includes('Prepared for review purposes. Consult a CPA before submission.')&&cur.includes("['KEY PROGRAM RULES']"));
check('renamed: QE Vendor Schedule',cur.includes("'QE Vendor Schedule')"));
check('renamed: NQ Vendor Schedule',cur.includes("'NQ Vendor Schedule')"));
check('renamed: Payroll Schedule',cur.includes("'Payroll Schedule')"));
check('Live Rules tab kept',cur.includes("'Live Rules')"));
check('old tab names gone',!cur.includes("'Qualified Vendor List'")&&!cur.includes("'Non-Qualified Vendor List'")&&!cur.includes("'Payroll Summary')"));
check('Confidence Summary column on QE tab only',cur.includes("qeHeaders=[...qvHeaders,'Confidence Summary']")&&cur.includes('const confSummary=l=>'));
check('NY ATL Cap Analysis tab',cur.includes("'ATL Cap Analysis')"));
check('existing summary sheet rows preserved',cur.includes('PRODUCTION ACCOUNTING SUMMARY')&&cur.includes("['QUALIFICATION SUMMARY','','']")&&cur.includes("['CATEGORY BREAKDOWN','','','']"));

console.log('\nFEATURE 5 — Required documents checklist');
check('checklist UI on export tab with manual checkboxes',cur.includes('Required documents — ')&&cur.includes('function toggleDoc')&&cur.includes('docChecklist'));
check('progress + readiness item',cur.includes('Required documents collected'));
check('exported as Document Checklist tab',cur.includes("'Document Checklist')")&&cur.includes("checklist[d]?'Collected':'Pending'"));

console.log('\nFEATURE 6 — Key rules panel (Step 1)');
check('collapsible Program Rules Summary with chevron',cur.includes('Program Rules Summary —')&&cur.includes('function Chevron')&&cur.includes('setRulesOpen'));
check('info banner: rate / min spend / ATL + 3 key bullets',cur.includes("['Credit rate',prog.rate,prog.rateNote]")&&cur.includes('keyRules||[]).slice(0,3)'));

console.log('\nREGRESSIONS — core logic still works');
const hintsMatch=cur.match(/const AUTO_HINTS=({[\s\S]*?\n});/);
const amMatch=cur.match(/function autoMap\(\)\{([\s\S]*?)\n  \}/);
check('AUTO_HINTS + autoMap intact',!!hintsMatch&&!!amMatch);
if(hintsMatch&&amMatch){
  const AUTO_HINTS=eval('('+hintsMatch[1]+')');
  const body=amMatch[1].replace(/setMaps\([\s\S]*?\);/,'').replace(/setMessage\([\s\S]*?\);/,'');
  const autoMap=new Function('tab','cols','AUTO_HINTS',body+'\nreturn nm;');
  const pay=autoMap('Payroll',['Date','Employee Name','Role','Department','SSN','NY Resident','Union Status','Regular Wages','OT Pay','Gross Pay','Fringes','Qual Tag'],AUTO_HINTS);
  check('payroll auto-detect: amount→Gross Pay, employee→Employee Name',pay.amount==='Gross Pay'&&pay.employee_name==='Employee Name'&&pay.residency==='NY Resident',JSON.stringify(pay));
  const gl=autoMap('GL',['Date','Account Number','Account Name','Vendor','Memo','Debit','Credit','Amount','Department','Qual Tag'],AUTO_HINTS);
  check('GL auto-detect maps all 10 fields',Object.keys(gl).length===10,JSON.stringify(gl));
}
check('processLines / per-upload map keys intact',cur.includes('maps[up.id]||maps.GL')&&cur.includes('maps[up.id]||maps.Payroll'));
check('new project: CA default + preparedBy + docChecklist fields',cur.includes("state:'CA',tier:")&&cur.includes("preparedBy:'',docChecklist:{}"));
check('no stale NJ defaults left',!cur.includes("state:'NJ'")&&!cur.includes('NJ Resident'));
check('formula-injection escape kept on export rows',cur.includes('function esc(v)')&&cur.includes('escRow(['));
check('runAI / approveHighConfidence / applyAISuggestion intact',cur.includes('async function runAI')&&cur.includes('function approveHighConfidence')&&cur.includes('function applyAISuggestion'));
check('manual override still strips pending-AI warning (3 sites)',(cur.match(/warnings:\(l\.warnings\|\|\[\]\)\.filter\(w=>w!=='Pending AI classification'\)/g)||[]).length>=3);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
