import { straight, radius, rim, perimeter, rowHeight, layouts } from './seats.js';

export const upper = rowHeight(22);
export const entryAxis = { x:.918, z:-.397 };
const axisLength=Math.hypot(entryAxis.x,entryAxis.z);
entryAxis.x/=axisLength;entryAxis.z/=axisLength;
export function entryPoint(distance,side=0) {
  return {x:entryAxis.x*distance-entryAxis.z*side,z:-62+entryAxis.z*distance+entryAxis.x*side};
}
export function entryCoords(x,z){
  return {d:x*entryAxis.x+(z+62)*entryAxis.z,s:-x*entryAxis.z+(z+62)*entryAxis.x};
}
export const stair = {inner:51.2,outer:55.4,run:28,steps:62};
export function stairPoint(side,d,r){
  return {x:side*(straight+r*Math.cos(d/53.3)),z:side*r*Math.sin(d/53.3)};
}
export function stairDistance(x,z){
  const side=Math.sign(x);
  return Math.atan2(side*z,Math.abs(x)-straight)*53.3;
}
export function stairHeight(d){
  return upper*(1-Math.min(stair.steps,Math.max(0,Math.floor((d+14)*stair.steps/stair.run)))/stair.steps);
}
// The six public arena portals are below B, D, F, I, K and M on the venue guide.
export const gates=[60,0,-60,-120,180,120].map((deg,i)=>{
  const a=deg*Math.PI/180,nx=Math.cos(a),nz=Math.sin(a);
  return {id:i+1,nx,nz,cx:Math.sign(nx)*straight};
});
export function gateAt(x,z,width=2.3){
  return gates.find(g=>(x-g.cx)*g.nx+z*g.nz>19 && Math.abs((x-g.cx)*g.nz-z*g.nx)<width);
}
export function lowerFloor(x,z,y,r,layout){
  const d=stairDistance(x,z);
  if(r>=stair.inner && r<=stair.outer && Math.abs(d)<=14){
    const step=stairHeight(d);
    if(Math.abs(y-step)<.6)return step;
    if(y>2||step<2.15)return null;
  }
  if(y>upper-.65)return undefined;
  if(r>58.25)return null;
  if(r>=47.8)return 0;
  if(r>24 && !gateAt(x,z,2.05))return null;
  if(r>22.35)return 0;
  const l=layouts[layout]||layouts.B;
  const dx=x-l.x,dz=z-l.z,cs=Math.cos(l.yaw),sn=Math.sin(l.yaw);
  if(Math.abs(dx*cs-dz*sn)<l.width/2+.35&&Math.abs(dx*sn+dz*cs)<l.depth/2+.35)return null;
  // The movable seating generator leaves these longitudinal and cross aisles free.
  const aisle=(n,pitch)=>Math.abs(n-Math.round(n/pitch)*pitch)<.32;
  return aisle(x,12*.78)||aisle(z,10*.79)?0:null;
}
export function pillarPosition(n,r=56.6){
  // Pillar 01 is near A/N and numbering increases towards the east.
  return rim((n-1)*perimeter/46,r-radius);
}
