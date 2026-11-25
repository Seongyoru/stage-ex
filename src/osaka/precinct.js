import * as T from 'three';
import city from './city.json';
import { ground, deck, facade, stairHalf, tread, treads } from './grounds.js';
import { entryPoint, gates, pillarPosition, stair, stairPoint, stairHeight } from './routes.js';
import { rim, perimeter, radius } from './seats.js';
import { loadProps } from '../app/assets.js';

// Osaka City 2022 CityGML (MLIT PLATEAU). Local X follows the surveyed long wall.
// The aerial mosaic is a rotated crop of the MLIT PLATEAU-Ortho 2024 tiles.
export function precinct(kit, redraw){
  const {root,box,strip,sign,stone,tile,bronze,concrete,wood,porcelain,lamp,foliage,instance,crown,cylinder}=kit;
  const loader=new T.TextureLoader();
  function texture(path){
    const t=loader.load(path,redraw);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  }
  const skyMap=texture('./venues/osaka-park.webp');
  const groundShape=new T.Shape([[-480,-480],[480,-480],[480,480],[-480,480]].map(([x,z])=>new T.Vector2(x,-z)));
  const hole=new T.Path();
  for(let i=0;i<=160;i++){
    const p=rim(i/160*perimeter,facade-radius-.05);
    if(i===0)hole.moveTo(p.x,-p.z);else hole.lineTo(p.x,-p.z);
  }
  groundShape.holes.push(hole);
  const land=new T.ShapeGeometry(groundShape),pos=land.attributes.position,uv=land.attributes.uv;
  for(let i=0;i<pos.count;i++)uv.setXY(i,.5+pos.getX(i)/960,.5+pos.getY(i)/960);
  land.rotateX(-Math.PI/2);
  const landscape=new T.Mesh(land,new T.MeshStandardMaterial({map:skyMap,roughness:1,side:T.DoubleSide}));
  landscape.position.y=ground-.045;root.add(landscape);
  const facadeMap=texture('./textures/facade_office_glass_albedo.webp');
  facadeMap.wrapS=facadeMap.wrapT=T.RepeatWrapping;
  const sides=new T.MeshStandardMaterial({map:facadeMap,color:0xd4dde0,side:T.DoubleSide});
  const roofs=new T.MeshStandardMaterial({color:0xa5aaa8,side:T.DoubleSide});
  const walls=[],wallUV=[],tops=[];
  for(const [height,foot] of city.buildings){
    const ring=foot.map(([x,z])=>new T.Vector2(x,z));
    for(const tri of T.ShapeUtils.triangulateShape(ring,[])){
      for(const i of tri)tops.push(ring[i].x,ground+height,ring[i].y);
    }
    for(let i=0;i<foot.length;i++){
      const [x,z]=foot[i],[xx,zz]=foot[(i+1)%foot.length],w=Math.hypot(xx-x,zz-z)/13,h=height/15;
      walls.push(x,ground,z,xx,ground,zz,xx,ground+height,zz,x,ground,z,xx,ground+height,zz,x,ground+height,z);
      wallUV.push(0,0,w,0,w,h,0,0,w,h,0,h);
    }
  }
  function mesh(vertices,coords,material){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    if(coords)g.setAttribute('uv',new T.Float32BufferAttribute(coords,2));g.computeVertexNormals();
    const m=new T.Mesh(g,material);root.add(m);return m;
  }
  mesh(walls,wallUV,sides);mesh(tops,null,roofs);
  // Survey outline, 20.9 m measured height. The intermediate dome sections are inferred.
  const copper=new T.MeshStandardMaterial({map:texture('./venues/osaka-roof.webp'),roughness:.68,metalness:.09,side:T.DoubleSide});
  const roofVerts=[],roofUV=[];
  function roofPoint([x,z],t){
    const end=T.MathUtils.clamp(x,-17.6,17.6);
    return [end+(x-end)*t,ground+20.9-8*t*t,z*t];
  }
  for(let i=0;i<city.roof.length;i++)for(let j=0;j<20;j++){
    const a=city.roof[i],b=city.roof[(i+1)%city.roof.length];
    for(const [p,t] of [[a,j],[a,j+1],[b,j+1],[a,j],[b,j+1],[b,j]]){
      const v=roofPoint(p,t/20);roofVerts.push(...v);roofUV.push(.5+v[0]/140,.5-v[2]/(296/2.8));
    }
  }
  const roofMesh=mesh(roofVerts,roofUV,copper);roofMesh.userData.roof=true;
  const seams=[];
  for(const t of [.19,.36,.52,.68,.83,.98]){
    city.roof.forEach((p,i)=>{
      for(const q of [p,city.roof[(i+1)%city.roof.length]]){
        const v=roofPoint(q,t);seams.push(v[0],v[1]+.045,v[2]);
      }
    });
  }
  const ribs=new T.BufferGeometry();ribs.setAttribute('position',new T.Float32BufferAttribute(seams,3));
  const rings=new T.LineSegments(ribs,new T.LineBasicMaterial({color:0x6d8581}));
  const ridge=new T.Mesh(new T.BoxGeometry(35.5,.35,1.65),bronze);
  ridge.position.y=ground+20.97;root.add(rings,ridge);
  root.userData.roofParts=[roofMesh,rings,ridge];
  strip(stone,facade,0,facade,ground);
  const apronMap=texture('./textures/metal_panel_white_albedo.webp');
  apronMap.wrapS=apronMap.wrapT=T.RepeatWrapping;
  const terrace=new T.MeshStandardMaterial({map:apronMap,color:0x9ba39b,roughness:.8});
  strip(terrace,facade,deck+5.17,47.4,ground+12.81,{planar:true});
  // North approach follows the oblique stone embankment beside the river.
  const dir=entryPoint(1),origin=entryPoint(0);
  const yaw=Math.atan2(dir.x-origin.x,dir.z-origin.z);
  function landing(d0,d1,y,side0=-stairHalf,side1=stairHalf){
    // Clip against the straight lobby front to avoid coplanar surfaces inside it.
    const ring=[entryPoint(d0,side0),entryPoint(d1,side0),entryPoint(d1,side1),entryPoint(d0,side1)];
    const pts=[];
    for(let i=0;i<4;i++){
      const a=ring[i],b=ring[(i+1)%4];
      if(a.z<=-facade)pts.push(a);
      if((a.z< -facade)!==(b.z< -facade))pts.push({x:a.x+(b.x-a.x)*(-facade-a.z)/(b.z-a.z),z:-facade});
    }
    const vv=[],uu=[],wall=[],wu=[];
    for(let i=1;i<pts.length-1;i++)for(const p of [pts[0],pts[i],pts[i+1]]){vv.push(p.x,y,p.z);uu.push(p.x/4,p.z/4);}
    pts.forEach((a,i)=>{
      const b=pts[(i+1)%pts.length];if(a.z===-facade&&b.z===-facade)return;
      const w=Math.hypot(b.x-a.x,b.z-a.z)/3.5,h=(y-ground)/3;
      wall.push(a.x,ground,a.z,b.x,ground,b.z,b.x,y,b.z,a.x,ground,a.z,b.x,y,b.z,a.x,y,a.z);
      wu.push(0,0,w,0,w,h,0,0,w,h,0,h);
    });
    if(vv.length)mesh(vv,uu,tile);if(wall.length)mesh(wall,wu,stone);
  }
  landing(-6,54,deck);
  landing(54+treads*tread,121,ground+.025);
  landing(15,53,deck+1.65,10.03,22);
  for(let i=0;i<12;i++){
    const p=entryPoint(17+i*3.1,11.6);
    box(foliage[i%3],p.x,deck+2.18,p.z,1.45,.92,3.18,yaw);
    if(i%3===0){
      instance(cylinder,wood,p.x,deck+3.25,p.z,.16,3.2,.16);
      instance(crown,foliage[(i+1)%3],p.x,deck+5.1,p.z,1.7,1.9,1.6,i);
    }
  }
  for(let n=0;n<treads;n++){
    const p=entryPoint(54+(n+.5)*tread),h=(treads-n)*(deck-ground)/treads;
    box(concrete,p.x,ground+h/2,p.z,20,h,tread,yaw);
  }
  for(const side of [-1,1]){
    for(let n=0;n<10;n++){
      const p=entryPoint(3+n*5.25,side*9.84);
      box(bronze,p.x,deck+.52,p.z,.08,1.04,.08);
      box(bronze,p.x,deck+1,p.z,.07,.07,5.27,yaw);
    }
    for(let n=0;n<treads;n+=3){
      const p=entryPoint(54+(n+1.5)*tread,side*9.84);
      box(bronze,p.x,deck+.92-(n+1.5)*(deck-ground)/treads,p.z,.08,.08,3*tread+.09,yaw,.35);
    }
  }
  // First-floor public concourse and its two independent stair flights.
  strip(tile,23.8,.014,facade,.014,{planar:true});
  strip(concrete,47.8,3.65,51.2,3.65,{planar:true});
  strip(concrete,51.2,3.65,55.4,3.65,{planar:true,omit:p=>Math.abs(Math.atan2(p.z,Math.abs(p.x)-17.6)*53.3)<14});
  strip(concrete,55.4,3.65,facade,3.65,{planar:true});
  strip(concrete,47.7,0,47.7,3.5,{omit:p=>Boolean(gates.some(g=>(p.x-g.cx)*g.nx+p.z*g.nz>20&&Math.abs((p.x-g.cx)*g.nz-p.z*g.nx)<2.7))});
  strip(concrete,47.7,3.5,47.7,deck);
  for(const side of [-1,1]){
    for(let i=0;i<stair.steps;i++){
      const d=-14+(i+.5)*stair.run/stair.steps,p=stairPoint(side,d,53.3),y=stairHeight(d);
      box(concrete,p.x,y-.14,p.z,stair.outer-stair.inner,.28,.48,-d/53.3);
      for(const r of [stair.inner,stair.outer]){
        const q=stairPoint(side,d,r);
        if(i%4===0)box(bronze,q.x,y+.5,q.z,.06,.94,.06);
        box(bronze,q.x,y+1,q.z,.07,.09,.51,-d/53.3,side*.36);
      }
    }
  }
  const doors=new Map();
  for(const g of gates){
    const yaw=Math.atan2(g.nx,g.nz), along=(r,s=0)=>({x:g.cx+g.nx*r+g.nz*s,z:g.nz*r-g.nx*s});
    for(const s of [-2.6,2.6]){
      const p=along(36,s);box(concrete,p.x,1.55,p.z,.18,3.1,24,yaw);
    }
    const c=along(38);
    box(concrete,c.x,2.94,c.z,5.3,.18,20,yaw);
    for(const r of [30,37,44]){const p=along(r);box(lamp,p.x,2.80,p.z,1.4,.07,.22,yaw);}
    const p=along(47.9);
    const board=sign('ARENA   '+g.id,4.4,.72,p.x,3.37,p.z,1,'#333450');board.rotation.y=yaw;
    const frame=new T.Group();frame.position.set(p.x,0,p.z);frame.rotation.y=yaw;root.add(frame);
    const leaves=[];
    for(const side of [-1,1]){
      const leaf=new T.Mesh(new T.BoxGeometry(2.4,2.83,.14),new T.MeshStandardMaterial({color:0x394b56}));
      leaf.position.set(side*1.21,1.43,0);frame.add(leaf);leaves.push(leaf);
      const window=new T.Mesh(new T.BoxGeometry(.7,.52,.16),bronze);
      window.position.set(0,.53,0);leaf.add(window);
      const handle=new T.Mesh(new T.BoxGeometry(.056,.42,.2),porcelain);
      handle.position.x=-side*.82;leaf.add(handle);
    }
    doors.set(g.id,{leaves,open:false,amount:0});
  }
  const cream=new T.MeshStandardMaterial({color:0xdfcfad});
  for(let n=1;n<=46;n++){
    const p=pillarPosition(n,57.7),yaw=Math.atan2(p.nx,p.nz);
    for(const base of [0,deck]){
      box(cream,p.x,base+1.65,p.z,.43,3.3,.43,yaw);
      const s=sign(String(n).padStart(2,'0'),.52,.42,p.x-.25*p.nx,base+2.4,p.z-.25*p.nz,1);
      s.rotation.y=yaw+Math.PI;
    }
  }
  for(const [n,base] of [[8,0],[14,0],[14,deck]]){
    const p=pillarPosition(n,57.3),yaw=Math.atan2(p.nx,p.nz);
    box(wood,p.x,base+.55,p.z,4.8,1.1,.9,yaw);
    const s=sign('売店   KIOSK',4.8,.65,p.x-.5*p.nx,base+2.45,p.z-.5*p.nz,1);
    s.rotation.y=yaw+Math.PI;
  }
  root.userData.doors=doors;
  const street=[8,27,48,72,92].map(d=>{const p=entryPoint(d,-9.2);return [p.x,d<54?deck:ground,p.z];});
  const benches=[14,36,80].map(d=>{const p=entryPoint(d,8.6);return [p.x,d<54?deck:ground,p.z,yaw];});
  loadProps([{street_light:street,bench:benches,foyer_totem:[[-4.8,deck,-54],[4.8,deck,54]],
    moving_head:[[-9,17.8,16],[9,17.8,16],[-9,17.8,-16],[9,17.8,-16]],
    planter:[[-5.8,deck,-59],[5.8,deck,-59]]}],null).then(props=>{
    if(props){props.group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      root.add(props.group);redraw();}
  });
}
