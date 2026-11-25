import * as T from 'three';
import { byBlock, layouts, perimeter, rim, rowDepth, rowHeight, seats, straight } from './seats.js';

const unit = new T.BoxGeometry(1, 1, 1);
const paint = color => new T.MeshStandardMaterial({ color, roughness: .83 });
const light = color => new T.MeshBasicMaterial({ color });
const frame = new T.Object3D();
function box(parent, material, x, y, z, w, h, d) {
  const mesh = new T.Mesh(unit, material);
  mesh.position.set(x,y,z);
  mesh.scale.set(w,h,d);
  parent.add(mesh);
  return mesh;
}
function ring(parent, material, inside, y1, outside, y2) {
  const points = [], indices = [];
  for (let i = 0; i <= 192; i++) {
    const u = i / 192 * perimeter;
    const a = rim(u, inside), b = rim(u, outside);
    points.push(a.x,y1,a.z,b.x,y2,b.z);
    if (i) { const j=i*2; indices.push(j-2,j,j-1,j-1,j,j+1); }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points,3));
  g.setIndex(indices); g.computeVertexNormals();
  material.side = T.DoubleSide;
  parent.add(new T.Mesh(g,material));
}
function chairs(parent, places, material, backMaterial, size) {
  const cushions = new T.InstancedMesh(unit, material, places.length);
  const outline=new T.Shape();
  outline.moveTo(-.44,0);outline.lineTo(.44,0);outline.lineTo(.5,.8);
  outline.lineTo(.40,.96);outline.lineTo(.22,1);outline.lineTo(-.22,1);
  outline.lineTo(-.40,.96);outline.lineTo(-.5,.8);outline.closePath();
  const back=new T.ExtrudeGeometry(outline,{depth:1,bevelEnabled:false});
  const backs = new T.InstancedMesh(back, backMaterial, places.length);
  const supports=new T.InstancedMesh(unit,paint(0x393b3f),places.length);
  const tint=new T.Color();
  for (const [i,p] of places.entries()) {
    const angle = Math.atan2(p.nx,p.nz);
    frame.rotation.set(0,angle,0);
    frame.position.set(p.x,p.y+.42,p.z);
    frame.scale.set(size,.16,.4); frame.updateMatrix(); cushions.setMatrixAt(i,frame.matrix);
    frame.position.set(p.x,p.y+.19,p.z);
    frame.scale.set(.13,.38,.18);frame.updateMatrix();supports.setMatrixAt(i,frame.matrix);
    frame.position.set(p.x+.16*p.nx,p.y+.44,p.z+.16*p.nz);
    frame.rotateX(.12);
    frame.scale.set(size,.42,.065); frame.updateMatrix(); backs.setMatrixAt(i,frame.matrix);
    tint.setScalar(.85+.15*((i*17)%29)/28);
    backs.setColorAt(i,tint);cushions.setColorAt(i,tint);
  }
  parent.add(cushions,backs,supports);
}
function blockSigns(parent) {
  const signs=paint(0x313438);
  for (const [name,rows] of byBlock) {
    if(name==='BOX') continue;
    const row=rows.get(13);
    let gap=0, left, right;
    for(let i=1;i<row.length;i++) {
      const a=row[i-1], b=row[i], d=Math.hypot(b.x-a.x,b.z-a.z);
      if(d>gap){gap=d;left=a;right=b;}
    }
    if(gap<3)continue;
    const g=new T.Group();parent.add(g);
    g.position.set((left.x+right.x)/2,left.y,(left.z+right.z)/2);
    g.rotation.y=Math.atan2(left.nx+right.nx,left.nz+right.nz);
    box(g,signs,0,.75,.6,2.7,1.5,.55);
    const c=document.createElement('canvas');c.width=128;c.height=64;
    const ctx=c.getContext('2d');ctx.fillStyle='#33383a';ctx.fillRect(0,0,128,64);
    ctx.fillStyle='#eee7d4';ctx.font='bold 42px Arial';ctx.textAlign='center';ctx.fillText(name,64,47);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    const placard=new T.Mesh(new T.PlaneGeometry(1.7,.85),new T.MeshBasicMaterial({map}));
    placard.rotation.y=Math.PI;placard.position.set(0,.96,.31);g.add(placard);
  }
}
function displayTexture() {
  const c=document.createElement('canvas'); c.width=1024; c.height=320;
  const g=c.getContext('2d');
  const bg=g.createLinearGradient(0,0,1024,320);
  bg.addColorStop(0,'#232f64'); bg.addColorStop(.45,'#67417c'); bg.addColorStop(1,'#e18463');
  g.fillStyle=bg; g.fillRect(0,0,1024,320);
  for(let i=0;i<33;i++) {
    g.beginPath(); g.moveTo(-30,87+i*4);
    g.bezierCurveTo(270,360+i*3,490,-100+i*4,1080,35+i*8);
    g.strokeStyle='rgba(255,221,186,.52)';g.lineWidth=1.7;g.stroke();
  }
  g.fillStyle='#fff8e9';g.textAlign='center';g.font='bold 66px Arial';
  g.fillText('OSAKA-JO HALL',512,180);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  return new T.MeshBasicMaterial({map});
}

