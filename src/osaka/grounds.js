import { radius, rowDepth, rowHeight, straight } from './seats.js';
import { entryCoords, entryPoint, lowerFloor, stairDistance, stairPoint } from './routes.js';
import city from './city.json';

// The passages line up with the north (G/H) and south (A/N) sides of the seating plan.
// Heights, stair flights and clear widths are model dimensions, in metres.
export const deck = rowHeight(22);
export const ground = deck - 4.8;
export const innerWall = radius + rowDepth(22) + 2.7;
export const facade = 59;
export const stairTop = 63;
export const treads = 30;
export const tread = .43;
export const stairFoot = stairTop + treads * tread;
export const stairHalf = 10;
export const doorHalf = 4.2;
export const fountain = { x: 102, z: -107, radius: 7.2 };
export const trees = city.trees;
const approach=entryPoint(119,9.2);
export const places = {
  plaza: { label: '분수 광장', ...approach, yaw:Math.atan2(approach.x,approach.z+facade) },
  north: { label: '북쪽 로비', x: 0, z: -54, yaw: Math.PI },
  south: { label: '남쪽 로비', x: 0, z: 54, yaw: 0 },
  stand: { label: '스탠드 통로', x: 0, z: -48, yaw: Math.PI },
  east: { label:'동쪽 연결 계단', ...stairPoint(1,-15,53.3), yaw:Math.PI },
  arena: { label:'1층 아레나 입구', x:straight+50.3,z:0,y:0,yaw:Math.PI/2 },
};

export function radial(x,z) {
  return Math.hypot(Math.max(0,Math.abs(x)-straight),z);
}
export function zone(x,z,y=deck) {
  const r=radial(x,z);
  if(r>51 && r<56 && Math.abs(stairDistance(x,z))<14 && y>0.2 && y<deck-.2)return '층간 계단';
  if(y<1)return r<25?'아레나 플로어':r<47.8?'1층 아레나 입구':'1층 아레나 로비';
  if(r<innerWall) return '스탠드 통로';
  if(r<facade) return Math.abs(x)<20 ? (z<0?'북쪽 로비':'남쪽 로비') : '스탠드층 로비';
  const {d,s}=entryCoords(x,z);
  if((z<0&&Math.abs(s)<10&&d>=-6&&d<67)||(z>0&&Math.abs(x)<stairHalf&&z<stairFoot))return '입구 계단';
  return z< -stairFoot?'분수 광장':'공연장 외부';
}

export function floorAt(x,z,y=deck,layout='B') {
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>116||Math.abs(z)>119) return null;
  const ax=Math.abs(x), az=Math.abs(z), r=radial(x,z);
  if(r<facade && (y<deck-.65 || (r>51 && r<56))){
    const lower=lowerFloor(x,z,y,r,layout);
    if(lower!==undefined)return lower;
  }
  if(r<radius+rowDepth(22)+.92) return null;
  if(Math.abs(r-innerWall)<.36 && ax>doorHalf-.35) return null;
  if(Math.abs(r-facade)<.42 && ax>doorHalf-.35) return null;
  if(r<facade) {
    // Wall-mounted concession counters and lockers along the two lobbies.
    if(az>facade-1.35 && x>7.45 && x<14.25) return null;
    if(Math.abs(az-(facade-1.94))<.46 && (Math.abs(ax-7)<.43||Math.abs(ax-15)<.43)) return null;
    return deck;
  }
  if(z<0){
    const {d,s}=entryCoords(x,z);
    if(d>14.75&&d<53.25&&s>9.78&&s<22.25)return null;
    if(d>=-6&&d<=54+treads*tread&&Math.abs(s)<=stairHalf-.24){
      const steps=Math.min(treads,Math.max(0,Math.ceil((54+treads*tread-d)/tread-1e-8)));
      return ground+steps*(deck-ground)/treads;
    }
  }
  if(z>0 && ax>=stairHalf && ax<stairHalf+7.2 && az<facade+6.25 && az>facade-.1) return null;
  if(z>0 && ax<stairHalf && az<=stairFoot) {
    if(ax>stairHalf-.45 && az>stairTop) return null;
    const steps=Math.min(treads,Math.max(0,Math.ceil((stairFoot-az)/tread-1e-8)));
    return ground+steps*(deck-ground)/treads;
  }
  if(Math.hypot(x-fountain.x,z-fountain.z)<fountain.radius+.28) return null;
  if(Math.hypot(ax-23,az-78)<.48) return null;
  if(trees.some(([tx,tz])=>Math.hypot(x-tx,z-tz)<1.55)) return null;
  return ground;
}
