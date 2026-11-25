import { blocks, layouts, perimeter, radius, rim, straight } from './seats.js';
const ns='http://www.w3.org/2000/svg';
function svg(tag, attrs) {
  const el=document.createElementNS(ns,tag);
  for(const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
  return el;
}
export function makePlan(onSelect) {
  const root=svg('svg',{viewBox:'-69 -49 138 98','aria-hidden':'true',class:'os-plan'});
  const arc=Math.PI*radius/12, half=perimeter/2, s=straight;
  const stops=[0,s+arc,s+3*arc,s+5*arc,s+7*arc,s+9*arc,s+11*arc,half,
    half+s+arc,half+s+3*arc,half+s+5*arc,half+s+7*arc,half+s+9*arc,half+s+11*arc,perimeter];
  const groups=new Map();
  function label(group,b,x,y) {
    const el=svg('text',{x,y,'text-anchor':'middle','dominant-baseline':'central'});
    el.textContent=b;group.append(el);
  }
  for(const [i,b] of blocks.entries()) {
    const g=svg('g',{'data-block':b}); groups.set(b,g);root.append(g);
    g.addEventListener('click',()=>onSelect(b));
    if(b==='BOX') {
      g.append(svg('rect',{x:-9,y:25,width:18,height:5.8,rx:.6}));label(g,b,0,28);continue;
    }
    const start=stops[i],end=stops[i+1];
    const coords=[];
    for(const [depth,reverse] of [[1,false],[20,true]]) for(let j=0;j<=12;j++) {
      const {x,z}=rim(start+(end-start)*(reverse?12-j:j)/12,depth);
      coords.push(x.toFixed(2)+','+z.toFixed(2));
    }
    g.append(svg('polygon',{points:coords.join(' ')}));
    const mid=rim((start+end)/2,12);label(g,b,mid.x,mid.z);
  }
  const stage=svg('rect',{class:'os-plan-stage',rx:.6});
  root.append(stage);
  return {root, update(block,key){
    for(const [b,g] of groups) g.classList.toggle('selected',b===block);
    const {x,z,width,depth,yaw}=layouts[key];
    stage.setAttribute('x',-width/2);stage.setAttribute('y',-depth/2);
    stage.setAttribute('width',width);stage.setAttribute('height',depth);
    stage.setAttribute('transform','translate('+x+' '+z+') rotate('+yaw*180/Math.PI+')');
  }};
}
