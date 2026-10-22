import * as THREE from 'three';

export type Point = [number, number, number];
export type Field = (x: number, y: number, z: number) => number;
export const ellipsoid = (x: number,y: number,z: number,c: Point,r: Point) =>
  (Math.hypot((x-c[0])/r[0],(y-c[1])/r[1],(z-c[2])/r[2])-1)*Math.min(...r);

/** Carve actual volumes, including socket walls and the back of the skull.
 * Small stepped surfaces give the reference art its sculpted pixel silhouette. */
export function carvedVolume(solid: Field, cuts: Field[], bounds: Point, step=.045) {
  const counts=bounds.map(v=>Math.ceil(v*2/step));
  const [nx,ny,nz]=counts, index=(x:number,y:number,z:number)=>(z*ny+y)*nx+x;
  const filled=new Uint8Array(nx*ny*nz);
  const coordinate=(i:number,axis:number)=>(i+.5)*step-counts[axis]*step/2;
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const px=coordinate(x,0),py=coordinate(y,1),pz=coordinate(z,2);
    filled[index(x,y,z)]=solid(px,py,pz)<0&&cuts.every(c=>c(px,py,pz)>0)?1:0;
  }
  const vertices:number[][]=[[],[]],uvs:number[][]=[[],[]];
  const faces=[
    {n:[1,0,0],u:[0,1,0],v:[0,0,1]}, {n:[-1,0,0],u:[0,0,1],v:[0,1,0]},
    {n:[0,1,0],u:[0,0,1],v:[1,0,0]}, {n:[0,-1,0],u:[1,0,0],v:[0,0,1]},
    {n:[0,0,1],u:[1,0,0],v:[0,1,0]}, {n:[0,0,-1],u:[0,1,0],v:[1,0,0]},
  ];
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    if(!filled[index(x,y,z)])continue;
    for(const {n,u,v} of faces){
      const xx=x+n[0],yy=y+n[1],zz=z+n[2];
      if(xx>=0&&xx<nx&&yy>=0&&yy<ny&&zz>=0&&zz<nz&&filled[index(xx,yy,zz)])continue;
      const center=[coordinate(x,0)+n[0]*step/2,coordinate(y,1)+n[1]*step/2,coordinate(z,2)+n[2]*step/2];
      const bucket=cuts.some(c=>c(center[0],center[1],center[2])<step*.6)?1:0;
      for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){
        const p=center.map((c,i)=>c+(u[i]*a+v[i]*b)*step/2);
        vertices[bucket].push(...p);uvs[bucket].push(p[0]*.65+.5,p[1]*.65+.5);
      }
    }
  }
  return vertices.map((data,i)=>{
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(data,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs[i],2));geo.computeVertexNormals();return geo;
  });
}

export function makeSculptor(geometries:THREE.BufferGeometry[], resolution={steps:20,sides:8}) {
  const group=(parent:THREE.Object3D,p:Point=[0,0,0])=>{const o=new THREE.Group();o.position.set(...p);parent.add(o);return o;};
  const mesh=(parent:THREE.Object3D,geo:THREE.BufferGeometry,mat:THREE.Material,p:Point=[0,0,0])=>{geometries.push(geo);const o=new THREE.Mesh(geo,mat);o.position.set(...p);parent.add(o);return o;};
  const oval=(parent:THREE.Object3D,p:Point,size:Point,mat:THREE.Material)=>{const o=mesh(parent,new THREE.SphereGeometry(1,16,12),mat,p);o.scale.set(...size);return o;};
  const tube=(parent:THREE.Object3D,points:Point[],radius:number,mat:THREE.Material,end=.1)=>{
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),{steps,sides}=resolution,frames=path.computeFrenetFrames(steps,false);
    const data:number[]=[],uv:number[]=[],indices:number[]=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,center=path.getPointAt(t),r=radius*(1-t*(1-end));
      for(let j=0;j<=sides;j++){
        const angle=j/sides*Math.PI*2,p=center.clone().addScaledVector(frames.normals[i],Math.cos(angle)*r).addScaledVector(frames.binormals[i],Math.sin(angle)*r);
        data.push(...p);uv.push(j/sides,t);
        if(i<steps&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(data,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return mesh(parent,geo,mat);
  };
  const panel=(parent:THREE.Object3D,outline:[number,number][],p:Point,mat:THREE.Material,depth=.035)=>{
    const shape=new THREE.Shape();outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    return mesh(parent,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),mat,p);
  };
  return {group,mesh,oval,tube,panel};
}
