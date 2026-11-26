import * as T from 'three';
import city from './city.json';
import { ground, deck, facade, stairHalf, tread, treads } from './grounds.js';
import { entryPoint, gates, pillarPosition, stair, stairPoint, stairHeight, terraceTop, terraceFoot } from './routes.js';
import { rim, perimeter, radius } from './seats.js';
import { loadProps } from '../app/assets.js';

// Osaka City 2022 CityGML (MLIT PLATEAU). Local X follows the surveyed long wall.
// The aerial mosaic is a rotated crop of the MLIT PLATEAU-Ortho 2024 tiles.
export function precinct(kit, redraw){
  const {root,box,strip,sign,stone,tile,lobbyFloor,bronze,concrete,wood,porcelain,lamp,foliage,instance,crown,cylinder}=kit;
  const loader=new T.TextureLoader();
  function texture(path){
    const t=loader.load(path,redraw);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  }
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
  const surface=new T.MeshStandardMaterial({map:texture('./venues/osaka-landcover.webp'),roughness:1});
  const grain=loader.load('./venues/osaka-ground-detail.webp',redraw);
  grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.anisotropy=4;
  // Use the survey colour for the distant view. In walking range, layer the
  // grain of grass, pavers or asphalt at a physical scale of 2.4 m per repeat.
  surface.onBeforeCompile=shader=>{
    shader.uniforms.groundDetail={value:grain};
    shader.fragmentShader='uniform sampler2D groundDetail;\n'+shader.fragmentShader.replace(
      '#include <map_fragment>',`#include <map_fragment>
      vec3 grain = texture2D(groundDetail, vMapUv * 400.0).rgb - 0.5;
      vec3 base = diffuseColor.rgb;
      float vegetation = smoothstep(0.012, 0.050, base.g - base.r);
      float water = smoothstep(0.02, 0.10, base.b - base.r);
      float hardscape = mix(grain.b, grain.g, smoothstep(0.19, 0.33, base.r));
      diffuseColor.rgb *= 1.0 + mix(mix(hardscape, grain.r, vegetation), grain.b * 0.16, water);
    `);
  };
  const landscape=new T.Mesh(land,surface);
  landscape.position.y=ground-.045;root.add(landscape);
  let aerialMaterial, aerialReady=false, aerialSelected=false;
  root.userData.setAerial=enabled=>{
    aerialSelected=enabled;
    if(enabled&&!aerialMaterial){
      const image=loader.load('./venues/osaka-park.webp',()=>{
        aerialReady=true;
        if(aerialSelected)landscape.material=aerialMaterial;
        redraw();
      });
      image.colorSpace=T.SRGBColorSpace;image.anisotropy=4;
      aerialMaterial=new T.MeshStandardMaterial({map:image,roughness:1});
    }
    landscape.material=enabled&&aerialReady?aerialMaterial:surface;
  };
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
  // The planted granite terrace widens towards the hall. Its raked sides and
  // projecting coping are conspicuous from the fountain, especially at eye height.
  const top=terraceTop.map(([d,s])=>entryPoint(d,s));
  const foot=terraceFoot.map(([d,s])=>entryPoint(d,s));
  const parapetY=deck+2.65;
  const faces=[],joints=[],cap=[],capUV=[],soil=[];
  for(let i=0;i<top.length;i++){
    const j=(i+1)%top.length;
    const a=foot[i],b=foot[j],c=top[j],d=top[i];
    const length=Math.hypot(b.x-a.x,b.z-a.z)/3.8;
    for(const [v,y,u,t] of [[a,ground,0,0],[b,ground,length,0],[c,parapetY,length,2],[a,ground,0,0],[c,parapetY,length,2],[d,parapetY,0,2]]){
      faces.push(v.x,y,v.z);joints.push(u,t);
    }
    for(const [v,y,u,t] of [[d,0,0,0],[c,0,length,0],[c,.22,length,1],[d,0,0,0],[c,.22,length,1],[d,.22,0,1]]){
      cap.push(v.x,y+parapetY,v.z);capUV.push(u,t);
    }
    if(i>0&&j!==0)for(const v of [top[0],d,c])soil.push(v.x,parapetY+.22,v.z);
  }
  mesh(faces,joints,stone);mesh(cap,capUV,concrete);mesh(soil,null,new T.MeshStandardMaterial({color:0x687048,side:T.DoubleSide}));
  for(let i=0;i<12;i++){
    const p=entryPoint(30+i*3.1,13.45);
    box(foliage[i%3],p.x,parapetY+.66,p.z,1.25,.85,3.15,yaw);
  }
  for(let i=0;i<9;i++){
    const p=entryPoint(33+i*3.7,15+2.2*(i%3));
    const h=3.3+(i%3)*.65;
    instance(cylinder,wood,p.x,parapetY+h/2,p.z,.15,h,.15);
    for(let j=0;j<4;j++){
      const a=i+2.4*j;
      instance(crown,foliage[(i+j)%3],p.x+Math.sin(a)*1.12,parapetY+h+j*.33,p.z+Math.cos(a)*1.12,1.55,1.5,1.72,a);
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
  function tiledFinish(name,color,repeat=1){
    const map=texture('./textures/'+name+'_albedo.webp');
    map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.setScalar(repeat);
    return new T.MeshStandardMaterial({map,color,roughness:.84,side:T.DoubleSide});
  }
  const plaster=tiledFinish('concrete_painted_cream',0xf5f2ed);
  const gateGap=p=>Boolean(gates.find(g=>(p.x-g.cx)*g.nx+p.z*g.nz>20&&Math.abs((p.x-g.cx)*g.nz-p.z*g.nx)<2.7));
  const stairVoid=p=>Math.abs(Math.atan2(p.z,Math.abs(p.x)-17.6)*53.3)<14;
  strip(lobbyFloor,radius-.52,.01,facade,.01,{planar:true});
  strip(plaster,47.8,3.65,51.2,3.65,{planar:true});
  strip(plaster,51.2,3.65,55.4,3.65,{planar:true,omit:stairVoid});
  strip(plaster,55.4,3.65,facade,3.65,{planar:true});
  strip(plaster,47.7,0,47.7,3.5,{omit:gateGap});
  strip(plaster,47.7,3.5,47.7,deck);
  strip(plaster,58.95,0,58.95,3.65);
  // Skirting and an inset floor border follow the lower concourse around the portals.
  strip(bronze,47.74,.015,47.74,.14,{omit:gateGap});
  strip(bronze,58.91,.015,58.91,.14);
  strip(concrete,48.34,.022,48.48,.022,{planar:true});
  const diffuser=new T.MeshBasicMaterial({color:0xfff6da});
  const housing=new T.MeshStandardMaterial({color:0x838782,roughness:.47});
  for(let n=0;n<68;n++){
    const u=n/68*perimeter;
    for(const r of [49.6,56.9]){
      const p=rim(u,r-radius),yaw=Math.atan2(p.nx,p.nz);
      box(housing,p.x,3.60,p.z,1.35,.09,.31,yaw);
      box(diffuser,p.x,3.546,p.z,1.21,.025,.21,yaw);
    }
    const p=rim(u,47.73-radius);
    if(!gateGap(p))box(concrete,p.x,1.84,p.z,.035,3.35,.034,Math.atan2(p.nx,p.nz));
  }
  for(const side of [-1,1]){
    const soffit=[],uv=[];
    for(let i=0;i<stair.steps;i++){
      const d0=-14+i*stair.run/stair.steps,d1=-14+(i+1)*stair.run/stair.steps;
      for(const [d,r] of [[d0,stair.inner],[d1,stair.inner],[d1,stair.outer],
          [d0,stair.inner],[d1,stair.outer],[d0,stair.outer]]){
        const at=stairPoint(side,d,r);
        soffit.push(at.x,deck*(14-d)/28-.37,at.z);uv.push((r-stair.inner)/3,d/3);
      }
      const d=-14+(i+.5)*stair.run/stair.steps,p=stairPoint(side,d,53.3),y=stairHeight(d);
      box(concrete,p.x,y-.14,p.z,stair.outer-stair.inner,.28,.48,-d/53.3);
      const front=stairPoint(side,d+.17,53.3);
      box(housing,front.x,y+.005,front.z,stair.outer-stair.inner-.12,.012,.045,-d/53.3);
      for(const r of [stair.inner,stair.outer]){
        const q=stairPoint(side,d,r);
        if(i%4===0)box(bronze,q.x,y+.5,q.z,.06,.94,.06);
        box(bronze,q.x,y+1,q.z,.07,.09,.51,-d/53.3,side*.36);
      }
    }
    mesh(soffit,uv,plaster);
    for(const [d,base,label] of [[-16,deck,'1F   アリーナ  ↓'],[16,0,'2F   スタンド  ↑']]){
      const at=stairPoint(side,d,56.4);
      const signpost=sign(label,2.15,.49,at.x,base+2.25,at.z,1,'#2a4641');
      signpost.rotation.y=Math.atan2(-side*Math.cos(d/53.3),-side*Math.sin(d/53.3));
      box(housing,at.x,base+1.21,at.z,.09,2.42,.09);
    }
  }
  const doors=new Map();
  const doorSkin=tiledFinish('metal_panel_white',0x607886);
  const doorGlass=new T.MeshStandardMaterial({color:0x233b43,roughness:.18,metalness:.35});
  const hardware=new T.MeshStandardMaterial({color:0xb8c1bd,roughness:.32,metalness:.55});
  const doorPart=new T.BoxGeometry();
  function fitting(leaf,material,x,y,z,w,h,d){
    const m=new T.Mesh(doorPart,material);m.position.set(x,y,z);m.scale.set(w,h,d);leaf.add(m);
  }
  function arenaDirectory(gate){
    const c=document.createElement('canvas');c.width=480;c.height=600;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#e7e7da';ctx.fillRect(0,0,480,600);
    ctx.fillStyle='#24483e';ctx.fillRect(0,0,480,122);
    ctx.fillStyle='#fffbea';ctx.font='bold 48px sans-serif';ctx.fillText('1F',30,76);
    ctx.font='bold 22px sans-serif';ctx.fillText('ARENA FLOOR',128,58);
    ctx.font='19px sans-serif';ctx.fillText('アリーナフロア',128,90);
    ctx.strokeStyle='#89958b';ctx.lineWidth=18;ctx.beginPath();ctx.roundRect(60,205,360,188,94);ctx.stroke();
    ctx.fillStyle='#c4cebf';ctx.beginPath();ctx.roundRect(101,242,278,114,52);ctx.fill();
    for(const g of gates){
      const x=240+158*g.nx,y=299+87*g.nz;
      ctx.beginPath();ctx.arc(x,y,19,0,Math.PI*2);
      ctx.fillStyle=g===gate?'#af4f38':'#3f514c';ctx.fill();
      ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 22px sans-serif';ctx.fillText(String(g.id),x,y+8);
    }
    ctx.textAlign='left';ctx.fillStyle='#243c35';ctx.font='bold 46px sans-serif';ctx.fillText('ARENA  '+String(gate.id).padStart(2,'0'),30,506);
    ctx.font='22px sans-serif';ctx.fillText('現在地   /   YOU ARE HERE',30,555);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    return new T.MeshBasicMaterial({map});
  }
  for(const g of gates){
    const yaw=Math.atan2(g.nx,g.nz), along=(r,s=0)=>({x:g.cx+g.nx*r+g.nz*s,z:g.nz*r-g.nx*s});
    for(const s of [-2.6,2.6]){
      const p=along(36,s);box(concrete,p.x,1.55,p.z,.18,3.1,24,yaw);
    }
    const c=along(38);
    box(concrete,c.x,2.94,c.z,5.3,.18,20,yaw);
    for(const r of [30,37,44]){const p=along(r);box(lamp,p.x,2.80,p.z,1.4,.07,.22,yaw);}
    const p=along(47.9);
    // The trim stays attached to the opening. Hardware travels with each sliding leaf.
    for(const side of [-1,1]){
      const jamb=along(47.92,side*2.48);
      box(hardware,jamb.x,1.46,jamb.z,.15,2.92,.28,yaw);
    }
    box(bronze,p.x,2.95,p.z,5.18,.22,.31,yaw);
    const plate=along(48.02);
    const board=sign('アリーナ   /   ARENA    '+String(g.id).padStart(2,'0'),4.5,.49,plate.x,3.33,plate.z,1,'#254742','#fff9e6');
    board.rotation.y=yaw;
    const stripe=along(47.98);box(hardware,stripe.x,.028,stripe.z,4.95,.035,.33,yaw);
    const plaque=along(Math.sqrt(47.77**2-4.25**2),4.25);
    // Orient the directory tangentially even at gates on the curved end walls.
    const curveX=plaque.x-T.MathUtils.clamp(plaque.x,-17.6,17.6);
    const angle=Math.atan2(curveX,plaque.z);
    box(housing,plaque.x,1.63,plaque.z,1.18,1.48,.065,angle);
    const mapFace=new T.Mesh(new T.PlaneGeometry(1.11,1.39),arenaDirectory(g));
    mapFace.position.set(plaque.x+.042*Math.sin(angle),1.63,plaque.z+.042*Math.cos(angle));
    mapFace.rotation.y=angle;root.add(mapFace);
    const frame=new T.Group();frame.position.set(p.x,0,p.z);frame.rotation.y=yaw;root.add(frame);
    const leaves=[];
    for(const side of [-1,1]){
      const leaf=new T.Mesh(new T.BoxGeometry(2.4,2.83,.14),doorSkin);
      leaf.position.set(side*1.21,1.43,0);frame.add(leaf);leaves.push(leaf);
      for(const face of [-1,1]){
        fitting(leaf,hardware,-side*.46,.43,.078*face,.52,.80,.025);
        fitting(leaf,doorGlass,-side*.46,.43,.097*face,.43,.71,.015);
        fitting(leaf,hardware,0,-1.24,.082*face,2.29,.25,.018);
        for(const y of [-.25,.17])fitting(leaf,hardware,-side*.90,y,.112*face,.06,.06,.12);
        fitting(leaf,hardware,-side*.90,-.04,.178*face,.052,.48,.053);
      }
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
  const enamel=new T.MeshStandardMaterial({color:0xcecfcb,roughness:.53});
  const keyTag=new T.MeshStandardMaterial({color:0xc07b45});
  for(const pillar of [6,17]){
    const wall=pillarPosition(pillar,58.35),yaw=Math.atan2(wall.nx,wall.nz);
    const part=(mat,s,r,y,w,h,d)=>box(mat,wall.x+wall.nz*s+wall.nx*r,y,wall.z-wall.nx*s+wall.nz*r,w,h,d,yaw);
    part(bronze,0,0,1.04,4.42,2.08,.55);
    for(let i=0;i<8;i++)for(let row=0;row<3;row++){
      const s=(i-3.5)*.55,y=.42+row*.64;
      part(enamel,s,-.285,y,.535,.627,.038);
      part(bronze,s+.17,-.315,y+.07,.045,.12,.023);
      part(keyTag,s+.17,-.329,y-.025,.033,.075,.02);
    }
  }
  for(const [n,base] of [[8,0],[14,0],[14,deck]]){
    const p=pillarPosition(n,57.3),yaw=Math.atan2(p.nx,p.nz);
    box(wood,p.x,base+.55,p.z,4.8,1.1,.9,yaw);
    const inset=(side,r,y,w,h,d,mat)=>box(mat,p.x+p.nz*side+p.nx*r,base+y,p.z-p.nx*side+p.nz*r,w,h,d,yaw);
    inset(0,-.08,1.13,4.98,.11,1.18,housing);
    inset(0,.54,1.68,4.8,1.22,.09,plaster);
    for(const x of [-2.32,2.32])inset(x,.06,1.78,.10,1.3,1.04,bronze);
    for(const x of [-1.5,-.5,.5,1.5]){
      inset(x,.42,1.67,.84,.065,.34,housing);
      for(let i=0;i<4;i++)inset(x-.28+i*.18,.37,1.8,.115,.22,.12,i%2?porcelain:cream);
    }
    inset(0,-.09,2.37,5.06,.15,1.3,bronze);
    inset(0,-.59,2.27,4.55,.045,.09,diffuser);
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
