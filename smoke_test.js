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

console.log('\nDESIGN SYSTEM — world-class fintech theme (Task 4)');
['--bg:#080c14','--bg-2:#0d1420','--bg-3:#111a2c','--bg-4:#172035','--bg-card:rgba(255,255,255,0.035)','--bg-hover:rgba(255,255,255,0.055)','--bg-glass:rgba(13,20,32,0.85)','--blue:#3b82f6','--blue-bright:#60a5fa','--blue-dim:rgba(59,130,246,0.12)','--blue-glow:rgba(59,130,246,0.25)','--teal:#06b6d4','--teal-bright:#22d3ee','--teal-dim:rgba(6,182,212,0.10)','--teal-glow:rgba(6,182,212,0.25)','--violet:#8b5cf6','--violet-dim:rgba(139,92,246,0.12)','--violet-glow:rgba(139,92,246,0.25)','--emerald:#10b981','--emerald-dim:rgba(16,185,129,0.10)','--amber:#f59e0b','--amber-dim:rgba(245,158,11,0.10)','--rose:#f43f5e','--rose-dim:rgba(244,63,94,0.10)','--text:#f1f5f9','--text-2:rgba(241,245,249,0.65)','--text-3:rgba(241,245,249,0.38)','--text-4:rgba(241,245,249,0.18)','--border:rgba(255,255,255,0.06)','--border-2:rgba(255,255,255,0.10)','--border-blue:rgba(59,130,246,0.35)','--border-teal:rgba(6,182,212,0.35)','--shadow:0 4px 24px rgba(0,0,0,0.35)','--shadow-lg:0 16px 64px rgba(0,0,0,0.5)','--shadow-xl:0 32px 96px rgba(0,0,0,0.6)','--glow-blue:0 0 24px rgba(59,130,246,0.35), 0 0 64px rgba(59,130,246,0.12)','--glow-teal:0 0 24px rgba(6,182,212,0.35), 0 0 64px rgba(6,182,212,0.12)','--glow-violet:0 0 24px rgba(139,92,246,0.35), 0 0 64px rgba(139,92,246,0.12)','--r-sm:6px','--r:12px','--r-lg:18px','--r-xl:24px','--r-2xl:32px'].forEach(v=>check('var '+v.split(':')[0],cur.includes(v)));
check('legacy CSS variable aliases preserved (--navy, --purple-dim, --red, --green, --radius, --glow-sm, etc.)',cur.includes('--navy:#080c14')&&cur.includes("--purple-dim:var(--violet-dim)")&&cur.includes('--red:var(--rose)')&&cur.includes('--green:var(--emerald)')&&cur.includes('--radius:var(--r)')&&cur.includes('--glow-sm:0 0 12px var(--blue-glow)'));
check('body: 3 radial gradients (blue/teal/violet) + fixed background',cur.includes('radial-gradient(ellipse 80% 50% at 15% 10%, rgba(59,130,246,0.07)')&&cur.includes('radial-gradient(ellipse 60% 40% at 85% 85%, rgba(6,182,212,0.05)')&&cur.includes('radial-gradient(ellipse 40% 30% at 50% 50%, rgba(139,92,246,0.03)')&&cur.includes('background-attachment:fixed'));
check('startup chime: Web Audio API, sessionStorage gate, fail-silent',cur.includes("filmtax_chime_played")&&cur.includes('AudioContext||window.webkitAudioContext')&&cur.includes('createConvolver')&&cur.includes('261.63')&&cur.includes('329.63')&&cur.includes('392.0')&&cur.includes("master.gain.value=0.12"));
check('glassmorphism cards: blur(12px) + bg-card + shadow',cur.includes("backdropFilter:'blur(12px)'")&&cur.includes("background:soft?'var(--bg-3)':'var(--bg-card)'")&&cur.includes("boxShadow:'var(--shadow)'"));
check('card hover: lift + bg-hover + shadow-lg',cur.includes('.card-hover:hover{background:var(--bg-hover)!important;border-color:var(--border-2)!important;transform:translateY(-1px);box-shadow:var(--shadow-lg)!important}'));
check('section heads: rgba(255,255,255,0.03) + 10px tracked',cur.includes("padding:'12px 18px',background:'rgba(255,255,255,0.03)'")&&cur.includes("fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase'"));
check('sidebar: 232px gradient + blur(20px) + clapperboard logo + INCENTIVE/Manager labels',cur.includes('width:232,background:\'linear-gradient(180deg, rgba(13,20,32,0.95) 0%, rgba(8,12,20,0.98) 100%)\'')&&cur.includes("WebkitBackdropFilter:'blur(20px)'")&&cur.includes("INCENTIVE")&&cur.includes("fontSize:18,fontWeight:800,color:'var(--text)',letterSpacing:'-0.02em',lineHeight:1}}>Manager"));
check('sidebar nav: 40px items with GridIcon/SparkIcon, blue-dim active state',cur.includes('height:40,padding:active')&&cur.includes("background:active?'var(--blue-dim)'")&&cur.includes('<GridIcon/> All Projects')&&cur.includes('<SparkIcon/>'));
check('step circles: 18x18, done=emerald+check, active=blue+glow',cur.includes("width:18,height:18,borderRadius:'50%'")&&cur.includes("background:done?'var(--emerald)':active?'var(--blue)':'transparent'")&&cur.includes('<CheckIcon size={11} color="var(--bg)"/>')&&cur.includes("boxShadow:active&&!done?'0 0 12px var(--blue-glow)'"));
check('API status pill: emerald Connected / amber Setup needed + version string',cur.includes('Connected</span>')&&cur.includes('Setup needed</span>')&&cur.includes('v2.0 — CA · NY · NY-C'));
check('buttons: blue/teal/violet gradients with glow + 9px 18px padding',cur.includes("background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'")&&cur.includes("background:'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'")&&cur.includes("background:'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'")&&cur.includes("padding:small?'7px 12px':'9px 18px'"));
check('button hover/active CSS: glow on hover + scale(0.97) active',cur.includes('.btn-primary:hover:not(:disabled){filter:brightness(1.1);box-shadow:0 1px 2px rgba(0,0,0,0.3), 0 0 32px rgba(59,130,246,0.5), 0 0 80px rgba(59,130,246,0.2)!important}')&&cur.includes('transform:scale(0.97)'));
check('chips: teal/rose/amber/gray palettes use new tokens',cur.includes("teal:{bg:'var(--teal-dim)',text:'var(--teal)',border:'var(--border-teal)'}")&&cur.includes("gray:{bg:'rgba(255,255,255,0.06)',text:'var(--text-3)'"));
check('stat tiles: gradient top accent + blurred glow blob',cur.includes('linear-gradient(90deg, transparent, ${color')&&cur.includes("{glow&&<div aria-hidden=\"true\" style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:glow,filter:'blur(24px)',opacity:0.3"));
check('tables: 0.03 header, 0.02 alternating, sticky-th + row-hover',cur.includes("background:'rgba(255,255,255,0.03)',borderBottom:'1px solid var(--border)'")&&cur.includes("background:idx%2===1?'rgba(255,255,255,0.02)':'transparent'")&&cur.includes('tr.row-hover:hover{background:rgba(255,255,255,0.025)!important}')&&cur.includes('.sticky-th th{position:sticky'));
check('inputs: blue focus ring, password teal glow',cur.includes('input:focus,select:focus,textarea:focus{border-color:var(--blue)!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)}')&&cur.includes('input[type=password]:focus{border-color:var(--teal)!important;box-shadow:0 0 0 3px rgba(6,182,212,0.15), 0 0 20px rgba(6,182,212,0.08)}'));
check('alerts: SVG AlertIcon + info/success/warning/error tints',cur.includes('function AlertIcon')&&cur.includes("info:{bg:'rgba(59,130,246,0.06)',border:'rgba(59,130,246,0.18)',text:'var(--blue-bright)'")&&cur.includes("success:{bg:'var(--emerald-dim)'")&&cur.includes('<AlertIcon type={type} color={s.text}/>'));
check('AI progress: gradient fill + shimmer keyframes',cur.includes("color='linear-gradient(90deg, var(--blue), var(--teal))'")&&cur.includes('@keyframes shimmer')&&cur.includes('<ProgressBar pct={aiProgress} height={6} animated/>'));
check('live rules panel: 3px blue left border + teal complete badge + LinkIcon sources',cur.includes("borderLeft:'3px solid var(--blue)'")&&cur.includes("liveRules.error?'amber':'teal'")&&cur.includes('<LinkIcon/>'));
check('scrollbars: 4px rounded translucent',cur.includes('::-webkit-scrollbar{width:4px;height:4px}')&&cur.includes('background:rgba(255,255,255,0.08);border-radius:999px'));
check('upload drop zones: 100px, blue dragover, emerald done state, FileTypeIcon',cur.includes('minHeight:100')&&cur.includes("border:active?'1.5px solid var(--blue)':done?'1.5px solid rgba(16,185,129,0.3)'")&&cur.includes('function FileTypeIcon'));
check('uploaded-file Ready chip uses CheckIcon (no emoji)',cur.includes('<Chip color="teal" small><CheckIcon size={9} color="var(--teal)"/> Ready</Chip>'));
check('rules panel: blue left accent + chevron',cur.includes("borderLeft:'3px solid var(--border-blue)'")&&cur.includes('Program Rules Summary —'));
check('program cards: CA amber / NY blue / NY-C teal accent + selected glow',cur.includes("PROGRAM_ACCENT={CA:'#fbbf24',NY:'#3b82f6',NY_COMMERCIAL:'#06b6d4'}")&&cur.includes('boxShadow:sel?`0 0 20px ${PROGRAM_ACCENT[k]}40`'));
check('empty state: 48px blue clapper SVG at opacity 0.5',cur.includes('function ClapperEmpty')&&cur.includes('width="48" height="48"')&&cur.includes("display:'inline-flex',opacity:0.5"));
check('tab underline: blue + glow, animated',cur.includes("background:'var(--blue)',boxShadow:'var(--glow-sm)',transition:'left 0.25s ease,width 0.25s ease'"));
check('ATL Cap Calculator: 3-column BTL/ATL/Cap layout with rose overage',cur.includes("['BTL Qualified',fmt(atlStats.btlAmt)")&&cur.includes("['ATL Spend',fmt(atlStats.atlAmt)")&&cur.includes("['Cap Limit (40%)',fmt(atlStats.cap)")&&cur.includes("atlStats.overage>0?'var(--rose)'"));
check('AI Review hero: glass card with violet left border',cur.includes("border:'1px solid var(--border)',borderLeft:'3px solid var(--violet)'")&&cur.includes('<GlobeIcon/> Check Live Rules + Classify Lines'));
check('welcome modal: deep navy gradient container + blue glow + blurred overlay',cur.includes("background:'linear-gradient(160deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)'")&&cur.includes("boxShadow:'var(--shadow-xl), var(--glow-blue)'")&&cur.includes("background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'"));
check('welcome: 3px blue→teal progress + step-specific emoji glow + teal/emerald success card',cur.includes("height:3,background:'rgba(255,255,255,0.08)'")&&cur.includes("background:'linear-gradient(90deg, var(--blue), var(--teal))'")&&cur.includes("step===0?'radial-gradient(circle, var(--blue-glow) 0%, transparent 70%)'")&&cur.includes("background:'linear-gradient(135deg, var(--teal-dim), var(--emerald-dim))'"));
check('welcome step-3 celebration emoji kept (🎉) inside guarded onboarding modal',cur.includes('🎉'));
check('topbar: 52px, blur(20px), rgba(8,12,20,0.8), padding 0 28px',cur.includes("height:52,padding:'0 28px'")&&cur.includes("background:'rgba(8,12,20,0.8)'")&&cur.includes("WebkitBackdropFilter:'blur(20px)'"));
check('no light-theme tokens remain',!['#f8f7f4','#f1f0ec','#e8e6e0','#e8edf6','#0d9488','#ccfbf1','#111827'].some(t=>cur.includes(t)));

