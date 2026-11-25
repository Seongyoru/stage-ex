import { floorAt, places } from './grounds.js';

// Walking and touch controls share the same surface as the stairs and concourse.
// Advance only while an input is held. Drag-to-look is handled by LookControls.
export function walking(camera, look, canvas, onMove, onRest, onSeat) {
  let active=false, animation=0, previous=0;
  let position=null;
  const held=new Set(), touch=new Map();
  const bindings={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',
    KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'run',ShiftRight:'run'};
  function stop(){
    held.clear();touch.clear();cancelAnimationFrame(animation);
    animation=0;previous=0;
    if(active)onRest();
  }
  function advance(x,z){
    const y=floorAt(x,z);
    if(y===null || Math.abs(y-position.y)>.32) return;
    Object.assign(position,{x,y,z});
  }
  function tick(time){
    animation=0;
    if(!active || (!held.size&&!touch.size)){previous=0;return;}
    const dt=Math.min(.08,(time-(previous||time))/1000);previous=time;
    const dirs=new Set([...held].map(key=>bindings[key]).concat([...touch.values()]));
    const f=Number(dirs.has('up'))-Number(dirs.has('down'));
    const s=Number(dirs.has('right'))-Number(dirs.has('left'));
    if(f||s){
      const step=dt*(dirs.has('run')?9:4.6)/Math.hypot(f,s);
      const sin=Math.sin(look.yaw),cos=Math.cos(look.yaw);
      const dx=(s*cos-f*sin)*step,dz=(-s*sin-f*cos)*step;
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));
      for(let i=0;i<steps;i++){advance(position.x+dx/steps,position.z);advance(position.x,position.z+dz/steps);}
      camera.position.set(position.x,position.y+1.62,position.z);
      onMove(position);
    }
    animation=requestAnimationFrame(tick);
  }
  function wake(){if(!animation)animation=requestAnimationFrame(tick);}
  window.addEventListener('keydown',e=>{
    if(!active||e.ctrlKey||e.altKey||e.metaKey||/^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName))return;
    if(e.code==='KeyE'&&!e.repeat){onSeat();return;}
    if(!bindings[e.code])return;
    e.preventDefault();held.add(e.code);wake();
  });
  window.addEventListener('keyup',e=>{
    if(!held.delete(e.code))return;
    if(!held.size&&!touch.size)stop();
  });
  window.addEventListener('blur',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  return {
    enter(place,saved){
      const fallback=places[place]||places.plaza;
      const from=saved && Number.isFinite(saved.yaw) && Number.isFinite(saved.pitch)
        && floorAt(saved.x,saved.z)!==null?saved:fallback;
      position={x:from.x,z:from.z,y:floorAt(from.x,from.z)};
      look.yaw=from.yaw;look.pitch=Math.max(-1.3,Math.min(1.3,from.pitch||0));look.apply();
      camera.position.set(position.x,position.y+1.62,position.z);
      active=true;onMove(position);
    },
    leave(){active=false;stop();},
    pose(){return position && {x:position.x,z:position.z,yaw:look.yaw,pitch:look.pitch};},
    bind(button,direction){
      button.addEventListener('pointerdown',e=>{
        if(!active)return;
        e.preventDefault();button.setPointerCapture(e.pointerId);touch.set(e.pointerId,direction);wake();
      });
      const release=e=>{if(touch.delete(e.pointerId)&&!touch.size&&!held.size)stop();};
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
      button.addEventListener('click',e=>{
        if(e.detail!==0||!active)return;
        // Activation from a keyboard or assistive technology takes a single step.
        const a=look.yaw+({up:0,right:-Math.PI/2,down:Math.PI,left:Math.PI/2}[direction]);
        for(let i=0;i<5;i++)advance(position.x-.12*Math.sin(a),position.z-.12*Math.cos(a));
        camera.position.set(position.x,position.y+1.62,position.z);onMove(position);onRest();
      });
    },
    focus(){canvas.focus({preventScroll:true});},
  };
}
