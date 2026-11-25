import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LookControls } from '../app/rig.js';
import { h } from '../app/dom.js';
import { language, languageSelect, tr } from '../app/i18n.js';
import { blocks, byBlock, layouts, seats } from './seats.js';
import { buildHall } from './hall.js';
import { makePlan } from './plan.js';
import './viewer.css';

export function start() {
  const params=new URLSearchParams(location.search);
  const canvas=document.querySelector('#view');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  const scene=new T.Scene();
  scene.background=new T.Color(0x202631);
  scene.add(new T.HemisphereLight(0xfff4e7,0x929ab0,1.85));
  const sun=new T.DirectionalLight(0xffe4c7,2.2);
  sun.position.set(-35,60,20);scene.add(sun);
  const hall=buildHall(scene);
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
  let seated=params.get('view')==='seat';
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
  const modeButton=(label,mode)=>h('button',{type:'button',onClick:()=>{seated=mode;update();}},tr(label));
  const full=modeButton('전체 보기',false),pov=modeButton('좌석 시야',true);
  const capacity=h('p',{class:'os-capacity'});
  const sightline=h('p',{class:'os-sightline'},tr('이 좌석은 선택한 무대 뒤쪽입니다. 예매 전 공연별 좌석표를 확인하세요.'));
  const badge=h('span',{class:'os-badge','aria-live':'polite'});
  const hint=h('span',{class:'os-hint'},tr('드래그로 회전 · 휠 또는 두 손가락으로 확대'));
  const stages=Object.keys(layouts).map(key=>h('button',{type:'button','data-layout':key,onClick:()=>{layout=key;update();}},
    h('b',null,key),h('span',null,tr(stageNames[key]))));
  const plan=makePlan(selectBlock);
  function selectBlock(b){
    const rows=byBlock.get(b);
    const values=rows.get(seat.row)||rows.values().next().value;
    seat=values[Math.floor(values.length/2)];seated=true;update();
  }
  block.onchange=()=>selectBlock(block.value);
  row.onchange=()=>{
    const list=byBlock.get(seat.block).get(+row.value);
    seat=list.find(s=>s.number===seat.number)||list[Math.floor(list.length/2)];
    seated=true;update();
  };
  number.onchange=()=>{seat=seats.get([block.value,row.value,number.value].join('-'));seated=true;update();};
  const stage=h('section',{class:'os-viewport'},canvas,badge,hint);
  const section=(label,...children)=>h('section',{class:'os-section'},h('h2',null,tr(label)),...children);
  const panel=h('aside',{class:'os-panel'},
    section('무대 배치',h('div',{class:'os-layouts'},stages),capacity),
    section('내 좌석 찾기',plan.root,h('div',{class:'os-selectors'},field('블록',block),field('열',row),field('좌석 번호',number)),sightline),
    h('p',{class:'os-note'},tr('플로어 좌석과 무대 연출은 공연마다 달라집니다. 단차와 눈높이는 추정값입니다.'),' ',
      h('a',{href:'https://www.osaka-johall.com/seat/',target:'_blank',rel:'noopener'},tr('공식 좌석표'),' ↗')));
  const body=h('main',{class:'os-hall'},
    h('header',{class:'os-header'},h('a',{class:'wordmark',href:'?lang='+language,'aria-label':tr('공연장 선택')},'Stage ',h('i',null,'EX')),
      h('h1',{lang:'en'},'Osaka-jo Hall'),h('div',{class:'os-modes'},full,pov),
      languageSelect(code=>{const url=new URL(location.href);url.searchParams.set('lang',code);location.assign(url);})),
    h('div',{class:'os-body'},stage,panel));
  document.body.append(body);
  function overview() {
    // Fit the cutaway in the available viewport, including portrait phones.
    const distance=Math.max(139,175/camera.aspect);
    camera.position.set(.45,.95,1).normalize().multiplyScalar(distance);
    orbit.target.set(0,3,0);orbit.update();
  }
  function update() {
    const list=byBlock.get(seat.block);
    options(block,blocks,seat.block);options(row,[...list.keys()],seat.row);
    options(number,list.get(seat.row).map(s=>s.number),seat.number);
    const l=layouts[layout];hall.setLayout(layout);hall.shell.visible=seated;
    const forward=(seat.x-l.x)*Math.sin(l.yaw)+(seat.z-l.z)*Math.cos(l.yaw);
    sightline.hidden=!(seated && layout!=='C' && forward < -l.depth/2);
    capacity.textContent=tr('최대 {0}명',l.capacity.toLocaleString(language));
    plan.update(seat.block,layout);
    stages.forEach(btn=>btn.setAttribute('aria-pressed',btn.dataset.layout===layout));
    full.setAttribute('aria-pressed',!seated);pov.setAttribute('aria-pressed',seated);
    badge.textContent=seated?tr('{0} 블록 · {1}열 {2}번',seat.block,seat.row,seat.number):tr('전체 보기');
    orbit.enabled=!seated;look.enabled=seated;
    camera.fov=seated?66:46;camera.updateProjectionMatrix();
    if(seated){
      camera.position.set(seat.x,seat.y+1.17,seat.z);
      look.setDirection(new T.Vector3(l.x,2.25,l.z).sub(camera.position));
    }else overview();
    const url=new URL(location.href);
    for(const [k,v] of Object.entries({layout,view:seated?'seat':'overview',block:seat.block,row:seat.row,seat:seat.number})) url.searchParams.set(k,v);
    history.replaceState(null,'',url);redraw();
  }
  function resize(){
    const {clientWidth:w,clientHeight:h}=stage;
    if(!w||!h)return;
    camera.aspect=w/h;renderer.setSize(w,h,false);camera.updateProjectionMatrix();
    if(!seated)overview();redraw();
  }
  resize();update();new ResizeObserver(resize).observe(stage);
  document.querySelector('#loading').classList.add('done');
}
