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

console.log('\nDESIGN SYSTEM — dark fintech theme');
['--bg:#050d1a','--bg-2:#0a1628','--bg-3:#0f1f38','--bg-4:#162540','--bg-card:rgba(255,255,255,0.04)','--bg-card-hover:rgba(255,255,255,0.07)','--bg-glass:rgba(13,28,52,0.85)','--navy:#050d1a','--blue:#2D7FF9','--blue-bright:#4d9fff','--blue-dim:rgba(45,127,249,0.15)','--blue-glow:rgba(45,127,249,0.35)','--teal:#00d4b4','--teal-dim:rgba(0,212,180,0.12)','--teal-glow:rgba(0,212,180,0.3)','--purple:#7c3aed','--purple-dim:rgba(124,58,237,0.15)','--amber:#f59e0b','--amber-dim:rgba(245,158,11,0.12)','--red:#ef4444','--red-dim:rgba(239,68,68,0.12)','--green:#10b981','--green-dim:rgba(16,185,129,0.12)','--text:#ffffff','--text-2:rgba(255,255,255,0.7)','--text-3:rgba(255,255,255,0.4)','--text-4:rgba(255,255,255,0.2)','--border:rgba(255,255,255,0.07)','--border-strong:rgba(255,255,255,0.14)','--border-blue:rgba(45,127,249,0.3)','--border-teal:rgba(0,212,180,0.3)','--shadow:0 8px 32px rgba(0,0,0,0.4)','--shadow-lg:0 20px 60px rgba(0,0,0,0.5)','--glow-blue:0 0 20px rgba(45,127,249,0.4), 0 0 60px rgba(45,127,249,0.15)','--glow-teal:0 0 20px rgba(0,212,180,0.4), 0 0 60px rgba(0,212,180,0.15)','--glow-sm:0 0 10px rgba(45,127,249,0.3)','--radius-sm:8px','--radius:14px','--radius-lg:20px','--radius-xl:28px'].forEach(v=>check('var '+v.split(':')[0],cur.includes(v)));
check('body: deep navy bg + dual radial gradients, fixed',cur.includes('radial-gradient(ellipse at 20% 20%, rgba(45,127,249,0.08)')&&cur.includes('radial-gradient(ellipse at 80% 80%, rgba(0,212,180,0.06)')&&cur.includes('background-attachment:fixed'));
check('glassmorphism cards: blur(12px) + bg-card + shadow',cur.includes("backdropFilter:'blur(12px)'")&&cur.includes("background:soft?'var(--bg-3)':'var(--bg-card)'")&&cur.includes("boxShadow:'var(--shadow)'"));
check('card hover: lift + bg-card-hover + shadow-lg',cur.includes('.card-hover:hover{background:var(--bg-card-hover)!important;border-color:var(--border-strong)!important;transform:translateY(-1px);box-shadow:var(--shadow-lg)!important}'));
check('section heads: rgba(255,255,255,0.03) + 10px tracked',cur.includes("padding:'12px 18px',background:'rgba(255,255,255,0.03)'")&&cur.includes("fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase'"));
check('sidebar: 240px navy gradient + right border',cur.includes("background:'linear-gradient(180deg, #0a1628 0%, #050d1a 100%)',borderRight:'1px solid var(--border)'"));
check('sidebar logo: blue clapper + INCENTIVE 9px + Manager 18px',cur.includes("color='var(--blue-bright)'")&&cur.includes('fontSize:9,')&&cur.includes('fontSize:18,fontWeight:800'));
check('nav 42px: blue-dim active + 2px blue border + inset glow',cur.includes('height:42')&&cur.includes("background:active?'var(--blue-dim)'")&&cur.includes("borderLeft:active?'2px solid var(--blue)'")&&cur.includes("inset 0 0 20px rgba(45,127,249,0.05)"));
check('step circles: outline inactive / blue+glow active / teal+check done',cur.includes("done?'var(--teal)':active?'var(--blue)':'transparent'")&&cur.includes("done?<CheckIcon size={10} color=\"var(--bg)\"/>:s.n")&&cur.includes("boxShadow:active&&!done?'var(--glow-sm)'"));
check('API pill: teal glow Connected / amber Setup needed',cur.includes('● Connected')&&cur.includes('● Setup needed')&&cur.includes("textShadow:'0 0 12px rgba(0,212,180,0.5)'"));
check('buttons: blue gradient primary + glow, teal gradient, glass secondary',cur.includes("background:'linear-gradient(135deg, #2D7FF9 0%, #1a6ce8 100%)'")&&cur.includes("background:'linear-gradient(135deg, #00d4b4 0%, #00b89c 100%)'")&&cur.includes("secondary:{background:'transparent',color:'var(--text-2)',border:'1px solid var(--border-strong)'}"));
check('button hovers: stronger glow CSS + scale(0.97) active',cur.includes('0 0 30px rgba(45,127,249,0.6), 0 0 80px rgba(45,127,249,0.2)')&&cur.includes('transform:scale(0.97)'));
check('chips: QE teal-dim+border, NQ red-dim, Untagged amber-dim, NR gray',cur.includes("teal:{bg:'var(--teal-dim)',text:'var(--teal)',border:'var(--border-teal)'}")&&cur.includes("red:{bg:'var(--red-dim)',text:'var(--red)'")&&cur.includes("amber:{bg:'var(--amber-dim)',text:'var(--amber)'")&&cur.includes("gray:{bg:'rgba(255,255,255,0.06)',text:'var(--text-3)'"));
check('stat tiles: gradient top accent + glowing number',cur.includes('linear-gradient(90deg, transparent, ${color')&&cur.includes('textShadow:glow?`0 0 24px ${glow}`'));
check('tables: 0.03 header, 0.02 alternating, hover 0.03',cur.includes("background:'rgba(255,255,255,0.03)',borderBottom:'1px solid var(--border)'")&&cur.includes("background:idx%2===1?'rgba(255,255,255,0.02)':'transparent'")&&cur.includes('tr.row-hover:hover{background:rgba(255,255,255,0.03)!important}'));
check('inputs: bg-3 + blue focus ring, password glow',cur.includes("background:'var(--bg-3)',border:'1px solid var(--border-strong)'")&&cur.includes('box-shadow:0 0 0 3px rgba(45,127,249,0.15)')&&cur.includes('input[type=password]:focus{box-shadow:0 0 0 3px rgba(45,127,249,0.2), 0 0 20px rgba(45,127,249,0.1)}'));
check('alerts: blue-bright info / dim tints',cur.includes("info:{bg:'rgba(45,127,249,0.08)',border:'rgba(45,127,249,0.2)',text:'var(--blue-bright)'"));
check('AI progress: gradient fill + shimmer keyframes',cur.includes("color='linear-gradient(90deg, var(--blue), var(--teal))'")&&cur.includes('@keyframes shimmer')&&cur.includes('<ProgressBar pct={aiProgress} height={6} animated/>'));
check('live rules panel: 3px blue left border + teal complete badge + blue links',cur.includes("borderLeft:'3px solid var(--blue)'")&&cur.includes("liveRules.error?'amber':'teal'")&&cur.includes("fontSize:11,color:'var(--blue-bright)',fontWeight:600"));
check('scrollbars: 4px rounded translucent',cur.includes('::-webkit-scrollbar{width:4px;height:4px}')&&cur.includes('background:rgba(255,255,255,0.1);border-radius:999px'));
check('upload drop zones: glass + blue dragover glow',cur.includes("border:active?'2px solid var(--blue)':'2px dashed var(--border-strong)'")&&cur.includes("background:active?'var(--blue-dim)':'var(--bg-card)'")&&cur.includes("boxShadow:active?'var(--glow-blue)'"));
check('file cards: green accent border + teal Ready chip',cur.includes("borderLeft:'3px solid rgba(16,185,129,0.35)'")&&cur.includes('<Chip color="teal" small>✓ Ready</Chip>'));
check('rules panel: blue left accent + chevron',cur.includes("borderLeft:'3px solid var(--border-blue)'")&&cur.includes('Program Rules Summary —'));
check('program cards: accent line + selected accent glow',cur.includes("PROGRAM_ACCENT={CA:'#f59e0b',NY:'#2D7FF9',NY_COMMERCIAL:'#00d4b4'}")&&cur.includes('boxShadow:sel?`0 0 20px ${PROGRAM_ACCENT[k]}40`'));
check('empty state: blue glowing clapper SVG',cur.includes("filter:'drop-shadow(0 0 18px rgba(45,127,249,0.45))'"));
check('tab underline: blue + glow, animated',cur.includes("background:'var(--blue)',boxShadow:'var(--glow-sm)',transition:'left 0.25s ease,width 0.25s ease'"));
check('welcome modal: dark gradient container + blue glow + blurred overlay',cur.includes("background:'linear-gradient(135deg, #0a1628 0%, #0f1f38 100%)'")&&cur.includes("boxShadow:'var(--shadow-lg), var(--glow-blue)'")&&cur.includes("background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'"));
check('welcome: 3px blue→teal progress + emoji radial glow + teal success card',cur.includes("height:3,background:'rgba(255,255,255,0.08)'")&&cur.includes("background:'linear-gradient(90deg, var(--blue), var(--teal))'")&&cur.includes("radial-gradient(circle, rgba(45,127,249,0.15) 0%, transparent 70%)")&&cur.includes("background:'linear-gradient(135deg, rgba(0,212,180,0.1), rgba(16,185,129,0.05))'"));
check('topbar: glass with blur',cur.includes("background:'var(--bg-glass)',backdropFilter:'blur(12px)'"));
check('no light-theme tokens remain',!['#f8f7f4','#f1f0ec','#e8e6e0','#e8edf6','#0d9488','#ccfbf1','#111827'].some(t=>cur.includes(t)));

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
