import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LookControls } from '../app/rig.js';
import { h, icon, fmt } from '../app/dom.js';
import { language, preference, remember, tr } from '../app/i18n.js';
import { blocks, byBlock, layouts, seats } from './seats.js';
import { buildHall } from './hall.js';
import { makePlan } from './plan.js';
import { buildExterior } from './exterior.js';
import { facade, innerWall, places, radial, zone } from './grounds.js';
import { gateAt, upper } from './routes.js';
import { walking } from './walking.js';
import { nightLights, setupSun, skyTexture } from './atmosphere.js';
import { viewerHeader, mountSchedule, joystick, seatNavigation, segmented, switchRow } from '../app/viewer-shell.js';
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
  const root=document.querySelector('#ui');
  const capacity=h('p',{class:'os-capacity'});
  const sightline=h('p',{class:'os-sightline'},tr('이 좌석은 선택한 무대 뒤쪽입니다. 예매 전 공연별 좌석표를 확인하세요.'));
  const badge=h('span',{class:'os-badge','aria-live':'polite'});
  const hint=h('span',{class:'os-hint'},tr('드래그로 회전 · 휠 또는 두 손가락으로 확대'));
  const sit=h('button',{class:'os-sit',type:'button',onClick:interact},h('kbd',null,'E'),tr('가까운 좌석에 앉기'));
  const lift=h('div',{class:'flight-lift'});
  const walker=walking(camera,look,canvas,moveWalk,saveWalk,interact,()=>layout,(x,z,y)=>{
    const g=y<1&&gateAt(x,z,2.65);return g&&Math.abs(radial(x,z)-47.9)<.4&&(grounds?.userData.doors.get(g.id)?.amount??0)<.92;
  });
  const joy=joystick((x,y)=>walker.steer(x,y));
  for(const [dir,label] of [['rise','상승'],['fall','하강']]){
    const button=h('button',{type:'button','aria-label':tr(label),'data-direction':dir},icon(dir==='rise'?'chevUp':'chevDown'));
    walker.bindLift(button,dir);lift.append(button);
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
    doorHud.hidden=sit.hidden;hud.hidden=!sit.hidden;
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
  const stage=canvas;
  const doorHud=h('div',{class:'hud hud-door'},sit);
  const hud=h('div',{class:'hud'},h('div',{class:'hud-hint'},badge,' · ',hint));
  const seatReadout=h('div',{class:'hud-main'});
  function stepSeat(offset){
    const same=byBlock.get(seat.block).get(seat.row);
    const next=same[same.indexOf(seat)+offset];
    if(next){seat=next;changeMode('seat');}
  }
  function stepRow(offset){
    const rows=byBlock.get(seat.block),ordered=[...rows.keys()];
    const next=rows.get(ordered[ordered.indexOf(seat.row)+offset]);
    if(next){
      seat=next.reduce((best,s)=>Math.abs(s.number-seat.number)<Math.abs(best.number-seat.number)?s:best);
      changeMode('seat');
    }
  }
  function faceStage(){
    const l=layouts[layout];
    look.setDirection(new T.Vector3(l.x,2.25,l.z).sub(camera.position));redraw();
  }
  const seatHud=h('div',{class:'hud hud-seat'},seatReadout,seatNavigation(stepRow,stepSeat,faceStage));
  window.addEventListener('keydown',event=>{
    if(mode!=='seat'||event.altKey||event.metaKey||event.ctrlKey||document.querySelector('dialog[open]')||
       event.target.closest?.('input, select, textarea, [role=slider]'))return;
    const moves={ArrowUp:()=>stepRow(-1),ArrowDown:()=>stepRow(1),ArrowLeft:()=>stepSeat(-1),ArrowRight:()=>stepSeat(1)};
    if(moves[event.key]){event.preventDefault();moves[event.key]();}
  });
  const needle=h('div',{class:'needle'},h('b',null,'N'));
  const compass=h('button',{class:'compass',type:'button',title:tr('북쪽 방향 · 눌러서 전경으로'),onClick:()=>changeMode('exterior')},needle);
  const direction=new T.Vector3();
  const markerLayer=h('div',{class:'os-markers'});document.body.insertBefore(markerLayer,root);
  const projection=new T.Vector3();
  const markers=Object.entries(places).map(([key,p])=>{
    const button=h('button',{type:'button',onClick:()=>startAt(key)},tr(p.label));
    markerLayer.append(button);return {key,p,button};
  });
  function projectLabels(){
    camera.updateMatrixWorld();
    camera.getWorldDirection(direction);
    // North projected onto the two horizontal axes of the Osaka CityGML frame.
    const northX=-.71014445,northZ=-.70405601;
    needle.style.transform='rotate('+Math.atan2(direction.x*northZ-direction.z*northX,
      direction.x*northX+direction.z*northZ)+'rad)';
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
  const section=(label,...children)=>h('section',{class:'pane os-section'},h('h2',null,tr(label)),...children);
  const routes=section('출발 지점',h('div',{class:'list'},Object.entries(places).map(([key,p])=>
    h('button',{type:'button',class:'list-item','data-start':key,onClick:()=>startAt(key)},tr(p.label)))),
    h('p',{class:'os-note'},tr('북쪽 로비에서 스탠드로 직진하거나, 동쪽 연결 계단을 내려가 1층 게이트를 여세요.')),
    h('p',{class:'os-note'},tr('외관 치수와 실내 마감은 공개 자료를 바탕으로 재구성했습니다.'),' ',
      h('a',{href:'https://www.osaka-johall.com/floorguide/',target:'_blank',rel:'noopener'},tr('공식 층별 안내'),' ↗')));
  const stateButton=(id,label,fn)=>h('button',{type:'button','data-control':id,onClick:fn},tr(label));
  const time=segmented([{value:false,label:h('span',null,icon('sun',15),tr(' 낮'))},
    {value:true,label:h('span',null,icon('moon',15),tr(' 밤'))}],night,value=>{night=value;appearance();});
  const quality=segmented([{value:false,label:tr('높음')},{value:true,label:tr('낮음')}],low,value=>{low=value;appearance();});
  const showSwitch=switchRow(tr('공연 조명'),show,value=>{show=value;appearance();});
  const labelSwitch=switchRow(tr('라벨'),labels,value=>{labels=value;appearance();});
  const roofSwitch=switchRow(tr('지붕 열기'),roofOpen,value=>{roofOpen=value;update();});
  const sceneTools=h('div',{class:'scene'},
    h('div',{class:'time-row'},h('span',null,tr('시간대')),time),
    h('details',{class:'group'},h('summary',null,icon('settings',16),tr('장면 설정')),
      showSwitch,roofSwitch,labelSwitch,h('div',{class:'inline'},h('span',null,tr('품질')),quality)));
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
  const axisButton=stateButton('axis','절단 방향',()=>{axis=axis==='x'?'z':'x';inspection();});
  const slider=h('input',{type:'range',min:-65,max:65,value:cut,'aria-label':tr('단면 위치'),
    onInput:e=>{cut=Number(e.target.value);inspection();}});
  const sections=section('단면',h('div',{class:'list'},axisButton),slider);
  axisButton.className='list-item';
  const floors=[1,2].map(n=>stateButton('level'+n,n===1?'1층 아레나':'2층 스탠드',()=>{floor=n;inspection();}));
  const floorPanel=section('층 선택',h('div',{class:'list levels'},floors));
  function inspection(){
    renderer.clippingPlanes=[];
    if(mode==='section'){
      clip.normal.set(axis==='x'?-1:0,0,axis==='z'?1:0);clip.constant=axis==='x'?cut:-cut;
      renderer.clippingPlanes=[clip];axisButton.textContent=tr('절단 방향')+' · '+axis.toUpperCase();
    }else if(mode==='floor'){
      clip.normal.set(0,-1,0);clip.constant=floor===1?2.75:upper+2.6;
      bottom.constant=floor===1?.1:-upper+.12;renderer.clippingPlanes=[clip,bottom];
      floors.forEach((b,i)=>{b.className='list-item'+(i+1===floor?' on':'');b.setAttribute('aria-pressed',i+1===floor);});badge.textContent=tr(floor===1?'1층 아레나':'2층 스탠드');
    }
    writeUrl();redraw();
  }
  function lightLevels(insideShow){
    ambient.intensity=insideShow?.59:night?.64:1.65;sun.intensity=insideShow?.58:night?.48:2.15;
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
    hall.setShow(show);time.setValue(night);quality.setValue(low);
    showSwitch.input.checked=show;labelSwitch.input.checked=labels;
    roofSwitch.hidden=mode!=='exterior';roofSwitch.input.checked=roofOpen;
    writeUrl();redraw();
  }
  const credits=h('div',{class:'os-credits'},h('a',{href:'https://www.geospatial.jp/ckan/dataset/plateau-27100-osaka-shi-2022',target:'_blank',rel:'noopener'},'© MLIT PLATEAU · Osaka 2022'),
    ' / ',h('a',{href:'https://www.mlit.go.jp/plateau/',target:'_blank',rel:'noopener'},'PLATEAU-Ortho 2024'));
  const seatPanel=section('좌석 선택',h('div',{class:'os-selectors'},field('블록',block),field('열',row),field('좌석 번호',number)),
    h('div',{class:'seatmap-wrap'},plan.root),sightline);
  const layoutPanel=section('무대 배치',h('div',{class:'seg os-layouts'},stages),capacity);
  const cards=[['exterior','외부 시점','os-facade'],['overview','내부 시점','osaka-jo-hall']].map(([id,title,image])=>
    h('button',{class:'view-card',type:'button','data-view':id,onClick:()=>changeMode(id)},
      h('img',{src:'./venues/'+image+'.webp',alt:''}),h('span',null,tr(title)),icon('check',14)));
  const explorePanel=section('시점 선택',h('div',{class:'view-cards'},cards));
  const flightStarts=[
    ['분수 광장',places.plaza.x,29,places.plaza.z,0,10,-58],
    ['외관',95,49,-134,0,11,0],
    ['스탠드 통로',0,15,39,0,2,0],
  ];
  const flyPanel=section('비행 출발점',h('div',{class:'list'},flightStarts.map(([name,x,y,z,tx,ty,tz])=>
    h('button',{class:'list-item',type:'button',onClick:()=>{
      walker.leave();
      flyPose={x,y,z,yaw:Math.atan2(x-tx,z-tz),pitch:Math.atan2(ty-y-1.62,Math.hypot(x-tx,z-tz))};
      mode='fly';update();walker.focus();
    }},tr(name)))),h('p',{class:'hint'},tr('하늘에서 공연장과 광장을 자유롭게 둘러보세요.')));
  const panelScroll=h('div',{class:'panel-scroll'},explorePanel,seatPanel,routes,flyPanel,sections,floorPanel,layoutPanel,sceneTools);
  const panel=h('aside',{class:'panel',id:'viewer-controls','aria-label':tr('조작 패널')},panelScroll);
  function setPanel(open){
    root.classList.toggle('panel-closed',!open);panel.inert=!open;
    header.panelToggle.setAttribute('aria-expanded',String(open));
  }
  const notes=h('p',{class:'hint'},tr('플로어 좌석과 무대 연출은 공연마다 달라집니다. 단차와 눈높이는 추정값입니다.'));
  const source=(url,label)=>h('a',{href:url,target:'_blank',rel:'noopener'},tr(label));
  function info(title,content){
    const dialog=h('dialog',{class:'quick-guide os-info','aria-label':tr(title)},h('h2',null,tr(title)),content,
      h('button',{type:'button',class:'guide-start',onClick:()=>dialog.close()},tr('닫기')));
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
  }
  const sources=()=>info('출처 · 안내',[notes,source('https://www.osaka-johall.com/floorguide/','공식 층별 안내'),
    source('https://www.osaka-johall.com/seat/','공식 좌석표'),credits]);
  const toast=h('div',{class:'toast',role:'status'});
  let toastTimer;
  async function share(){
    saveWalk();
    try{await navigator.clipboard.writeText(location.href);toast.textContent=tr('현재 화면의 링크를 복사했습니다');}
    catch{toast.textContent=location.href;}
    toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('on'),4200);
  }
  const header=viewerHeader('Osaka-jo Hall',{
    mode:id=>changeMode(({explore:'exterior',levels:'floor'})[id]||id),panel:()=>setPanel(panel.inert),home:()=>changeMode('exterior'),
    facts:()=>info('시설 개요',[h('p',null,'Osaka-jo Hall · ',tr('최대 {0}명',(16000).toLocaleString(language))),
      h('p',null,tr('1층 아레나'),' / ',tr('2층 스탠드')),source('https://www.osaka-johall.com/floorguide/','공식 층별 안내')]),
    about:sources,share,help:()=>help.showModal(),
    full:()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.().catch(()=>{}),
    language:lang=>{const url=new URL(location.href);url.searchParams.set('lang',lang);location.assign(url);}
  });
  const credit=h('button',{type:'button',class:'credit',onClick:sources},'© MLIT PLATEAU · Osaka');
  root.append(header.topbar,panel,hud,seatHud,doorHud,credit,compass,joy,lift,toast);
  document.body.append(help);mountSchedule(root,panelScroll,'osaka-jo-hall');
  setPanel(!matchMedia('(max-width:760px)').matches);
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
    root.classList.toggle('walking',mobile);
    sections.hidden=mode!=='section';floorPanel.hidden=mode!=='floor';
    sit.hidden=true;doorHud.hidden=true;hud.hidden=seated;seatHud.hidden=!seated;routes.hidden=!walk;flyPanel.hidden=!fly;
    const exploring=outside||mode==='overview';
    explorePanel.hidden=!exploring;seatPanel.hidden=!seated;layoutPanel.hidden=!(seated||mode==='overview');
    const tab=exploring?'explore':mode==='floor'?'levels':mode;
    root.dataset.mode=tab;
    for(const button of header.tabs.children){
      const on=button.dataset.mode===tab;button.classList.toggle('on',on);button.setAttribute('aria-pressed',on);
    }
    for(const button of cards)button.setAttribute('aria-pressed',button.dataset.view===mode);
    for(const button of routes.querySelectorAll('[data-start]'))button.classList.toggle('on',button.dataset.start===place);

    const list=byBlock.get(seat.block);
    options(block,blocks,seat.block);options(row,[...list.keys()],seat.row);
    options(number,list.get(seat.row).map(s=>s.number),seat.number);
    const l=layouts[layout];hall.setLayout(layout);
    const forward=(seat.x-l.x)*Math.sin(l.yaw)+(seat.z-l.z)*Math.cos(l.yaw);
    sightline.hidden=!(seated && layout!=='C' && forward < -l.depth/2);
    capacity.textContent=tr('최대 {0}명',l.capacity.toLocaleString(language));
    plan.update(seat.block,layout);
    for(const btn of stages){const on=btn.dataset.layout===layout;btn.setAttribute('aria-pressed',on);btn.classList.toggle('on',on);}
    badge.textContent=seated?tr('{0} 블록 · {1}열 {2}번',seat.block,seat.row,seat.number):tr(outside?'외관':mode==='section'?'단면':'전체 보기');
    hint.textContent=tr(seated?'드래그로 시선을 조절하세요.':fly?'WASD 이동 · E 상승 · Q 하강 · Shift 가속':walk?'WASD 또는 화살표로 이동 · 드래그로 시선 조절':'드래그로 회전 · 휠 또는 두 손가락으로 확대');
    orbit.enabled=!seated&&!mobile;look.enabled=seated||mobile;
    camera.fov=seated||mobile?66:46;camera.updateProjectionMatrix();
    if(fly){walker.enter(place,flyPose,true);flyPose=walker.pose();}
    else if(walk){
      walker.enter(place,savedPose);savedPose=walker.pose();
    }else if(seated){
      camera.position.set(seat.x,seat.y+1.17,seat.z);
      faceStage();
      const distance=Math.hypot(seat.x-l.x,seat.z-l.z);
      const fact=(label,value)=>h('div',null,h('dt',null,tr(label)),h('dd',null,value));
      seatReadout.replaceChildren(h('div',{class:'hud-title'},tr('블록'),' ',seat.block),
        h('div',{class:'hud-seatno'},h('b',null,tr('{0}열 {1}번',seat.row,seat.number)),h('small',null,tr(stageNames[layout]))),
        h('dl',{class:'hud-facts'},fact('무대까지',fmt(distance)+' m'),fact('눈높이','+'+fmt(camera.position.y)+' m')));
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
