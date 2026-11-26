import { precinct } from './precinct.js';
import { stair, stairDistance } from './routes.js';
import * as T from 'three';
import { perimeter, radius, rim } from './seats.js';
import { deck, ground, innerWall, facade, stairHalf, stairTop, tread, treads, trees, fountain } from './grounds.js';

function masonry(paving) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=paving?'#95928c':'#72726c';ctx.fillRect(0,0,512,512);
  let seed=53;
  const random=()=>((seed=(seed*16807)%2147483647)/2147483647);
  const height=paving?64:85.3333;
  for(let row=0;row<Math.round(512/height);row++){
    const width=paving?128:102.4;
    for(let col=-1;col<Math.ceil(512/width)+1;col++){
      const x=(col+(row%2)/2)*width, y=row*height;
      const tone=Math.round((paving?177:159)+random()*(paving?14:36));
      ctx.fillStyle='rgb('+[tone+4,tone+3,tone-2]+')';
      ctx.beginPath();
      if(!paving){
        const cut=7+random()*13;
        ctx.moveTo(x+cut,y+3);ctx.lineTo(x+width-cut*.7,y+2);
        ctx.lineTo(x+width-2,y+cut);ctx.lineTo(x+width-4,y+height-cut*.55);
        ctx.lineTo(x+width-cut,y+height-2);ctx.lineTo(x+cut*.7,y+height-4);
        ctx.lineTo(x+2,y+height-cut);ctx.lineTo(x+3,y+cut);ctx.closePath();ctx.fill();
        const wash=ctx.createLinearGradient(x,y,x+width*.45,y+height);
        wash.addColorStop(0,'rgba(246,242,228,.29)');wash.addColorStop(.5,'rgba(184,177,164,.03)');wash.addColorStop(1,'rgba(51,60,57,.25)');
        ctx.fillStyle=wash;ctx.fill();continue;
      }
      ctx.moveTo(x+2,y+3);ctx.lineTo(x+width-4,y+2);
      ctx.lineTo(x+width-2,y+height-6);ctx.lineTo(x+width-7,y+height-2);
      ctx.lineTo(x+3,y+height-2);ctx.closePath();ctx.fill();
    }
  }
  for(let i=0;i<24000;i++){
    ctx.fillStyle=random()>.5?'rgba(255,255,247,.14)':'rgba(24,31,29,.12)';
    ctx.fillRect(random()*512,random()*512,random()*3+1,1);
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;
  return map;
}

