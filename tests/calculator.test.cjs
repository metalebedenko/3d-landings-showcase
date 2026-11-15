'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
// Run from any working directory: node tests/calculator.test.cjs
const base=path.resolve(__dirname,'..');
const html=fs.readFileSync(base+'/sites/silikonforms/calc/kalkulyator.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(scripts.length,2);
const context=vm.createContext({window:{},ArrayBuffer,DataView,TextDecoder,Map});
vm.runInContext(scripts[0]+scripts[1].split('// UI binding starts here.')[0]+';globalThis.api={parseSTL,estimatePrice,shapeVolume,LIMITS};',context,{timeout:5000});
const {parseSTL,estimatePrice,shapeVolume,LIMITS}=context.api;
const results=[];
function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',message:String(error.message)});}}
function fails(fn){assert.throws(fn);}
const vertices=[[0,0,0],[10,0,0],[10,10,0],[0,10,0],[0,0,10],[10,0,10],[10,10,10],[0,10,10]];
const faces=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]].map(face=>face.flatMap(index=>vertices[index]));
function binary(triangles=faces){const b=new ArrayBuffer(84+triangles.length*50),view=new DataView(b);view.setUint32(80,triangles.length,true);triangles.forEach((f,i)=>f.forEach((v,j)=>view.setFloat32(84+i*50+12+j*4,v,true)));return b;}
function ascii(triangles=faces,format=String){return 'solid cube\n'+triangles.map(t=>'facet normal 0 0 0\nouter loop\n'+[0,3,6].map(i=>'vertex '+t.slice(i,i+3).map(format).join(' ')).join('\n')+'\nendloop\nendfacet').join('\n')+'\nendsolid cube\n';}
function bytes(s){return new TextEncoder().encode(s).buffer;}
const approx=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
test('Binary closed cube volume and dimensions',()=>{const result=parseSTL(binary());approx(result.volCm3,1);assert.deepEqual(Array.from(result.dims),[10,10,10]);assert.equal(result.tris,12);});
test('ASCII closed cube volume',()=>approx(parseSTL(bytes(ascii())).volCm3,1));
test('ASCII signed scientific notation',()=>approx(parseSTL(bytes(ascii(faces,n=>'+'+n+'e0'))).volCm3,1));
test('Binary solid-prefixed header stays binary',()=>{const b=binary();new Uint8Array(b).set(new TextEncoder().encode('solid misleading header'));approx(parseSTL(b).volCm3,1);});
test('Large coordinate translation preserves volume',()=>approx(parseSTL(binary(faces.map(f=>f.map(x=>x+100000)))).volCm3,1));
test('Reverse entire winding remains valid',()=>approx(parseSTL(binary(faces.map(t=>[...t.slice(0,3),...t.slice(6,9),...t.slice(3,6)]))).volCm3,1));
test('Open surface rejected',()=>fails(()=>parseSTL(binary(faces.slice(1)))));
test('One reversed triangle rejected',()=>{const f=faces.map(t=>t.slice());f[0]=[...f[0].slice(0,3),...f[0].slice(6,9),...f[0].slice(3,6)];fails(()=>parseSTL(binary(f)));});
test('Disconnected closed shells rejected',()=>fails(()=>parseSTL(binary([...faces,...faces.map(f=>f.map(x=>x+100))]))));
test('Duplicate nonmanifold faces rejected',()=>fails(()=>parseSTL(binary([...faces,faces[0]]))));
test('Degenerate face rejected',()=>{const f=faces.map(t=>t.slice());f[0]=Array(9).fill(0);fails(()=>parseSTL(binary(f)));});
test('Binary NaN coordinates rejected',()=>{const b=binary();new DataView(b).setFloat32(96,NaN,true);fails(()=>parseSTL(b));});
test('Binary infinity coordinates rejected',()=>{const b=binary();new DataView(b).setFloat32(96,Infinity,true);fails(()=>parseSTL(b));});
test('Binary nonfinite normal rejected',()=>{const b=binary();new DataView(b).setFloat32(84,Infinity,true);fails(()=>parseSTL(b));});
test('Coordinate bounds enforced',()=>fails(()=>parseSTL(binary(faces.map(t=>t.map(v=>v+LIMITS.coordinate+100))))));
test('Truncated binary rejected',()=>fails(()=>parseSTL(binary().slice(0,-1))));
test('Binary trailing bytes rejected',()=>{const old=binary(),b=new ArrayBuffer(old.byteLength+1);new Uint8Array(b).set(new Uint8Array(old));fails(()=>parseSTL(b));});
test('Mismatched binary declared count rejected',()=>{const b=binary();new DataView(b).setUint32(80,100,true);fails(()=>parseSTL(b));});
test('Empty binary mesh rejected',()=>fails(()=>parseSTL(binary([]))));
test('File bound checked before parsing',()=>fails(()=>parseSTL(new ArrayBuffer(LIMITS.fileBytes+1))));
test('Triangle cap checked before vertices',()=>{const n=LIMITS.triangles+1,b=new ArrayBuffer(84+50*n);new DataView(b).setUint32(80,n,true);fails(()=>parseSTL(b));});
test('ASCII missing endsolid rejected',()=>fails(()=>parseSTL(bytes(ascii().replace('endsolid cube','')))));
test('ASCII incomplete facet rejected',()=>fails(()=>parseSTL(bytes(ascii().replace('endloop\nendfacet','endfacet')))));
test('ASCII incomplete numeric token rejected',()=>fails(()=>parseSTL(bytes(ascii().replace('vertex 0 0 0','vertex 0 0 1.2.3')))));
test('ASCII nonfinite exponent rejected',()=>fails(()=>parseSTL(bytes(ascii().replace('vertex 0 0 0','vertex 0 0 1e999')))));
test('ASCII NaN token rejected',()=>fails(()=>parseSTL(bytes(ascii().replace('vertex 0 0 0','vertex 0 0 NaN')))));
test('ASCII trailing second solid rejected',()=>fails(()=>parseSTL(bytes(ascii()+ascii()))));
test('ASCII giant line rejected',()=>fails(()=>parseSTL(bytes('solid '+ 'a'.repeat(2000)+'\n'+ascii()))));
test('ASCII line cap enforced',()=>fails(()=>parseSTL(bytes('\n'.repeat(LIMITS.triangles*8+11)+ascii()))));
const regular={tech:'SLS',material:'Полиамид',volume:50,rate:100,complexity:'Простая',urgency:'Стандарт',fill:100,hours:0,quantity:30,size:'до 100 мм',hasMaster:false,masterMode:'fixed',scan:false,reverse:false};
test('Demo default total',()=>assert.equal(estimatePrice(regular).total,5000));
test('Zero volume does not produce minimum quote',()=>fails(()=>estimatePrice({...regular,volume:0})));
test('Negative volume rejected',()=>fails(()=>estimatePrice({...regular,volume:-1})));
test('NaN volume rejected',()=>fails(()=>estimatePrice({...regular,volume:NaN})));
test('Infinite rate rejected',()=>fails(()=>estimatePrice({...regular,rate:Infinity})));
test('Zero rate rejected',()=>fails(()=>estimatePrice({...regular,rate:0})));
test('Negative postprocessing rejected',()=>fails(()=>estimatePrice({...regular,hours:-10})));
test('Out of range fill rejected instead of silently clamped',()=>fails(()=>estimatePrice({...regular,fill:150})));
test('Unknown material rejected',()=>fails(()=>estimatePrice({...regular,material:'__proto__'})));
test('Unknown coefficient rejected',()=>fails(()=>estimatePrice({...regular,complexity:'__proto__'})));
test('Total arithmetic bound enforced',()=>fails(()=>estimatePrice({...regular,volume:1000000,rate:1000000,complexity:'Сложная',urgency:'Срочно (×1.5)'})));
const cast={...regular,tech:'Литьё в силикон',material:'Стандартный ПУ',rate:12};
test('Casting per-piece includes addons',()=>{const r=estimatePrice({...cast,scan:true,reverse:true});assert.equal(r.total,34000);approx(r.perPiece,r.total/30);});
test('Fractional casting quantity rejected',()=>fails(()=>estimatePrice({...cast,quantity:1.5})));
test('Infinite casting quantity rejected',()=>fails(()=>estimatePrice({...cast,quantity:Infinity})));
test('Shape volume basic cube',()=>approx(shapeVolume('box',[10,10,10],0),1));
test('Shape nonfinite dimensions rejected',()=>fails(()=>shapeVolume('box',[10,NaN,10],0)));
test('Shape invalid wall rejected',()=>fails(()=>shapeVolume('sphere',[10],6)));

