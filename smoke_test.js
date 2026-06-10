// Smoke test: extracts the real logic out of index.html and runs it.
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
let pass=0,fail=0;
function check(name,cond,detail){
  if(cond){pass++;console.log('  PASS  '+name);}
  else{fail++;console.log('  FAIL  '+name+(detail?' — '+detail:''));}
}

// ── extract AUTO_HINTS literal ──
const hintsMatch=src.match(/const AUTO_HINTS=({[\s\S]*?\n});/);
if(!hintsMatch)throw new Error('AUTO_HINTS not found');
const AUTO_HINTS=eval('('+hintsMatch[1]+')');

// ── extract autoMap body and turn it into a pure function ──
const amMatch=src.match(/function autoMap\(\)\{([\s\S]*?)\n  \}/);
if(!amMatch)throw new Error('autoMap not found');
let body=amMatch[1]
  .replace(/setMaps\([\s\S]*?\);/,'')
  .replace(/setMessage\([\s\S]*?\);/,'');
const autoMap=new Function('tab','cols','AUTO_HINTS',body+'\nreturn nm;');

// ── extract getUploadIssues and make it callable ──
const guiMatch=src.match(/function getUploadIssues\(type,upload,map\)\{([\s\S]*?)\n  \}/);
if(!guiMatch)throw new Error('getUploadIssues not found');
const getUploadIssues=new Function('type','upload','map',guiMatch[1]);

// ── Bug 1: auto-detect ──
console.log('\nBUG 1 — auto-detect per tab');
const GL_COLS=['Date','Account Number','Account Name','Vendor','Invoice #','Memo','Department','Debit','Credit','Amount','Qual Tag'];
const PAY_COLS=['Date','Employee Name','Role','Department','SSN','NY Resident','Union Status','Regular Wages','OT Pay','Gross Pay','Fringes','Qual Tag'];

const glMap=autoMap('GL',GL_COLS,AUTO_HINTS);
const glExpected={date:'Date',account_number:'Account Number',account_name:'Account Name',vendor:'Vendor',memo:'Memo',amount:'Amount',debit:'Debit',credit:'Credit',department:'Department',qual_tag:'Qual Tag'};
check('GL maps all 10 fields',Object.keys(glMap).length===10,'got '+Object.keys(glMap).length+': '+JSON.stringify(glMap));
for(const[k,v]of Object.entries(glExpected))check(`GL ${k} -> ${v}`,glMap[k]===v,'got '+glMap[k]);

const payMap=autoMap('Payroll',PAY_COLS,AUTO_HINTS);
const payExpected={employee_name:'Employee Name',amount:'Gross Pay',department:'Department',date:'Date',residency:'NY Resident',qual_tag:'Qual Tag'};
for(const[k,v]of Object.entries(payExpected))check(`Payroll ${k} -> ${v}`,payMap[k]===v,'got '+payMap[k]);