export function buildExterior(redraw) {
  const root=new T.Group();
  const solid=color=>new T.MeshStandardMaterial({color,roughness:.82});
  const glow=color=>new T.MeshBasicMaterial({color});
  const stoneMap=masonry(false);
  const stone=new T.MeshStandardMaterial({map:stoneMap,bumpMap:stoneMap,bumpScale:.23});
  const tile=new T.MeshStandardMaterial({map:masonry(true)});
  const concrete=solid(0xb1aaa0), bronze=solid(0x464f49), glass=solid(0x496b70);
  const wood=solid(0x946e50), foliage=[solid(0x587741),solid(0x789056),solid(0x466c4c)];
  const porcelain=solid(0xe3ddcc), lamp=glow(0xffebc8);
  const cube=new T.BoxGeometry(), crown=new T.IcosahedronGeometry(1,1);
  const cylinder=new T.CylinderGeometry(1,1,1,20);
  const batches=new Map(), pose=new T.Object3D();
  function instance(geometry,material,x,y,z,w,h,d,yaw=0,pitch=0) {
    if(!batches.has(material)) batches.set(material,new Map());
    const geometries=batches.get(material);
    if(!geometries.has(geometry)) geometries.set(geometry,[]);
    pose.position.set(x,y,z);pose.scale.set(w,h,d);pose.rotation.set(pitch,yaw,0,'YXZ');pose.updateMatrix();
    geometries.get(geometry).push(pose.matrix.clone());
  }
  const box=(...args)=>instance(cube,...args);
  function strip(mat,r0,y0,r1,y1,{gap=0,planar=false,omit}={}) {
    const pts=[],uv=[],idx=[];
    for(let i=0;i<=240;i++){
      const u=i/240*perimeter,a=rim(u,r0-radius),b=rim(u,r1-radius);
      pts.push(a.x,y0,a.z,b.x,y1,b.z);
      if(planar) uv.push(a.x/4,a.z/4,b.x/4,b.z/4);
      else uv.push(u/3.5,y0/3,u/3.5,y1/3);
      const mid=rim(u-perimeter/480,(r0+r1)/2-radius);
      if(i && (!gap||Math.abs(mid.x)>=gap) && !omit?.(mid)){
        const j=2*i;idx.push(j-2,j-1,j,j,j-1,j+1);
      }
    }
    const g=new T.BufferGeometry();g.setIndex(idx);
    g.setAttribute('position',new T.Float32BufferAttribute(pts,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
    mat.side=T.DoubleSide;root.add(new T.Mesh(g,mat));
  }
  function sign(text,w,h,x,y,z,side,background='#303d3c',ink='#fff3d5'){
    const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*h/w));
    const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='600 '+Math.round(c.height*.54)+'px "Yu Gothic", sans-serif';
    ctx.fillText(text,c.width/2,c.height*.51,c.width*.92);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map}));
    mesh.position.set(x,y,z);mesh.rotation.y=side>0?0:Math.PI;root.add(mesh);return mesh;
  }
  const shade=solid(0x65785a);
  precinct({root,box,strip,sign,stone,tile,bronze,concrete,wood,porcelain,lamp,foliage,instance,crown,cylinder},redraw);
  strip(stone,facade+1.25,ground-.08,facade,deck+.04);
  strip(tile,innerWall,deck,stair.inner,deck,{planar:true});
  strip(tile,stair.inner,deck,stair.outer,deck,{planar:true,omit:p=>Math.abs(stairDistance(p.x,p.z))<14});
  strip(tile,stair.outer,deck,facade,deck,{planar:true});
  glass.roughness=.28;glass.metalness=.23;
  strip(glass,facade,deck,facade,deck+3.7,{gap:4.65});
  for(const height of [.24,2.70])strip(bronze,facade+.035,deck+height,facade+.035,deck+height+.07,{gap:4.65});
  strip(bronze,facade+.05,deck+3.7,facade+.05,deck+4);
  strip(porcelain,facade,deck+4,facade,deck+5.15);
  strip(concrete,innerWall,deck+4.1,facade,deck+4.1,{planar:true});
  for(let i=0;i<112;i++){
    const u=i/112*perimeter,w=rim(u,facade-radius);
    if(Math.abs(w.x)>4.6) box(bronze,w.x,deck+1.87,w.z,.14,3.74,.2,Math.atan2(w.nx,w.nz));
    if(i%3===0){
      const p=rim(u,(facade+innerWall)/2-radius);
      box(lamp,p.x,deck+4.02,p.z,2,.07,.34,Math.atan2(p.nx,p.nz));
    }
  }
  for(const side of [-1,1]){
    // Open glass entrance bays, stair landings and a stone parapet on either side.
    if(side>0){
    box(concrete,0,(deck+ground)/2,side*(stairTop+facade)/2,stairHalf*2,deck-ground,stairTop-facade);
    for(let k=0;k<treads;k++){
      const h=(treads-k)*(deck-ground)/treads;
      box(concrete,0,ground+h/2,side*(stairTop+(k+.5)*tread),2*stairHalf,h,tread);
    }
    for(const edge of [-1,1]){
      const x=edge*(stairHalf-.18);
      const wing=edge*(stairHalf+3.5);
      box(stone,wing,(deck+ground)/2,side*(facade+3.05),7,deck-ground,6);
      box(concrete,wing,deck+.14,side*(facade+3.05),7.12,.28,6.12);
      box(foliage[0],wing,deck+.52,side*(facade+3.05),6.76,.52,5.7);
      for(let k=0;k<treads;k+=3){
        const y=ground+(treads-k)*(deck-ground)/treads;
        box(concrete,x,y+.2,side*(stairTop+(k+1.5)*tread),.34,.52,3*tread);
      }
      const slope=(deck-ground)/(treads*tread);
      box(bronze,x,ground+(deck-ground)/2+.9,side*(stairTop+treads*tread/2),.085,.085,Math.hypot(tread*treads,deck-ground),0,side*Math.atan(slope));
      for(let k=0;k<=treads;k+=5) box(bronze,x,deck-k*(deck-ground)/treads+.5,side*(stairTop+k*tread),.065,.8,.065);
      box(bronze,edge*4.5,deck+1.9,side*facade,.26,3.8,.25);
    }
    }
    box(bronze,0,deck+3.62,side*(facade+.88),21,.25,2.6);
    for(const x of [-15,-7,7,15]){
      box(porcelain,x,deck+1.96,side*(facade-1.94),.34,3.92,.42);
      box(wood,x,deck+3.91,side*(facade+innerWall)/2,.24,.24,facade-innerWall-.4);
    }
    sign('大阪城ホール    OSAKA-JO HALL',19,1.05,0,deck+4.55,side*(facade+.06),side,'#c5c2b6','#343d3d');
    sign(side<0?'北玄関   NORTH LOBBY':'南玄関   SOUTH LOBBY',8,.55,0,deck+3.35,side*(facade+.1),side);
    // Frame the open bay with sidelights, so the centre reads as a doorway.
    for(const edge of [-1,1]){
      box(bronze,edge*5.45,deck+.95,side*(facade+.15),1.55,.07,.09);
      box(bronze,edge*5.45,deck+2.75,side*(facade+.15),1.55,.07,.09);
    }
    sign(side<0?'スタンド席   G  /  H':'スタンド席   A  /  N',6.7,.64,0,deck+3.85,side*(innerWall+.08),side);
    sign(side<0?'北玄関   EXIT':'南玄関   EXIT',5,.62,0,deck+3.33,side*(facade-.08),-side);
    for(let j=0;j<10;j++)for(let k=0;k<3;k++){
      const x=8+j*.63,y=deck+.35+k*.68;
      box(k%2?porcelain:concrete,x,y,side*(facade-.65),.6,.65,.75);
      box(bronze,x+.2,y,side*(facade-1.04),.055,.12,.04);
    }
    sign('コインロッカー   LOCKERS',6,.53,11,deck+2.4,side*(facade-.68),-side);
  }
  // A representative fountain, park planting and plaza lamps frame the approach.
  const paving=new T.CircleGeometry(17,64);paving.rotateX(-Math.PI/2);
  const uv=paving.attributes.uv,p=paving.attributes.position;
  for(let i=0;i<uv.count;i++)uv.setXY(i,p.getX(i)/4,p.getZ(i)/4);
  const roundel=new T.Mesh(paving,tile);roundel.position.set(fountain.x,ground+.052,fountain.z);root.add(roundel);
  instance(cylinder,concrete,fountain.x,ground+.23,fountain.z,fountain.radius,.46,fountain.radius);
  instance(cylinder,solid(0x75a9a8),fountain.x,ground+.47,fountain.z,fountain.radius-.32,.03,fountain.radius-.32);
  instance(cylinder,solid(0x813f35),fountain.x,ground+8.2,fountain.z,.32,16.4,.32);
  instance(cylinder,bronze,fountain.x,ground+16.45,fountain.z,.44,.18,.44);
  const waterLines=[];
  for(let j=0;j<72;j++){
    const a=j*Math.PI/36,outer=j%3===0;
    for(let k=0;k<12;k++)for(const n of [k,k+1]){
      const t=n/12,r=outer?3.8-2.2*t:.26+1.35*t;
      waterLines.push(fountain.x+r*Math.sin(a),ground+.50+(outer?5.5:10)*t*(1-t),fountain.z+r*Math.cos(a));
    }
  }
  const water=new T.BufferGeometry();water.setAttribute('position',new T.Float32BufferAttribute(waterLines,3));
  root.add(new T.LineSegments(water,new T.LineBasicMaterial({color:0xdaf0ef,transparent:true,opacity:.74})));
  trees.forEach(([x,z],i)=>{
    instance(cylinder,shade,x,ground+.045,z,2.25,.018,1.8,i);
    instance(cylinder,concrete,x,ground+.18,z,1.4,.36,1.4);
    instance(cylinder,wood,x,ground+2.2,z,.23,4.4,.23);
    for(let j=0;j<6;j++){
      const a=i*2.399+j*2.21,spread=1.15+.48*Math.sin(i+j),h=4.55+.34*j+.43*Math.cos(i);
      instance(cylinder,wood,x+Math.sin(a)*.55,ground+h-1.14,z+Math.cos(a)*.55,.11,2.1,.11,a,.52);
      instance(crown,foliage[(i+j)%3],x+Math.sin(a)*spread,ground+h,z+Math.cos(a)*spread,1.75,1.3+.12*j,1.61,a);
    }
  });
  for(const x of [-23,23])for(const z of [-78,78]){
    instance(cylinder,bronze,x,ground+2.4,z,.11,4.8,.11);
    instance(cylinder,lamp,x,ground+5,z,.30,.58,.30);
    instance(cylinder,bronze,x,ground+5.34,z,.39,.11,.39);
  }
  for(const [mat,geometries] of batches) for(const [geo,matrices] of geometries){
    const mesh=new T.InstancedMesh(geo,mat,matrices.length);
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));root.add(mesh);
  }
  return root;
}