// Minimal isolated DOM: dangerous HTML sinks deliberately throw; no network APIs exist.
class Element {
 constructor(tag){this.tagName=tag;this.children=[];this._text='';this._value='';this.className='';this.checked=false;this.listeners={};this.attributes={};this.classList={add:c=>this._classes(c,true),remove:c=>this._classes(c,false),toggle:(c,force)=>this._classes(c,force===undefined?!this.className.split(' ').includes(c):force)};}
 _classes(c,on){const values=new Set(this.className.split(' ').filter(Boolean));on?values.add(c):values.delete(c);this.className=[...values].join(' ');}
 set innerHTML(v){throw new Error('Unsafe innerHTML sink used');}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 set value(v){this._value=String(v);}get value(){return this._value;}
 appendChild(c){this.children.push(c);if(this.tagName==='select'&&this.children.length===1)this.value=c.value;return c;}
 append(...nodes){nodes.forEach(n=>this.appendChild(n));}
 replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 setAttribute(key,value){this.attributes[key]=value;}
 click(){(this.listeners.click||[]).forEach(fn=>fn({target:this}));}
}
const nodes={};
for(const m of html.matchAll(/<([a-z]+)\b([^>]*)>/g)){const id=/\bid="([^"]+)"/.exec(m[2]);if(id){const element=new Element(m[1]);element.id=id[1];const value=/\bvalue="([^"]*)"/.exec(m[2]);if(value)element.value=value[1];nodes[element.id]=element;}}
nodes.shape.value='box';nodes.masterMode.value='fixed';nodes.size.value='до 100 мм';
const docEvents={};
const document={getElementById:id=>nodes[id],createElement:tag=>new Element(tag),querySelectorAll:selector=>selector==='.dimInp'?nodes.dimsRow.children.flatMap(n=>n.children).filter(n=>n.className==='dimInp'):[],addEventListener:(type,fn)=>(docEvents[type]??=[]).push(fn)};
const readers=[];
class Reader {constructor(){this.readyState=0;readers.push(this);}readAsArrayBuffer(file){this.readyState=1;this.file=file;}abort(){this.readyState=2;}complete(value){this.readyState=2;this.result=value;this.onload();}}
const ui=vm.createContext({window:{},document,FileReader:Reader,ArrayBuffer,DataView,TextDecoder,Map});
test('Full inline scripts initialize without network or HTML sinks',()=>vm.runInContext(scripts.join('\n'),ui,{timeout:5000}));
test('Filename markup renders literally without creating element',()=>{vm.runInContext('handleFile({name:"<img src=x onerror=alert(1)>.obj",size:100})',ui);assert.match(nodes.meshInfo.textContent,/<img src=x onerror=alert\(1\)>/);assert.equal(nodes.meshInfo.children.length,0);assert.equal(nodes.price.textContent,'—');});
test('Large file rejected before FileReader allocation',()=>{const count=readers.length;vm.runInContext('handleFile({name:"oversized.stl",size:LIMITS.fileBytes+1})',ui);assert.equal(readers.length,count);assert.equal(nodes.price.textContent,'—');});
test('Malformed upload clears former quote',()=>{ui.invalid=bytes('solid broken\nendsolid broken');vm.runInContext('handleFile({name:"broken.stl",size:invalid.byteLength})',ui);readers.at(-1).complete(ui.invalid);assert.equal(nodes.price.textContent,'—');assert.equal(nodes.vol.value,'');assert.match(nodes.meshInfo.textContent,/STL не принят/);});
test('FileReader stale result cannot overwrite newer choice',()=>{ui.cube=binary();vm.runInContext('handleFile({name:"old.stl",size:cube.byteLength})',ui);const old=readers.at(-1);vm.runInContext('handleFile({name:"new.stl",size:cube.byteLength})',ui);const fresh=readers.at(-1);old.complete(ui.cube);assert.equal(nodes.vol.value,'');fresh.complete(ui.cube);assert.equal(Number(nodes.vol.value),1);});
test('Manual volume input cancels pending upload',()=>{vm.runInContext('handleFile({name:"pending.stl",size:cube.byteLength})',ui);const pending=readers.at(-1);nodes.vol.value='25';docEvents.input.forEach(fn=>fn({target:nodes.vol}));pending.complete(ui.cube);assert.equal(nodes.vol.value,'25');});
test('Blank manual volume shows no price',()=>{nodes.vol.value='';docEvents.input.forEach(fn=>fn({target:nodes.vol}));assert.equal(nodes.price.textContent,'—');});
test('Invalid primitive clears quote rather than leaving stale output',()=>{nodes.vol.value='25';docEvents.input.forEach(fn=>fn({target:nodes.vol}));document.querySelectorAll('.dimInp')[0].value='';nodes.calcVol.listeners.click[0]();assert.equal(nodes.price.textContent,'—');assert.equal(nodes.vol.value,'');assert.notEqual(nodes.shapeOut.textContent,'');});
test('Wrapper links stay within static tree',()=>{const wrapper=fs.readFileSync(base+'/sites/silikonforms/calc/index.html','utf8');assert.match(wrapper,/src="kalkulyator.html"/);assert.match(wrapper,/href="\.\.\/index.html"/);assert.doesNotMatch(wrapper,/href="\/"|https?:\/\//);});
test('No outbound production metadata or claimed missing dataset',()=>assert.doesNotMatch(html,/https?:\/\/|mailto:|tel:|\b[a-z0-9-]+\.ru\b|competitor_prices|material_costs|медиан|факт рынка|методология §|docs\/|rates\.js|innerHTML|insertAdjacentHTML/));
const report={mode:'Isolated Node VM synthetic inputs, no network, no dependencies',source_sha256:crypto.createHash('sha256').update(html).digest('hex'),passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,tests:results};
console.log(JSON.stringify(report,null,2));
process.exitCode=report.failed?1:0;
