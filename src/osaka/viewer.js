import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LookControls } from '../app/rig.js';
import { h } from '../app/dom.js';
import { language, languageSelect, tr } from '../app/i18n.js';
import { blocks, byBlock, layouts, seats } from './seats.js';
import { buildHall } from './hall.js';
import { makePlan } from './plan.js';
import { buildExterior } from './exterior.js';
import { facade, innerWall, places, radial, zone } from './grounds.js';
import { walking } from './walking.js';
import './viewer.css';

export function start() {
  const params=new URLSearchParams(location.search);
  const canvas=document.querySelector('#view');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  const scene=new T.Scene();
  scene.background=new T.Color(0x202631);
  const parkHaze=new T.Fog(0xc9dce5,175,490);
  scene.add(new T.HemisphereLight(0xfff4e7,0x929ab0,1.85));
  const sun=new T.DirectionalLight(0xffe4c7,2.2);
  sun.position.set(-35,60,20);scene.add(sun);
  const bowl=new T.Group();scene.add(bowl);
  const hall=buildHall(bowl);
  let grounds;
  const camera=new T.PerspectiveCamera(46,1,.08,550);
  const orbit=new OrbitControls(camera,canvas);
  orbit.enablePan=false;orbit.minDistance=30;orbit.maxDistance=260;
  orbit.minPolarAngle=.04;orbit.maxPolarAngle=Math.PI*.48;
  const look=new LookControls(camera,canvas);
  let frame=0;
  function redraw(){
    if(!frame) frame=requestAnimationFrame(()=>{frame=0;renderer.render(scene,camera);});
  }
  orbit.addEventListener('change',redraw);look.onChange=redraw;
  let layout=Object.hasOwn(layouts,params.get('layout'))?params.get('layout'):'B';
  let mode=['walk','exterior','seat'].includes(params.get('view'))?params.get('view'):'overview';
  let place=Object.hasOwn(places,params.get('start'))?params.get('start'):'plaza';
  const encoded=(params.get('pose')||'').split(',').map(Number);
  let savedPose=encoded.length===4&&encoded.every(Number.isFinite)
    ? {x:encoded[0],z:encoded[1],yaw:encoded[2],pitch:encoded[3]}:null;
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
    mode=next;update();
    if(mode==='walk')walker.focus();
  }
  const modeButtons=Object.entries({overview:'전체 보기',exterior:'외관',walk:'걷기',seat:'좌석 시야'}).map(([key,label])=>
    h('button',{type:'button','data-mode':key,onClick:()=>changeMode(key)},tr(label)));
  const capacity=h('p',{class:'os-capacity'});
  const sightline=h('p',{class:'os-sightline'},tr('이 좌석은 선택한 무대 뒤쪽입니다. 예매 전 공연별 좌석표를 확인하세요.'));
  const badge=h('span',{class:'os-badge','aria-live':'polite'});
  const hint=h('span',{class:'os-hint'},tr('드래그로 회전 · 휠 또는 두 손가락으로 확대'));
  const sit=h('button',{class:'os-sit',type:'button',onClick:sitDown},h('kbd',null,'E'),tr('가까운 좌석에 앉기'));
  const pad=h('div',{class:'os-pad','aria-label':tr('이동')});
  const walker=walking(camera,look,canvas,moveWalk,saveWalk,sitDown);
  for(const [d,arrow,label] of [['up','↑','앞으로'],['left','←','왼쪽으로'],['down','↓','뒤로'],['right','→','오른쪽으로']]){
    const button=h('button',{type:'button','aria-label':tr(label),'data-direction':d},arrow);
    walker.bind(button,d);pad.append(button);
  }
  canvas.addEventListener('pointerup',()=>{if(mode==='walk')saveWalk();});
  function moveWalk(position){
    const r=radial(position.x,position.z);
    const label=tr(zone(position.x,position.z));
    if(badge.textContent!==label)badge.textContent=label;
    bowl.visible=r<facade+5 || (r<95 && Math.abs(position.x)<16);
    sit.hidden=r>=innerWall;
    redraw();
  }
  function saveWalk(){
    if(mode!=='walk')return;
    savedPose=walker.pose();
    if(savedPose)writeUrl();
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
  const stages=Object.keys(layouts).map(key=>h('button',{type:'button','data-layout':key,onClick:()=>{layout=key;update();}},
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
  const section=(label,...children)=>h('section',{class:'os-section'},h('h2',null,tr(label)),...children);
  const routes=section('걷기 시작 위치',h('div',{class:'os-places'},Object.entries(places).map(([key,p])=>
    h('button',{type:'button','data-start':key,onClick:()=>{
      walker.leave();place=key;savedPose=null;mode='walk';update();walker.focus();
    }},tr(p.label)))),
    h('p',{class:'os-note'},tr('분수 광장에서 계단을 올라 북쪽 로비를 지나면 스탠드에 도착합니다.')),
    h('p',{class:'os-note'},tr('외관 치수와 실내 마감은 공개 자료를 바탕으로 재구성했습니다.'),' ',
      h('a',{href:'https://www.osaka-johall.com/floorguide/',target:'_blank',rel:'noopener'},tr('공식 층별 안내'),' ↗')));
  const panel=h('aside',{class:'os-panel'},routes,
    section('무대 배치',h('div',{class:'os-layouts'},stages),capacity),
    section('내 좌석 찾기',plan.root,h('div',{class:'os-selectors'},field('블록',block),field('열',row),field('좌석 번호',number)),sightline),
    h('p',{class:'os-note'},tr('플로어 좌석과 무대 연출은 공연마다 달라집니다. 단차와 눈높이는 추정값입니다.'),' ',
      h('a',{href:'https://www.osaka-johall.com/seat/',target:'_blank',rel:'noopener'},tr('공식 좌석표'),' ↗')));
  const body=h('main',{class:'os-hall'},
    h('header',{class:'os-header'},h('a',{class:'wordmark',href:'?lang='+language,'aria-label':tr('공연장 선택')},'Stage ',h('i',null,'EX')),
      h('h1',{lang:'en'},'Osaka-jo Hall'),h('div',{class:'os-modes'},modeButtons),
      languageSelect(code=>{const url=new URL(location.href);url.searchParams.set('lang',code);location.assign(url);})),
    h('div',{class:'os-body'},stage,panel));
  document.body.append(body);
  function overview() {
    // Fit the cutaway in the available viewport, including portrait phones.
    const outside=mode==='exterior';
    const distance=outside?Math.max(176,235/camera.aspect):Math.max(139,175/camera.aspect);
    orbit.maxDistance=Math.max(260,distance+15);
    orbit.target.set(0,outside?9:3,0);
    camera.position.set(.45,outside ? .66 : .95,outside ? -1 : 1).normalize().multiplyScalar(distance).add(orbit.target);
    orbit.update();
  }
  function update() {
    const seated=mode==='seat', walk=mode==='walk', outside=mode==='exterior';
    if(mode!=='overview'&&!grounds){grounds=buildExterior();scene.add(grounds);}
    if(grounds)grounds.visible=mode!=='overview';
    bowl.visible=!outside;hall.shell.visible=seated||walk;
    scene.background.setHex(walk||outside?0xc9dce5:0x202631);
    scene.fog=walk||outside?parkHaze:null;
    stage.classList.toggle('os-walking',walk);
    pad.hidden=!walk;sit.hidden=true;routes.hidden=!(walk||outside);
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
    badge.textContent=seated?tr('{0} 블록 · {1}열 {2}번',seat.block,seat.row,seat.number):tr(outside?'외관':'전체 보기');
    hint.textContent=tr(walk?'WASD 또는 화살표로 이동 · 드래그로 시선 조절':'드래그로 회전 · 휠 또는 두 손가락으로 확대');
    orbit.enabled=!seated&&!walk;look.enabled=seated||walk;
    camera.fov=seated||walk?66:46;camera.updateProjectionMatrix();
    if(walk){
      walker.enter(place,savedPose);savedPose=walker.pose();
    }else if(seated){
      camera.position.set(seat.x,seat.y+1.17,seat.z);
      look.setDirection(new T.Vector3(l.x,2.25,l.z).sub(camera.position));
    }else overview();
    writeUrl();redraw();
  }
  function writeUrl(){
    const url=new URL(location.href);
    for(const [k,v] of Object.entries({layout,view:mode,block:seat.block,row:seat.row,seat:seat.number}))url.searchParams.set(k,v);
    if(mode==='walk'&&savedPose){
      url.searchParams.set('start',place);
      url.searchParams.set('pose',[savedPose.x,savedPose.z,savedPose.yaw,savedPose.pitch].map(v=>Number(v.toFixed(4))).join(','));
    }else{url.searchParams.delete('start');url.searchParams.delete('pose');}
    if(url.href!==location.href)history.replaceState(null,'',url);
  }
  function resize(){
    const {clientWidth:w,clientHeight:h}=stage;
    if(!w||!h)return;
    camera.aspect=w/h;renderer.setSize(w,h,false);camera.updateProjectionMatrix();
    if(mode==='overview'||mode==='exterior')overview();redraw();
  }
  resize();update();new ResizeObserver(resize).observe(stage);
  document.querySelector('#loading').classList.add('done');
}
