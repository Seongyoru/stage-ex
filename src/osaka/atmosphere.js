import * as T from 'three';
import { entryPoint, upper } from './routes.js';
import { ground, fountain } from './grounds.js';

// One shadow map serves the forecourt. Seat instances stay out of its draw pass.
export function setupSun(renderer,sun){
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-125,right:125,top:125,bottom:-125,near:1,far:420});
  sun.shadow.camera.updateProjectionMatrix();sun.shadow.mapSize.set(2048,2048);
  sun.shadow.normalBias=.035;sun.shadow.bias=-.00018;
  sun.position.set(-110,169,-78);
}
export function nightLights(){
  const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(32,32,0,32,32,31);
  g.addColorStop(0,'rgba(255,246,205,1)');g.addColorStop(.12,'rgba(255,232,174,.80)');
  g.addColorStop(.46,'rgba(255,209,137,.19)');g.addColorStop(1,'rgba(255,201,119,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  const halo=new T.SpriteMaterial({map,color:0xffe6ac,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const pool=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:.37,blending:T.AdditiveBlending});
  const plane=new T.PlaneGeometry(9,9),group=new T.Group();
  for(const d of [8,27,48,72,92]){
    const p=entryPoint(d,-9.2),y=d<54?upper:ground;
    const shine=new T.Sprite(halo);shine.position.set(p.x,y+8.3,p.z);shine.scale.setScalar(2.2);group.add(shine);
    const glow=new T.Mesh(plane,pool);glow.rotation.x=-Math.PI/2;glow.position.set(p.x,y+.055,p.z);group.add(glow);
  }
  const lamp=new T.PointLight(0xffbd81,75,16);lamp.position.set(fountain.x,ground+3,fountain.z);group.add(lamp);
  return group;
}

export function skyTexture(night){
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
  const g=ctx.createLinearGradient(0,0,0,256);
  const colors=night?['#0c142a','#273351','#53465a','#172338']:['#548cbc','#8bb9d6','#d5e3e8','#b3b7ad'];
  for(const [i,s] of [0,.28,.5,1].entries())g.addColorStop(s,colors[i]);
  ctx.fillStyle=g;ctx.fillRect(0,0,512,256);
  if(night)for(let i=0;i<250;i++){ctx.fillStyle='rgba(245,245,235,'+(.18+(i%9)*.055)+')';ctx.fillRect(i*239%512,i*47%107,.7,.7);}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.mapping=T.EquirectangularReflectionMapping;return t;
}