export function buildHall(scene) {
  const concrete=paint(0x746e69),riser=paint(0x49474a), metal=paint(0x41444e);
  const stageDark=paint(0x272731), trim=light(0xedac80), teal=light(0x91d6db);
  const led=displayTexture();
  // The venue publishes an 83.4 x 48.2 m arena floor and a 21 m ceiling.
  ring(scene,paint(0x665b51),-24.7,.01,-.52,.01);
  ring(scene,riser,-.52,0,-.52,rowHeight(1));
  for (let r=1;r<=22;r++) {
    const d=rowDepth(r);
    const next=r===22?d+.65:rowDepth(r+1)-.48;
    ring(scene,concrete,d-.48,rowHeight(r),next,rowHeight(r));
    if(r<22) ring(scene,riser,next,rowHeight(r),next,rowHeight(r+1));
  }
  chairs(scene,[...seats.values()],paint(0x9c6145),paint(0xb87b52),.48);
  blockSigns(scene);
  ring(scene,paint(0x393b42),-.56,.12,-.56,1.60);
  ring(scene,paint(0xbcab91),-.59,1.63,-.47,1.63);
  ring(scene,paint(0x53515a),rowDepth(22)+.65,rowHeight(22),rowDepth(22)+2.7,rowHeight(22));
  const shell=new T.Group();scene.add(shell);
  ring(shell,paint(0x42424c),rowDepth(22)+2.7,rowHeight(22),rowDepth(22)+2.7,18.6);
  ring(shell,paint(0x383b43),rowDepth(22)+2.7,18.6,-24.7,21.6);
  // Exposed curved roof ribs read from a seat; the overview cuts away the roof.
  const steel=paint(0x72757d);
  for(let x=-52;x<=52;x+=6.5) {
    const end=Math.sqrt(46**2-Math.max(0,Math.abs(x)-straight)**2);
    for(let i=0;i<10;i++) {
      const z0=end*(i/5-1),z1=end*((i+1)/5-1);
      const height=z=>20.6-2.9*(z/end)**2;
      const dy=height(z1)-height(z0);
      const rib=box(shell,steel,x,(height(z1)+height(z0))/2,(z0+z1)/2,.19,.26,Math.hypot(z1-z0,dy));
      rib.rotation.x=-Math.atan2(dy,z1-z0);
    }
  }
  const pale=light(0xfde9bd);
  for(const z of [-16,16]) {
    box(shell,metal,0,17.9,z,65,.23,.45);
    for(let x=-30;x<=30;x+=6) box(shell,pale,x,17.7,z,.72,.1,.32);
  }
  const floorMat=paint(0x405864), floorBack=paint(0x59717a);
  const shows={};
  for (const [key,layout] of Object.entries(layouts)) {
    const group=new T.Group();scene.add(group);shows[key]=group;
    const stage=new T.Group();
    stage.position.set(layout.x,0,layout.z);stage.rotation.y=layout.yaw;
    group.add(stage);
    const w=layout.width,d=layout.depth;
    box(stage,stageDark,0,.76,0,w,1.5,d);
    box(stage,trim,0,1.48,d/2,w,.09,.09);
    if(key!=='C') {
      box(stage,metal,0,5.35,-d/2+.2,w*.94,6.6,.4);
      const display=new T.Mesh(new T.PlaneGeometry(w*.92,6.35),led);
      display.position.set(0,5.35,-d/2+.42);stage.add(display);
      for(const side of [-1,1]) {
        box(stage,stageDark,side*(w/2+.7),4.8,-1,1.1,5.4,1);
        box(stage,teal,side*(w/2-.3),4.9,-d/2+.55,.11,7.1,.12);
      }
      const boomY=9.2,boomZ=1.8;
      for(const y of [boomY,boomY+.5]) box(stage,steel,0,y,boomZ,w+.9,.1,.13);
      for(let x=-w/2;x<w/2;x+=1) {
        const brace=box(stage,steel,x+.4,boomY+.25,boomZ,.08,1.05,.1);
        brace.rotation.z=x%2===0?1.06:-1.06;
      }
      for(let i=0;i<8;i++){
        const x=(i-3.5)*w/8;
        box(stage,stageDark,x,boomY-.22,boomZ,.46,.44,.5);
        box(stage,i%2?teal:trim,x,boomY-.44,boomZ+.12,.32,.07,.28);
      }
      for(const x of [-w*.32,0,w*.32]) {
        const monitor=box(stage,stageDark,x,1.85,d/2-.75,.94,.55,.58);
        monitor.rotation.x=-.25;
      }
    } else {
      box(stage,trim,0,1.48,-d/2,w,.09,.09);
      for(const side of [-1,1]) box(stage,trim,side*w/2,1.48,0,.09,.09,d);
      box(stage,stageDark,0,11,0,6.4,2.8,6.4);
      for(let i=0;i<4;i++){
        const face=new T.Mesh(new T.PlaneGeometry(6.2,2.6),led);
        face.rotation.y=i*Math.PI/2;
        face.position.set(Math.sin(face.rotation.y)*3.22,11,Math.cos(face.rotation.y)*3.22);
        stage.add(face);
      }
    }
    // Movable floor banks illustrate the layouts; exact seats vary by event.
    const floorSeats=[];
    for(let i=-49;i<=49;i++) for(let j=-28;j<=28;j++) {
      if(Math.abs(i)%12===0 || Math.abs(j)%10===0) continue;
      const x=i*.78,z=j*.79;
      if(Math.hypot(Math.max(0,Math.abs(x)-straight),z)>22.2) continue;
      if(key==='A' && (z< -9 || Math.abs(x)>23 || (z< -3 && Math.abs(x)>18))) continue;
      if(key==='B' && x< -25) continue;
      if(key==='C' && ((Math.abs(x)<8 && Math.abs(z)<8) || Math.abs(Math.abs(x)*.68-Math.abs(z))<1.2)) continue;
      let dx=x-layout.x,dz=z-layout.z;
      if(key==='A'){dx=0;dz=1;} if(key==='B'){dx=1;dz=0;}
      const len=Math.hypot(dx,dz);
      floorSeats.push({x,z,y:0,nx:dx/len,nz:dz/len});
    }
    chairs(group,floorSeats,floorMat,floorBack,.48);
  }
  return {shell, setLayout(key){for(const [k,g] of Object.entries(shows)) g.visible=k===key;}};
}