// ── Bug 1: validation reads per-upload map keys ──
console.log('\nBUG 1 — validation per upload');
const fakeRows=[{x:1}];
const glIssues=getUploadIssues('GL',{rows:fakeRows},glMap);
const payIssues=getUploadIssues('Payroll',{rows:fakeRows},payMap);
check('GL upload: no validation issues',glIssues.length===0,JSON.stringify(glIssues));
check('Payroll upload: no validation issues',payIssues.length===0,JSON.stringify(payIssues));
const emptyIssues=getUploadIssues('Payroll',{rows:fakeRows},{});
check('Unmapped payroll still flags both required fields',emptyIssues.includes('Map Employee Name')&&emptyIssues.includes('Map Payroll Amount'),JSON.stringify(emptyIssues));
// processLines must read maps[up.id] (per-upload), not a hardcoded GL map
check('processLines payroll branch reads maps[up.id]||maps.Payroll',/payUploads\.forEach\(up=>\{\s*const m=maps\[up\.id\]\|\|maps\.Payroll\|\|\{\};/.test(src));

// ── Bug 2: no output_config, robust JSON extraction, schema described in prompt ──
console.log('\nBUG 2 — AI request format');
check('no output_config anywhere',!src.includes('output_config'));
check('no json_schema anywhere',!src.includes('json_schema'));
check('prompt spells out the JSON shape',src.includes('{"results":[{"line":1,"tag":"QE","confidence":"high"'));
check('prompt no longer references a non-existent provided schema',!src.includes('matching the provided schema'));
check('extraction finds outermost { }',src.includes("rawText.indexOf('{')")&&src.includes("rawText.lastIndexOf('}')"));
check('extraction falls back to [ ]',src.includes("rawText.indexOf('[')")&&src.includes("rawText.lastIndexOf(']')"));
check('trailing-comma repair present',src.includes("replace(/,\\s*([\\]}])/g,'$1')"));
check('tag validated against QE/NQ/NR',src.includes("['QE','NQ','NR'].includes(r.tag)"));
check('confidence validated',src.includes("['high','medium','low'].includes(r.confidence)"));
check('category validated against state list',src.includes('categoryNames.includes(r.category)'));
// run the actual extraction logic against a messy response
const exMatch=src.match(/const tryParse=[\s\S]*?const items=Array\.isArray\(parsed\?\.results\)\?parsed\.results:\[\];/);
check('extraction block found for direct execution',!!exMatch);
if(exMatch){
  const runExtract=new Function('rawText',exMatch[0].replace(/const items=/,'return '));
  const messy='Here you go:\n```json\n{"results":[{"line":1,"tag":"QE","confidence":"high","category":"","reason":"NJ vendor"},]}\n```';
  const items=runExtract(messy);
  check('messy fenced JSON with trailing comma parses',Array.isArray(items)&&items.length===1&&items[0].tag==='QE');
  const bare='[{"line":1,"tag":"NQ","confidence":"low","category":"","reason":"x"}]';
  const items2=runExtract(bare);
  check('bare array response parses via fallback',Array.isArray(items2)&&items2.length===1&&items2[0].tag==='NQ');
}

// ── Bug 3: NY dual-program prompt ──
console.log('\nBUG 3 — NY live-rules prompt');
check("fetchLiveRules branches on stateAbbr==='NY'",src.includes("const isNY=stateAbbr==='NY'"));
check('covers Commercial Production Tax Credit',src.includes('NY Commercial Production Tax Credit'));
check('20% downstate / 30% upstate',src.includes('downstate 20% / upstate 30%'));
check('excludes directors/writers/principal performers',src.includes('commercials exclude directors, writers, and principal performers'));
check('background extras note',src.includes('only background extras qualify'));

// ── Bug 4: clamp on tab switch ──
console.log('\nBUG 4 — activeUploadIdx clamp');
check('useEffect clamps idx on tab/uploads change',/useEffect\(\(\)=>\{\s*setActiveUploadIdx\(idx=>activeUploads\.length===0\?0:Math\.min\(idx,activeUploads\.length-1\)\);\s*\},\[tab,activeUploads\.length\]\);/.test(src));

// ── Bug 5: removeUpload cascades ──
console.log('\nBUG 5 — removeUpload cascade');
check('orphaned mapping keys removed',src.includes('const cleanedMappings={}')&&src.includes('else if(remainingIds.has(k))cleanedMappings[k]=v;'));
check('exports marked stale',src.includes("const stalledExports=(project.exports||[]).map(e=>({...e,stale:true}));"));
check('cascade written back to project',src.includes('mappings:cleanedMappings,exports:stalledExports'));

// ── Bug 6: vendor index rebuilt from scratch ──
console.log('\nBUG 6 — vendor rebuild');
check('vendors rebuilt from scratch (no {...project.vendors} merge)',src.includes('const vendors={};')&&!/vendors=\{\.\.\.project\.vendors/.test(src));
check('existing status carried over',src.includes("status:existing?.status||''"));

// ── Bug 7: AI tab override strips pending warning ──
console.log('\nBUG 7 — AI tab manual override');
const overrideCount=(src.match(/qs_src:'Manual override',warnings:\(l\.warnings\|\|\[\]\)\.filter\(w=>w!=='Pending AI classification'\)/g)||[]).length;
check('AI tab + All Lines tab overrides both strip the warning (2 sites)',overrideCount===2,'found '+overrideCount);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
