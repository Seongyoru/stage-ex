import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LookControls } from '../app/rig.js';
import { h } from '../app/dom.js';
import { language, languageSelect, preference, remember, tr } from '../app/i18n.js';
import { blocks, byBlock, layouts, seats } from './seats.js';
import { buildHall } from './hall.js';
import { makePlan } from './plan.js';
import { buildExterior } from './exterior.js';
import { facade, innerWall, places, radial, zone } from './grounds.js';
import { gateAt, upper } from './routes.js';
import { walking } from './walking.js';
import { nightLights, setupSun, skyTexture } from './atmosphere.js';
import { scheduleBanner } from '../app/schedule.js';
import './viewer.css';

export function start() {
  const params=new URLSearchParams(location.search);
  const canvas=document.querySelector('#view');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  const scene=new T.Scene();
  scene.background=new T.Color(0x202631);
  const parkHaze=new T.Fog(0xc9dce5,175,490);
  const ambient=new T.HemisphereLight(0xfff4e7,0x929ab0,1.85);scene.add(ambient);
  const sun=new T.DirectionalLight(0xffe4c7,2.2);
  sun.position.set(-35,60,20);scene.add(sun);
  setupSun(renderer,sun);
  const skies=[skyTexture(false),skyTexture(true)], lamplight=nightLights();scene.add(lamplight);
  const bowl=new T.Group();scene.add(bowl);
  const hall=buildHall(bowl,redraw);
  let grounds;
  const camera=new T.PerspectiveCamera(46,1,.08,1250);
  const orbit=new OrbitControls(camera,canvas);
  orbit.enablePan=false;orbit.minDistance=30;orbit.maxDistance=260;
  orbit.minPolarAngle=.04;orbit.maxPolarAngle=Math.PI*.48;
  const look=new LookControls(camera,canvas);
  const ray=new T.Raycaster();
  let press=null;
  canvas.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY,id:e.pointerId};});
  canvas.addEventListener('pointercancel',()=>{press=null;});
  canvas.addEventListener('pointerup',e=>{
    const tap=press&&press.id===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<4;
    press=null;if(!tap||mode!=='overview'||e.button!==0)return;
    const r=canvas.getBoundingClientRect();
    ray.setFromCamera({x:2*(e.clientX-r.left)/r.width-1,y:1-2*(e.clientY-r.top)/r.height},camera);
    const hit=ray.intersectObjects(hall.pickable,false)[0];
    if(hit){seat=hall.standSeats[hit.instanceId];changeMode('seat');}
  });
  let frame=0;
  function redraw(){
    if(!frame) frame=requestAnimationFrame(()=>{frame=0;projectLabels();renderer.render(scene,camera);});
  }
  orbit.addEventListener('change',redraw);look.onChange=redraw;
  let layout=Object.hasOwn(layouts,params.get('layout'))?params.get('layout'):'B';
  let mode=['overview','walk','exterior','seat','section','floor','fly'].includes(params.get('view'))?params.get('view'):'exterior';
  let place=Object.hasOwn(places,params.get('start'))?params.get('start'):'plaza';
  const encoded=(params.get('pose')||'').split(',').map(Number);
  let savedPose=[4,5].includes(encoded.length)&&encoded.every(Number.isFinite)
    ? {x:encoded[0],z:encoded[1],yaw:encoded[2],pitch:encoded[3],y:encoded[4]}:null;
  let flyPose=mode==='fly'?savedPose:null;
  if(mode==='fly')savedPose=null;
  let night=params.get('night')==='1', show=params.get('show')==='1', low=params.get('q')==='low';
  let labels=params.get('labels')!=='0',roofOpen=params.get('roof')==='0';
  let floor=params.get('level')==='1'?1:2, axis=params.get('axis')==='x'?'x':'z';
  let cut=Math.max(-65,Math.min(65,Number(params.get('cut'))||0));
  const clip=new T.Plane(),bottom=new T.Plane(new T.Vector3(0,1,0),0);
  let nearGate=null;
  let seat=seats.get([params.get('block'),params.get('row'),params.get('seat')].join('-'))
    || byBlock.get(blocks.includes(params.get('block'))?params.get('block'):'D').get(1)[0];
  if(!params.has('block')) seat=byBlock.get('D').get(12)[14];
  const stageNames={A:'가로 무대',B:'끝 무대',C:'중앙 무대'};
  const selector=(key,label)=>h('select',{id:'os-'+key,'aria-label':tr(label)});
  const block=selector('block','블록'),row=selector('row','열'),number=selector('seat','좌석 번호');
  const field=(label,select)=>h('label',null,h('span',null,tr(label)),select);
  const options=(select,values,value)=>{
    select.replaceChildren(...values.map(v=>new Option(v,v)));select.value=value;
  };
  function changeMode(next){
    if(mode==='walk'){savedPose=walker.pose();walker.leave();}
    if(mode==='fly'){flyPose=walker.pose();walker.leave();}
    mode=next;update();
    if(mode==='walk'||mode==='fly')walker.focus();
  }
  const modeButtons=Object.entries({overview:'전체 보기',exterior:'외관',walk:'걷기',fly:'날기',section:'단면',floor:'층별',seat:'좌석 시야'}).map(([key,label])=>
    h('button',{type:'button','data-mode':key,onClick:()=>changeMode(key)},tr(label)));
  const capacity=h('p',{class:'os-capacity'});
  const sightline=h('p',{class:'os-sightline'},tr('이 좌석은 선택한 무대 뒤쪽입니다. 예매 전 공연별 좌석표를 확인하세요.'));
  const badge=h('span',{class:'os-badge','aria-live':'polite'});
  const hint=h('span',{class:'os-hint'},tr('드래그로 회전 · 휠 또는 두 손가락으로 확대'));
  const sit=h('button',{class:'os-sit',type:'button',onClick:interact},h('kbd',null,'E'),tr('가까운 좌석에 앉기'));
  const pad=h('div',{class:'os-pad','aria-label':tr('이동')});
  const walker=walking(camera,look,canvas,moveWalk,saveWalk,interact,()=>layout,(x,z,y)=>{
    const g=y<1&&gateAt(x,z,2.65);return g&&Math.abs(radial(x,z)-47.9)<.4&&(grounds?.userData.doors.get(g.id)?.amount??0)<.92;
  });
  for(const [d,arrow,label] of [['up','↑','앞으로'],['left','←','왼쪽으로'],['down','↓','뒤로'],['right','→','오른쪽으로'],['rise','↑','상승'],['fall','↓','하강']]){
    const button=h('button',{type:'button','aria-label':tr(label),'data-direction':d},arrow);
    walker.bind(button,d);pad.append(button);
  }
  canvas.addEventListener('pointerup',()=>{if(mode==='walk'||mode==='fly')saveWalk();});
  function moveWalk(position){
    const r=radial(position.x,position.z);
    const flying=mode==='fly';
    if(show&&!flying)lightLevels(r<innerWall);
    const label=flying?tr('날기'):tr(zone(position.x,position.z,position.y));
    if(badge.textContent!==label)badge.textContent=label;
    bowl.visible=r<facade+5 || (r<95 && Math.abs(position.x)<16);
    nearGate=(!flying&&position.y<1&&Math.abs(r-47.9)<3.8)?gateAt(position.x,position.z,3.3):null;
    sit.hidden=flying||(!nearGate&&(r>=innerWall||position.y<upper-.5));
    const msg=nearGate?tr(grounds.userData.doors.get(nearGate.id).open?'게이트 닫기':'게이트 열기')+' · '+nearGate.id:tr('가까운 좌석에 앉기');
    if(sit.lastChild.textContent!==msg)sit.lastChild.textContent=msg;
    redraw();
  }
  function saveWalk(){
    if(mode==='walk')savedPose=walker.pose();else if(mode==='fly')flyPose=walker.pose();else return;
    writeUrl();
  }
  function interact(){
    if(mode!=='walk'||sit.hidden)return;
    if(nearGate){
      const door=grounds.userData.doors.get(nearGate.id);
      if(door.open&&Math.abs(radial(camera.position.x,camera.position.z)-47.9)<.6)return;
      door.open=!door.open;
      const start=performance.now(),from=door.amount,to=Number(door.open);
      cancelAnimationFrame(door.frame);
      function slide(now){
        const t=Math.min(1,(now-start)/360);door.amount=from+(to-from)*t;
        door.leaves.forEach((m,i)=>{m.position.x=(i?1:-1)*(1.21+door.amount*2.44);});redraw();
        if(t<1)door.frame=requestAnimationFrame(slide);
      }
      door.frame=requestAnimationFrame(slide);moveWalk(walker.pose());return;
    }
    sitDown();
  }
  function sitDown(){
    if(mode!=='walk'||sit.hidden)return;
    const {x,z}=walker.pose();
    let best=Infinity;
    for(const rows of byBlock.values())for(const s of rows.get(22)||[]){
      const distance=(s.x-x)**2+(s.z-z)**2;
      if(distance<best){best=distance;seat=s;}
    }
    changeMode('seat');
  }
  const stages=Object.keys(layouts).map(key=>h('button',{type:'button','data-layout':key,onClick:()=>{
    if(mode==='walk')savedPose=walker.pose();if(mode==='fly')flyPose=walker.pose();
    layout=key;update();}},
    h('b',null,key),h('span',null,tr(stageNames[key]))));
  const plan=makePlan(selectBlock);
  function selectBlock(b){
    const rows=byBlock.get(b);
    const values=rows.get(seat.row)||rows.values().next().value;
    seat=values[Math.floor(values.length/2)];changeMode('seat');
  }
  block.onchange=()=>selectBlock(block.value);
  row.onchange=()=>{
    const list=byBlock.get(seat.block).get(+row.value);
    seat=list.find(s=>s.number===seat.number)||list[Math.floor(list.length/2)];
    changeMode('seat');
  };
  number.onchange=()=>{seat=seats.get([block.value,row.value,number.value].join('-'));changeMode('seat');};
  const stage=h('section',{class:'os-viewport'},canvas,badge,hint,pad,sit);
  const markerLayer=h('div',{class:'os-markers'});stage.append(markerLayer);
  const projection=new T.Vector3();
  const markers=Object.entries(places).map(([key,p])=>{
    const button=h('button',{type:'button',onClick:()=>startAt(key)},tr(p.label));
    markerLayer.append(button);return {key,p,button};
  });
  function projectLabels(){
    camera.updateMatrixWorld();
    for(const {key,p,button} of markers){
      let visible=labels && ((mode==='exterior'&&['north','plaza','south'].includes(key)) ||
        (mode==='floor'&&(floor===1?key==='arena':['north','south','east','stand'].includes(key))));
      if(visible){
        projection.set(p.x,(p.y??(key==='plaza'?6:upper))+1.2,p.z).project(camera);
        visible=Math.abs(projection.x)<.91&&Math.abs(projection.y)<.88&&Math.abs(projection.z)<1;
        button.style.left=(50+projection.x*50)+'%';button.style.top=(50-projection.y*50)+'%';
      }
      button.hidden=!visible;
    }
  }
  function startAt(key){
    walker.leave();place=key;savedPose=null;mode='walk';update();walker.focus();
  }
  const section=(label,...children)=>h('section',{class:'os-section'},h('h2',null,tr(label)),...children);
  const routes=section('걷기 시작 위치',h('div',{class:'os-places'},Object.entries(places).map(([key,p])=>
    h('button',{type:'button','data-start':key,onClick:()=>startAt(key)},tr(p.label)))),
    h('p',{class:'os-note'},tr('북쪽 로비에서 스탠드로 직진하거나, 동쪽 연결 계단을 내려가 1층 게이트를 여세요.')),
    h('p',{class:'os-note'},tr('외관 치수와 실내 마감은 공개 자료를 바탕으로 재구성했습니다.'),' ',
      h('a',{href:'https://www.osaka-johall.com/floorguide/',target:'_blank',rel:'noopener'},tr('공식 층별 안내'),' ↗')));
  const stateButton=(id,label,fn)=>h('button',{type:'button','data-control':id,onClick:fn},tr(label));
  const nightButton=stateButton('night','밤',()=>{night=!night;appearance();});
  const showButton=stateButton('show','공연 조명',()=>{show=!show;appearance();});
  const qualityButton=stateButton('quality','저사양 모드',()=>{low=!low;appearance();});
  const labelButton=stateButton('labels','라벨',()=>{labels=!labels;appearance();});
  const roofButton=stateButton('roof','지붕 열기',()=>{roofOpen=!roofOpen;update();});
  const sceneTools=section('장면',h('div',{class:'os-settings'},nightButton,showButton,labelButton,roofButton,qualityButton));
  const help=h('dialog',{class:'quick-guide','aria-label':tr('조작 안내')},h('h2',null,tr('조작 안내')),
    h('ul',null,[
      ['↻','전체 보기','드래그로 회전 · 휠 또는 두 손가락으로 확대'],
      ['↔','걷기','WASD 또는 화살표로 이동 · 드래그로 시선 조절'],
      ['E','1층 아레나 입구','게이트 앞에서 E 또는 화면 중앙의 안내를 누르세요.'],
      ['↕','날기','WASD 이동 · E 상승 · Q 하강 · Shift 가속'],
    ].map(([i,t,desc])=>h('li',null,h('span',null,i),h('div',null,h('strong',null,tr(t)),h('small',null,tr(desc)))))),
    h('button',{type:'button',class:'guide-start',onClick:()=>help.close()},tr('닫기')));
  help.addEventListener('keydown',e=>e.stopPropagation());
  help.addEventListener('close',()=>remember('osaka-guide','1'));
  const helpButton=h('button',{type:'button',class:'os-help',onClick:()=>help.showModal(),'aria-label':tr('조작 안내')},'?');
  const axisButton=stateButton('axis','절단 방향',()=>{axis=axis==='x'?'z':'x';inspection();});
  const slider=h('input',{type:'range',min:-65,max:65,value:cut,'aria-label':tr('단면 위치'),
    onInput:e=>{cut=Number(e.target.value);inspection();}});
  const sections=section('단면',axisButton,slider);
  const floors=[1,2].map(n=>stateButton('level'+n,n===1?'1층 아레나':'2층 스탠드',()=>{floor=n;inspection();}));
  const floorPanel=section('층별',h('div',{class:'os-settings'},floors));
  function inspection(){
    renderer.clippingPlanes=[];
    if(mode==='section'){
      clip.normal.set(axis==='x'?-1:0,0,axis==='z'?1:0);clip.constant=axis==='x'?cut:-cut;
      renderer.clippingPlanes=[clip];axisButton.textContent=tr('절단 방향')+' · '+axis.toUpperCase();
    }else if(mode==='floor'){
      clip.normal.set(0,-1,0);clip.constant=floor===1?2.75:upper+2.6;
      bottom.constant=floor===1?.1:-upper+.12;renderer.clippingPlanes=[clip,bottom];
      floors.forEach((b,i)=>b.setAttribute('aria-pressed',i+1===floor));badge.textContent=tr(floor===1?'1층 아레나':'2층 스탠드');
    }
    writeUrl();redraw();
  }
  function lightLevels(insideShow){
    ambient.intensity=insideShow?.38:night?.64:1.65;sun.intensity=insideShow?.42:night?.48:2.15;
  }
  function appearance(){
    const outside=['walk','fly','exterior','section','floor'].includes(mode);
    lightLevels(show&&(mode==='seat'||mode==='overview'||(mode==='walk'&&radial(camera.position.x,camera.position.z)<innerWall)));
    sun.color.setHex(night?0xbac8ff:0xffead5);
    const sky=night?0x18283f:0xc3d9e5;
    parkHaze.color.setHex(sky);scene.background=outside?skies[Number(night)]:new T.Color(0x202631);scene.fog=outside?parkHaze:null;
    lamplight.visible=night&&outside;
    renderer.shadowMap.enabled=!low&&['exterior','fly','walk'].includes(mode);
    renderer.shadowMap.needsUpdate=true;
    renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.75));
    hall.setShow(show);nightButton.setAttribute('aria-pressed',night);showButton.setAttribute('aria-pressed',show);
    qualityButton.setAttribute('aria-pressed',low);writeUrl();redraw();
    labelButton.setAttribute('aria-pressed',labels);roofButton.hidden=mode!=='exterior';roofButton.setAttribute('aria-pressed',roofOpen);
  }
  const credits=h('div',{class:'os-credits'},h('a',{href:'https://www.geospatial.jp/ckan/dataset/plateau-27100-osaka-shi-2022',target:'_blank',rel:'noopener'},'© MLIT PLATEAU · Osaka 2022'),
    ' / ',h('a',{href:'https://www.mlit.go.jp/plateau/',target:'_blank',rel:'noopener'},'PLATEAU-Ortho 2024'));
  const panel=h('aside',{class:'os-panel'},sections,floorPanel,routes,
    section('무대 배치',h('div',{class:'os-layouts'},stages),capacity),
    section('내 좌석 찾기',plan.root,h('div',{class:'os-selectors'},field('블록',block),field('열',row),field('좌석 번호',number)),sightline),
    sceneTools,scheduleBanner(true,'osaka-jo-hall'),credits,h('p',{class:'os-note'},tr('플로어 좌석과 무대 연출은 공연마다 달라집니다. 단차와 눈높이는 추정값입니다.'),' ',
      h('a',{href:'https://www.osaka-johall.com/seat/',target:'_blank',rel:'noopener'},tr('공식 좌석표'),' ↗')));
  const body=h('main',{class:'os-hall'},
    h('header',{class:'os-header'},h('a',{class:'wordmark',href:'?lang='+language,'aria-label':tr('공연장 선택')},'Stage ',h('i',null,'EX')),
      h('h1',{lang:'en'},'Osaka-jo Hall'),h('div',{class:'os-modes'},modeButtons),
      helpButton,languageSelect(code=>{const url=new URL(location.href);url.searchParams.set('lang',code);location.assign(url);})),
    h('div',{class:'os-body'},stage,panel));
  document.body.append(body,help);
  function overview() {
    // Fit the cutaway in the available viewport, including portrait phones.
    const outside=mode==='exterior'||mode==='section';
    const distance=outside?Math.max(176,235/camera.aspect):Math.max(139,175/camera.aspect);
    orbit.maxDistance=Math.max(260,distance+15);
    orbit.target.set(0,outside?9:3,0);
    camera.position.set(.45,outside ? .66 : .95,outside ? -1 : 1).normalize().multiplyScalar(distance).add(orbit.target);
    if(mode==='floor')camera.position.set(.01,Math.max(155,170/camera.aspect),.04);
    orbit.update();
  }
  function update() {
    const seated=mode==='seat', walk=mode==='walk', outside=mode==='exterior',fly=mode==='fly',mobile=walk||fly;
    if(mode!=='overview'&&!grounds){
      grounds=buildExterior(()=>{renderer.shadowMap.needsUpdate=true;redraw();});
      grounds.traverse(o=>{if(o.isMesh){o.receiveShadow=true;o.castShadow=o.isInstancedMesh||o.userData.roof===true;}});
      scene.add(grounds);
    }
    if(grounds)grounds.visible=mode!=='overview';
    if(grounds)grounds.userData.roofParts.forEach(o=>{o.visible=!(outside&&roofOpen);});
    bowl.visible=!outside||roofOpen;hall.shell.visible=seated||mobile||mode==='section'||mode==='floor';
    scene.fog=walk||outside?parkHaze:null;
    stage.classList.toggle('os-walking',mobile);
    stage.classList.toggle('os-flying',fly);sections.hidden=mode!=='section';floorPanel.hidden=mode!=='floor';
    pad.hidden=!mobile;sit.hidden=true;routes.hidden=!(walk||outside);
    const list=byBlock.get(seat.block);
    options(block,blocks,seat.block);options(row,[...list.keys()],seat.row);
    options(number,list.get(seat.row).map(s=>s.number),seat.number);
    const l=layouts[layout];hall.setLayout(layout);
    const forward=(seat.x-l.x)*Math.sin(l.yaw)+(seat.z-l.z)*Math.cos(l.yaw);
    sightline.hidden=!(seated && layout!=='C' && forward < -l.depth/2);
    capacity.textContent=tr('최대 {0}명',l.capacity.toLocaleString(language));
    plan.update(seat.block,layout);
    stages.forEach(btn=>btn.setAttribute('aria-pressed',btn.dataset.layout===layout));
    modeButtons.forEach(btn=>btn.setAttribute('aria-pressed',btn.dataset.mode===mode));
    badge.textContent=seated?tr('{0} 블록 · {1}열 {2}번',seat.block,seat.row,seat.number):tr(outside?'외관':mode==='section'?'단면':'전체 보기');
    hint.textContent=tr(fly?'WASD 이동 · E 상승 · Q 하강 · Shift 가속':walk?'WASD 또는 화살표로 이동 · 드래그로 시선 조절':'드래그로 회전 · 휠 또는 두 손가락으로 확대');
    orbit.enabled=!seated&&!mobile;look.enabled=seated||mobile;
    camera.fov=seated||mobile?66:46;camera.updateProjectionMatrix();
    if(fly){walker.enter(place,flyPose,true);flyPose=walker.pose();}
    else if(walk){
      walker.enter(place,savedPose);savedPose=walker.pose();
    }else if(seated){
      camera.position.set(seat.x,seat.y+1.17,seat.z);
      look.setDirection(new T.Vector3(l.x,2.25,l.z).sub(camera.position));
    }else overview();
    appearance();inspection();
  }
  function writeUrl(){
    const url=new URL(location.href);
    for(const [k,v] of Object.entries({layout,view:mode,block:seat.block,row:seat.row,seat:seat.number}))url.searchParams.set(k,v);
    const pose=mode==='fly'?flyPose:savedPose;
    if((mode==='walk'||mode==='fly')&&pose){
      url.searchParams.set('start',place);
      url.searchParams.set('pose',[pose.x,pose.z,pose.yaw,pose.pitch,pose.y].map(v=>Number(v.toFixed(4))).join(','));
    }else{url.searchParams.delete('start');url.searchParams.delete('pose');}
    for(const [k,v] of Object.entries({night:night?'1':null,show:show?'1':null,q:low?'low':null,labels:labels?null:'0',roof:roofOpen?'0':null,level:mode==='floor'?floor:null,axis:mode==='section'?axis:null,cut:mode==='section'?cut:null})){
      if(v===null)url.searchParams.delete(k);else url.searchParams.set(k,v);
    }
    if(url.href!==location.href)history.replaceState(null,'',url);
  }
  function resize(){
    const {clientWidth:w,clientHeight:h}=stage;
    if(!w||!h)return;
    camera.aspect=w/h;renderer.setSize(w,h,false);camera.updateProjectionMatrix();
    if(!['seat','walk','fly'].includes(mode))overview();redraw();
  }
  resize();update();new ResizeObserver(resize).observe(stage);
  document.querySelector('#loading').classList.add('done');
  if(!params.has('view')&&!preference('guide-seen')&&!preference('osaka-guide'))help.showModal();
}
