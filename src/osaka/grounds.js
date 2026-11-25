import { radius, rowDepth, rowHeight, straight } from './seats.js';

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
export const fountain = { x: -10, z: -86, radius: 5.5 };
export const trees = [];
for(const side of [-1,1]) {
  for(let x=-72;x<=72;x+=14.4) if(Math.abs(x)>20) trees.push([x,side*85]);
  for(let z=-60;z<=60;z+=15) trees.push([side*87,z]);
}
export const places = {
  plaza: { label: '분수 광장', x: 0, z: -103, yaw: Math.PI },
  north: { label: '북쪽 로비', x: 0, z: -54, yaw: Math.PI },
  south: { label: '남쪽 로비', x: 0, z: 54, yaw: 0 },
  stand: { label: '스탠드 통로', x: 0, z: -48, yaw: Math.PI },
};

export function radial(x,z) {
  return Math.hypot(Math.max(0,Math.abs(x)-straight),z);
}
export function zone(x,z) {
  const r=radial(x,z);
  if(r<innerWall) return '스탠드 통로';
  if(r<facade) return Math.abs(x)<20 ? (z<0?'북쪽 로비':'남쪽 로비') : '스탠드층 로비';
  if(Math.abs(x)<stairHalf && Math.abs(z)<stairFoot) return '입구 계단';
  return z< -stairFoot?'분수 광장':'공연장 외부';
}

export function floorAt(x,z) {
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>99||Math.abs(z)>106) return null;
  const ax=Math.abs(x), az=Math.abs(z), r=radial(x,z);
  if(r<radius+rowDepth(22)+.92) return null;
  if(Math.abs(r-innerWall)<.36 && ax>doorHalf-.35) return null;
  if(Math.abs(r-facade)<.42 && ax>doorHalf-.35) return null;
  if(r<facade) {
    // Wall-mounted concession counters and lockers along the two lobbies.
    if(az>facade-2.1 && ax>7 && ax<15.4) return null;
    if(Math.abs(az-(facade-1.94))<.46 && (Math.abs(ax-7)<.43||Math.abs(ax-15)<.43)) return null;
    return deck;
  }
  if(ax>=stairHalf && ax<stairHalf+7.2 && az<facade+6.25 && az>facade-.1) return null;
  if(ax<stairHalf && az<=stairFoot) {
    if(ax>stairHalf-.45 && az>stairTop) return null;
    const steps=Math.min(treads,Math.max(0,Math.ceil((stairFoot-az)/tread-1e-8)));
    return ground+steps*(deck-ground)/treads;
  }
  if(Math.hypot(x-fountain.x,z-fountain.z)<fountain.radius+.28) return null;
  if(Math.hypot(ax-23,az-78)<.48) return null;
  if(trees.some(([tx,tz])=>Math.hypot(x-tx,z-tz)<1.55)) return null;
  return ground;
}
