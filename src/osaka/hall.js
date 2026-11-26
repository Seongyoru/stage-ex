import { gateAt } from './routes.js';
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
function ring(parent, material, inside, y1, outside, y2, openings = false) {
  const points = [], indices = [], uv=[];
  for (let i = 0; i <= 192; i++) {
    const u = i / 192 * perimeter;
    const a = rim(u, inside), b = rim(u, outside);
    points.push(a.x,y1,a.z,b.x,y2,b.z);
    if(Math.abs(inside-outside)>.01)uv.push(a.x/4,a.z/4,b.x/4,b.z/4);
    else uv.push(u/4,y1/4,u/4,y2/4);
    const mid=rim(u-perimeter/384,inside);
    const gap=openings==='arena'?gateAt(mid.x,mid.z,2.6):openings&&Math.abs(mid.x)<4.6;
    if (i && !gap) {
      const j=i*2; indices.push(j-2,j,j-1,j-1,j,j+1);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(indices); g.computeVertexNormals();
  material.side = T.DoubleSide;
  parent.add(new T.Mesh(g,material));
}
function chairs(parent, places, material, backMaterial, size, folding=false) {
  // Round the upholstered edges once, then instance the same meshes across each bank.
  const pad=new T.Shape();
  pad.moveTo(-.42,-.5);pad.lineTo(.42,-.5);pad.quadraticCurveTo(.5,-.5,.5,-.38);
  pad.lineTo(.48,.38);pad.quadraticCurveTo(.47,.5,.35,.5);pad.lineTo(-.35,.5);
  pad.quadraticCurveTo(-.47,.5,-.48,.38);pad.lineTo(-.5,-.38);pad.quadraticCurveTo(-.5,-.5,-.42,-.5);
  const cushion=new T.ExtrudeGeometry(pad,{depth:.85,bevelEnabled:false,curveSegments:2});
  cushion.rotateX(-Math.PI/2);cushion.translate(0,-.43,0);
  const cushions=new T.InstancedMesh(folding?unit:cushion,material,places.length);
  const outline=new T.Shape();
  outline.moveTo(-.40,0);outline.lineTo(.40,0);outline.lineTo(.49,.67);
  outline.quadraticCurveTo(.52,.97,.32,1);outline.quadraticCurveTo(0,1.08,-.32,1);
  outline.quadraticCurveTo(-.52,.97,-.49,.67);outline.closePath();
  const back=new T.ExtrudeGeometry(outline,{depth:1,bevelEnabled:false,curveSegments:3});
  // A shallow wrap at the two shoulders gives the backrest a readable highlight.
  const position=back.attributes.position;
  for(let i=0;i<position.count;i++)position.setZ(i,position.getZ(i)-2.5*position.getX(i)**2);
  back.computeVertexNormals();
  const backs=new T.InstancedMesh(folding?unit:back,backMaterial,places.length);
  const supports=new T.InstancedMesh(unit,paint(0x393b3f),places.length);
  const arms=folding?null:new T.InstancedMesh(unit,paint(0x35373b),places.length);
  const tint=new T.Color();
  for (const [i,p] of places.entries()) {
    const angle = Math.atan2(p.nx,p.nz);
    frame.rotation.set(0,angle,0);
    frame.position.set(p.x,p.y+.42,p.z);
    frame.scale.set(size,.16,.4); frame.updateMatrix(); cushions.setMatrixAt(i,frame.matrix);
    frame.position.set(p.x,p.y+.19,p.z);
    frame.scale.set(.13,.38,.18);frame.updateMatrix();supports.setMatrixAt(i,frame.matrix);
    if(arms){
      frame.position.set(p.x+p.nz*size*.52,p.y+.61,p.z-p.nx*size*.52);
      frame.scale.set(.046,.048,.30);frame.updateMatrix();arms.setMatrixAt(i,frame.matrix);
    }
    frame.position.set(p.x+.16*p.nx,p.y+(folding?.65:.44),p.z+.16*p.nz);
    frame.rotateX(.12);
    frame.scale.set(size,.42,.065); frame.updateMatrix(); backs.setMatrixAt(i,frame.matrix);
    tint.setScalar(.85+.15*((i*17)%29)/28);
    backs.setColorAt(i,tint);cushions.setColorAt(i,tint);
  }
  parent.add(cushions,backs,supports);
  if(arms)parent.add(arms);
  return [cushions,backs];
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
    const ctx=c.getContext('2d');ctx.fillStyle='#215345';ctx.fillRect(0,0,128,64);
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

export function buildHall(scene,redraw) {
  const concrete=paint(0x746e69),riser=paint(0x49474a), metal=paint(0x41444e);
  const loader=new T.TextureLoader();
  function finish(material,name){
    const map=loader.load('./textures/'+name+'_albedo.webp',redraw);
    map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    material.map=map;return material;
  }
  finish(concrete,'concrete_stand');
  const stageDark=paint(0x272731), trim=light(0xedac80), teal=light(0x91d6db);
  const led=displayTexture();
  // The venue publishes an 83.4 x 48.2 m arena floor and a 21 m ceiling.
  ring(scene,finish(paint(0xaeccd5),'concrete_floor_sealed'),-24.7,.01,-.52,.01);
  ring(scene,riser,-.52,0,-.52,rowHeight(1),'arena');
  for (let r=1;r<=22;r++) {
    const d=rowDepth(r);
    const next=r===22?d+.65:rowDepth(r+1)-.48;
    ring(scene,concrete,d-.48,rowHeight(r),next,rowHeight(r));
    if(r<22) ring(scene,riser,next,rowHeight(r),next,rowHeight(r+1));
  }
  const standSeats=[...seats.values()];
  const upholstery=finish(paint(0xffc6a1),'seat_fabric_vermilion');
  const pickable=chairs(scene,standSeats,upholstery,paint(0xd95731),.48);
  blockSigns(scene);
  // Add an intermediate tread in each actual seat-row gap, with a contrasting nosing.
  const steps=[],edges=[];
  for(const [block,rows] of byBlock){
    if(block==='BOX')continue;
    for(const [r,row] of rows){
      if(r===12||r===22)continue;
      for(let i=1;i<row.length;i++){
        const a=row[i-1],b=row[i],gap=Math.hypot(b.x-a.x,b.z-a.z);
        if(gap<1.35||gap>3.8)continue;
        const nx=(a.nx+b.nx)/2,nz=(a.nz+b.nz)/2,x=(a.x+b.x)/2,z=(a.z+b.z)/2;
        frame.rotation.set(0,Math.atan2(nx,nz),0);
        frame.position.set(x+.22*nx,a.y+.10,z+.22*nz);frame.scale.set(gap-.59,.2,.43);
        frame.updateMatrix();steps.push(frame.matrix.clone());
        frame.position.set(x+.045*nx,a.y+.204,z+.045*nz);frame.scale.set(gap-.61,.008,.046);
        frame.updateMatrix();edges.push(frame.matrix.clone());
      }
    }
  }
  for(const [mat,matrices] of [[concrete,steps],[paint(0xcebe95),edges]]){
    const mesh=new T.InstancedMesh(unit,mat,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));scene.add(mesh);
  }
  ring(scene,paint(0x393b42),-.56,.12,-.56,1.60,'arena');
  ring(scene,paint(0xbcab91),-.59,1.63,-.47,1.63,'arena');
  const fascia=paint(0xe1dcd2);
  ring(scene,fascia,-.61,1.04,-.61,1.61,'arena');
  ring(scene,paint(0x53515a),rowDepth(22)+.65,rowHeight(22),rowDepth(22)+2.7,rowHeight(22));
  const shell=new T.Group();scene.add(shell);
  const backWall=paint(0x42424c), wallDepth=rowDepth(22)+2.7;
  ring(shell,backWall,wallDepth,rowHeight(22),wallDepth,rowHeight(22)+3.6,true);
  const acoustic=finish(paint(0xbbaba1),'acoustic_ribbed_dark');
  ring(shell,acoustic,wallDepth,rowHeight(22)+3.6,wallDepth,18.6);
  const galleryPosts=[],galleryLamps=[];
  for(let i=0;i<90;i++){
    const p=rim(i*perimeter/90,wallDepth-.10);
    frame.rotation.set(0,Math.atan2(p.nx,p.nz),0);
    frame.position.set(p.x,16.7,p.z);frame.scale.set(.12,3.23,.18);
    frame.updateMatrix();galleryPosts.push(frame.matrix.clone());
    if(i%3===0){
      frame.position.set(p.x-.20*p.nx,16.02,p.z-.20*p.nz);
      frame.scale.set(.92,.075,.24);frame.updateMatrix();galleryLamps.push(frame.matrix.clone());
    }
  }
  for(const [mat,matrices] of [[metal,galleryPosts],[light(0xffe8b9),galleryLamps]]){
    const mesh=new T.InstancedMesh(unit,mat,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));shell.add(mesh);
  }
  ring(shell,metal,wallDepth-.20,14.75,wallDepth,14.88);

  ring(shell,finish(paint(0x888d94),'acoustic_ribbed_dark'),rowDepth(22)+2.7,18.6,-24.7,21.6);
  // Exposed curved roof ribs read from a seat; the overview cuts away the roof.
  const steel=paint(0x72757d);
  const trussParts=[];
  const beam=(a,b,w)=>{
    const delta=b.clone().sub(a),m=new T.Object3D();
    m.position.copy(a).addScaledVector(delta,.5);m.scale.set(w,delta.length(),w);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    m.updateMatrix();trussParts.push(m.matrix.clone());
  };
  for(let x=-52;x<=52;x+=6.5) {
    const end=Math.sqrt(46**2-Math.max(0,Math.abs(x)-straight)**2);
    for(let i=0;i<10;i++) {
      const z0=end*(i/5-1),z1=end*((i+1)/5-1);
      const height=z=>20.6-2.9*(z/end)**2;
      beam(new T.Vector3(x,height(z0),z0),new T.Vector3(x,height(z1),z1),.23);
      const v=(z,y)=>new T.Vector3(x,y,z);
      beam(v(z0,height(z0)-1.15),v(z1,height(z1)-1.15),.085);
      beam(v(z0,height(z0)-1.15),v((z0+z1)/2,(height(z0)+height(z1))/2),.069);
      beam(v((z0+z1)/2,(height(z0)+height(z1))/2),v(z1,height(z1)-1.15),.069);
    }
  }
  const lattice=new T.InstancedMesh(unit,steel,trussParts.length);
  trussParts.forEach((matrix,i)=>lattice.setMatrixAt(i,matrix));shell.add(lattice);
  const pale=light(0xfde9bd);
  for(const z of [-16,16]) {
    box(shell,metal,0,17.9,z,65,.23,.45);
    for(let x=-30;x<=30;x+=6) box(shell,pale,x,17.7,z,.72,.1,.32);
  }
  const floorMat=paint(0x405864), floorBack=paint(0x59717a);
  const shows={}, lighting=new T.Group();
  shell.add(lighting);
  // Central cluster and eighteen distributed speakers on the public equipment list.
  box(lighting,stageDark,0,17.4,0,3.4,2.3,2.8);
  for(let i=0;i<18;i++){
    const a=i*Math.PI/9;
    const speaker=box(lighting,stageDark,36*Math.cos(a),16.8,22*Math.sin(a),.95,1.3,.72);
    speaker.rotation.y=-a;
  }
  const concert=[];
  for (const [key,layout] of Object.entries(layouts)) {
    const group=new T.Group();scene.add(group);shows[key]=group;
    const stage=new T.Group();
    stage.position.set(layout.x,0,layout.z);stage.rotation.y=layout.yaw;
    group.add(stage);
    const w=layout.width,d=layout.depth;
    const beams=new T.Group();stage.add(beams);concert.push(beams);beams.visible=false;
    for(let i=0;i<8;i++){
      const color=i%2?0x7fcfff:0xf0a0d3;
      const beam=new T.Mesh(new T.ConeGeometry(1.32,8.2,16,1,true),
        new T.MeshBasicMaterial({color,transparent:true,opacity:.085,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));
      beam.position.set((i-3.5)*w/8,5.5,1.5);beam.rotation.z=(i-3.5)*.075;beams.add(beam);
    }
    const wash=new T.PointLight(0x98bcff,120,24);wash.position.set(0,5,2);beams.add(wash);
    box(stage,stageDark,0,.76,0,w,1.5,d);
    box(stage,trim,0,1.48,d/2,w,.09,.09);
    if(key!=='C') {
      box(stage,metal,0,5.35,-d/2+.2,w*.94,6.6,.4);
      const display=new T.Mesh(new T.PlaneGeometry(w*.92,6.35),led);
      display.position.set(0,5.35,-d/2+.42);stage.add(display);
      for(const side of [-1,1]) {
        for(let module=0;module<7;module++){
          const y=7.15-module*.64,z=-1+module*module*.009;
          const enclosure=box(stage,stageDark,side*(w/2+.7),y,z,1.12,.62,.78);
          enclosure.rotation.x=-module*.045;
          const grille=box(stage,metal,side*(w/2+.7),y,z+.37,1.01,.49,.045);
          grille.rotation.x=enclosure.rotation.x;
        }
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
    chairs(group,floorSeats,floorMat,floorBack,.48,true);
  }
  return {shell, pickable, standSeats, setShow(on){concert.forEach(g=>{g.visible=on;});},
    setLayout(key){for(const [k,g] of Object.entries(shows)) g.visible=k===key;}};
}