console.log('\nDESIGN SYSTEM — no stray emoji outside guarded onboarding modal (Task 4)');
{
  // Strip the byte-identical guarded WelcomeModal block (slice_b) before scanning for emoji.
  const wmStart=cur.indexOf('// ─── WELCOME / ONBOARDING MODAL');
  const wmEnd=cur.indexOf('// ─── SETTINGS PAGE');
  check('WelcomeModal block located for emoji scan',wmStart!==-1&&wmEnd!==-1&&wmEnd>wmStart);
  const outsideWelcome=cur.slice(0,wmStart)+cur.slice(wmEnd);
  // Excludes typographic glyphs intentionally retained app-wide: ✓ (U+2713) ✕ (U+2715), arrows, etc.
  const emojiPattern=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{2712}\u{2714}\u{2716}-\u{27BF}\u{2B00}-\u{2BFF}️]/u;
  const m=outsideWelcome.match(emojiPattern);
  check('no emoji glyphs outside the onboarding modal',!m,m&&`found ${JSON.stringify(m[0])} near index ${m.index}`);
}

console.log('\nFEATURE 1 — ATL cap calculator (NY only)');
check('computeAtlStats exists and panel renders',cur.includes('function computeAtlStats')&&cur.includes('ATL Cap Calculator — 40% Rule'));
check('panel rows: BTL / ATL / cap / overage / adjusted',cur.includes("['BTL Qualified',fmt(atlStats.btlAmt)")&&cur.includes("['ATL Spend',fmt(atlStats.atlAmt)")&&cur.includes("['Cap Limit (40%)',fmt(atlStats.cap)")&&cur.includes('Overage: {fmt(atlStats.overage)}')&&cur.includes('Adjusted qualified total'));
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
