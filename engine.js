/** AFTERSIGNAL: 2030 - zero-download-art WebGL2 world renderer. MIT licensed original code. */
export const NODES = Object.freeze([
  {id:'shelter',name:'Shelter 17',x:0,z:38,kind:'shelter'},
  {id:'cacheA',name:'Emergency supply cache',x:42,z:-20,kind:'supply'},
  {id:'cacheB',name:'Evacuation supply cache',x:-44,z:-64,kind:'supply'},
  {id:'archive',name:'Classified archive',x:-62,z:-126,kind:'archive'},
  {id:'relay',name:'Signal relay station',x:52,z:-175,kind:'relay'},
  {id:'rift',name:'The Convergence Rift',x:0,z:-257,kind:'portal'}
]);
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const randomFrom=(seed)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296};
export function terrainHeight(x,z){return 1.2*Math.sin(x*.025)+1.3*Math.cos(z*.021)+.64*Math.sin(x*.077+z*.032)+.48*Math.cos(z*.069-x*.031)}
const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 aColor;
layout(location=3) in float aKind;
uniform mat4 uVP;uniform float uTime;
out vec3 vNormal;out vec3 vColor;out vec3 vWorld;out float vKind;
void main(){vec3 p=aPos;if(aKind>3.4&&aKind<4.5){p.x+=sin(uTime*1.4+aPos.x*.13+aPos.z*.19)*.35*max(.1,aNormal.y);p.z+=cos(uTime*.8+aPos.z*.15)*.15;}
if(aKind>5.0){p.y+=sin(uTime*.7+aPos.x*.09)*.7;}
vWorld=p;vNormal=aNormal;vColor=aColor;vKind=aKind;gl_Position=uVP*vec4(p,1.);}`;
const fragment=`#version 300 es
precision highp float;
in vec3 vNormal;in vec3 vColor;in vec3 vWorld;in float vKind;
out vec4 frag;
uniform vec3 uEye;uniform float uTime;uniform float uDay;uniform float uQuality;
float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,47.128)))*43758.5453);}
void main(){vec3 n=normalize(vNormal);float lit=clamp(dot(n,normalize(vec3(.35,.78,-.5)))*.62+.45,.17,1.1);float speck=(hash(floor(vWorld*1.25))-.5)*.15;vec3 c=vColor*(lit+speck);if(vKind>1.5&&vKind<3.5){c=vColor*(1.1+sin(uTime*1.7+vWorld.y*.23)*.14);}if(vKind>4.5&&vKind<5.5){c=vColor*(.6+.4*sin(uTime*2.1+vWorld.x*.3));}
float d=length(vWorld-uEye);vec3 fog=mix(vec3(.085,.142,.162),vec3(.16,.25,.265),uDay*.55);float density=mix(.010,.0065,uQuality);float visibility=exp(-d*density);c=mix(fog,c,clamp(visibility,0.,1.));c*=mix(.60,1.0,uDay);
// restrained filmic desaturation
c=mix(c,vec3(dot(c,vec3(.2126,.7152,.0722))),.12);frag=vec4(pow(max(c,0.),vec3(.88)),1.);}`;
const skyV=`#version 300 es
precision highp float;out vec2 vUv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);vUv=p*.5;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const skyF=`#version 300 es
precision highp float;in vec2 vUv;out vec4 frag;uniform float uTime,uDay,uYaw,uPitch,uAspect;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
void main(){vec2 uv=vUv;float h=clamp(uv.y+.1*sin(uPitch),0.,1.);vec3 lower=mix(vec3(.10,.19,.21),vec3(.14,.22,.24),uDay);vec3 upper=mix(vec3(.009,.018,.039),vec3(.026,.078,.13),uDay);vec3 col=mix(lower,upper,smoothstep(.04,.95,h));
float cloud=sin(uv.x*16.+uTime*.008+sin(uv.y*21.))*sin(uv.y*25.+uTime*.014);col+=vec3(.033,.04,.041)*cloud*smoothstep(.12,.64,h);float stars=step(.997,hash(floor(vec2((uv.x+uYaw*.14)*480.,uv.y*290.))))*smoothstep(.5,.95,h);col+=vec3(.31,.45,.52)*stars*(1.-uDay);
vec2 sun=uv-vec2(.8-.13*sin(uYaw),.69+.09*sin(uPitch));float glow=exp(-length(sun*vec2(uAspect,1.))*16.);col+=mix(vec3(.12,.08,.05),vec3(.15,.20,.20),uDay)*glow;
frag=vec4(col,1.);}`;
function compile(gl,type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){throw Error(gl.getShaderInfoLog(s)||'Shader compilation failed')}return s}
function program(gl,v,f){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||'GL program failed');return p}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),range=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*range,-1,0,0,2*far*near*range,0])}
function matmul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function view(eye,yaw,pitch){const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);const forward=[sy*cp,sp,-cy*cp],right=[cy,0,sy],up=[-sy*sp,cp,cy*sp];return new Float32Array([right[0],up[0],-forward[0],0,right[1],up[1],-forward[1],0,right[2],up[2],-forward[2],0,-right[0]*eye[0]-right[1]*eye[1]-right[2]*eye[2],-up[0]*eye[0]-up[1]*eye[1]-up[2]*eye[2],forward[0]*eye[0]+forward[1]*eye[1]+forward[2]*eye[2],1])}
function shadeColor(c,k){return c.map(x=>x*k)}
export class Mesh{
 constructor(){this.a=[]}
 triangle(a,b,c,color,kind=0){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(q=>q/l);for(const p of [a,b,c])this.a.push(...p,...n,...color,kind)}
 quad(a,b,c,d,color,kind=0){this.triangle(a,b,c,color,kind);this.triangle(a,c,d,color,kind)}
 box(x,y,z,w,h,d,color,kind=0){const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2,t=y+h;const P=[ [a,y,c],[b,y,c],[b,t,c],[a,t,c],[a,y,e],[b,y,e],[b,t,e],[a,t,e]];this.quad(P[0],P[1],P[2],P[3],shadeColor(color,.83),kind);this.quad(P[5],P[4],P[7],P[6],color,kind);this.quad(P[4],P[0],P[3],P[7],shadeColor(color,.77),kind);this.quad(P[1],P[5],P[6],P[2],shadeColor(color,.87),kind);this.quad(P[3],P[2],P[6],P[7],shadeColor(color,1.16),kind)}
 cylinder(x,y,z,r,h,col,steps=9,kind=0){for(let i=0;i<steps;i++){const a=i/steps*TAU,b=(i+1)/steps*TAU;const x1=x+r*Math.cos(a),z1=z+r*Math.sin(a),x2=x+r*Math.cos(b),z2=z+r*Math.sin(b);this.quad([x1,y,z1],[x2,y,z2],[x2,y+h,z2],[x1,y+h,z1],col,kind);}}
 cone(x,y,z,r,h,col,steps=8,kind=0){for(let i=0;i<steps;i++){const a=i/steps*TAU,b=(i+1)/steps*TAU;this.triangle([x+r*Math.cos(a),y,z+r*Math.sin(a)],[x+r*Math.cos(b),y,z+r*Math.sin(b)],[x,y+h,z],shadeColor(col,.80+.2*Math.sin(a*2)),kind)}}
 sphere(x,y,z,r,col,lat=7,lon=11,kind=0){for(let i=0;i<lat;i++){const p0=i/lat*Math.PI,p1=(i+1)/lat*Math.PI;for(let j=0;j<lon;j++){const a=j/lon*TAU,b=(j+1)/lon*TAU;const f=(p,t)=>[x+r*Math.sin(p)*Math.cos(t),y+r*Math.cos(p),z+r*Math.sin(p)*Math.sin(t)];this.quad(f(p0,a),f(p0,b),f(p1,b),f(p1,a),col,kind)}}}
 ring(x,y,z,R,r,color,segments=44,kind=2){for(let i=0;i<segments;i++){const a=i/segments*TAU,b=(i+1)/segments*TAU;const p=(rr,t)=>[x+rr*Math.cos(t),y+rr*Math.sin(t),z];this.quad(p(R-r,a),p(R+r,a),p(R+r,b),p(R-r,b),color,kind)}}
 get data(){return new Float32Array(this.a)}
}
function tree(m,x,z,size,rng){const y=terrainHeight(x,z);m.cylinder(x,y,z,.35*size,4*size,[.15,.17,.16],6);for(let j=0;j<3;j++){const hh=2.8*size+j*2.4*size;const r=(3.3-j*.8)*size;m.cone(x,y+hh,z,r,5*size,shadeColor([.14,.25,.21],(.72+rng()*.3)),7,4)}}
function tower(m,x,z,rng){const y=terrainHeight(x,z);const h=16+rng()*37,w=9+rng()*11,d=8+rng()*10;const col=shadeColor([.19,.27,.30],.65+rng()*.5);m.box(x,y,z,w,h,d,col);m.box(x,y+h,z,w+1.4,.75,d+1.4,[.14,.18,.20]);for(let f=0;f<Math.floor(h/5);f++)for(let j=-1;j<=1;j++){if(rng()>.35){const zz=z-d/2-.07,xx=x+j*w/4;m.box(xx,y+3+f*5,zz,1.1,1.1,.12,rng()>.86?[.48,.79,.8]:[.09,.16,.19],2)}}}
function marker(m,node){const x=node.x,z=node.z,y=terrainHeight(x,z),c=node.kind==='portal'?[.22,.71,.77]:node.kind==='supply'?[.88,.65,.37]:[.45,.78,.8];if(node.kind==='portal'){for(let k=0;k<4;k++)m.ring(x,y+11,z,13+k*1.35,.35,c,42,2);m.box(x,y,z,20,.25,5,[.15,.24,.26]);return}
if(node.kind==='shelter'){m.box(x-15,y,z+3,17,10,15,[.18,.29,.30]);m.box(x-15,y+10,z+3,19,1,17,[.10,.17,.19]);m.box(x-15,y+2,z-4.65,4,3,.13,[.55,.77,.72],2)}
if(node.kind==='supply'){m.box(x,y,z,3.7,2.4,3.1,[.43,.36,.20]);m.box(x,y+2.2,z,3.85,.3,3.3,c,2)}
if(node.kind==='archive'){m.box(x+10,y,z-8,24,17,20,[.16,.22,.25]);m.box(x,y,z,4,5,2,[.26,.40,.42],2);m.box(x,y+5,z,.7,9,.6,c,2)}
if(node.kind==='relay'){m.cylinder(x,y,z,1,32,[.22,.33,.34],10);for(let k=0;k<3;k++){const yy=y+12+k*8;m.ring(x,yy,z,3.5,.25,[.4,.66,.67],16,2)}m.box(x,y,z+4,4,3,2.3,[.25,.33,.35])}
if(node.kind==='shelter'||node.kind==='supply'){m.cylinder(x+3,y,z,0.17,6,[.30,.43,.45],7);m.sphere(x+3,y+6.6,z,.58,c,6,8,2)}
}
export function buildWorld(){const m=new Mesh(),rng=randomFrom(20302019);const S=400,div=85;for(let i=0;i<div;i++)for(let j=0;j<div;j++){const x=-S+2*S*i/div,z=-S+2*S*j/div,X=x+2*S/div,Z=z+2*S/div;const y=terrainHeight(x,z)-.12,Y=terrainHeight(X,z)-.12,b=terrainHeight(X,Z)-.12,c=terrainHeight(x,Z)-.12;const f=Math.sin(x*.063)*Math.cos(z*.036),cl=[.19+.055*f,.255+.055*f,.231+.046*f];m.quad([x,y,z],[X,Y,z],[X,b,Z],[x,c,Z],cl)}
// A path through the ruined city is highlighted by code-generated pavement slabs.
for(let z=-277;z<73;z+=12){const y=terrainHeight(1,z)-.04;m.box(1,y,z,13,.2,11,[.20,.25,.25]);m.box(1,y+.22,z,1,.03,3,[.30,.37,.36])}
for(let x=-100;x<100;x+=10)m.box(x,terrainHeight(x,-104),-104,9,.2,11,[.21,.25,.24]);
// Ruined city blocks surround, but do not block, the exploration route.
for(let z=-68;z>-230;z-=27){for(const x of [-110,-83,-59,63,92,118]){if(rng()>.22)tower(m,x+(rng()-.5)*12,z+(rng()-.5)*10,rng)}}
for(let i=0;i<145;i++){const x=(rng()-.5)*490,z=(rng()-.5)*630;if(Math.abs(x)<23&&z<83&&z>-295)continue;if(NODES.some(n=>Math.hypot(x-n.x,z-n.z)<17))continue;tree(m,x,z,.45+rng()*1.6,rng)}
for(let i=0;i<150;i++){const x=(rng()-.5)*620,z=(rng()-.5)*690;if(NODES.some(n=>Math.hypot(x-n.x,z-n.z)<10))continue;m.box(x,terrainHeight(x,z),z,1+rng()*3,.4+rng()*1.2,1+rng()*3,[.19+rng()*.04,.24,.24])}
for(let z=-225;z<60;z+=38){const x=14,y=terrainHeight(x,z);m.cylinder(x,y,z,.33,10,[.30,.39,.40],7);m.box(x-1.5,y+9.5,z,3.3,.4,.7,[.23,.39,.40]);m.box(x-3.05,y+9,z,1,.2,.75,[.46,.81,.8],2)}
// Alpine silhouettes remain cheap mesh geometry rather than image skyboxes.
for(let i=0;i<26;i++){const x=-440+i*35,z=-390+(rng()-.5)*60,h=70+rng()*130;m.cone(x,terrainHeight(x,z)-12,z,42+rng()*38,h,[.13,.22,.22],5)}
for(const node of NODES)marker(m,node);
// A distant classified aircraft hangar and fictional oceanic anomaly observatory.
m.box(-170,terrainHeight(-170,-245),-245,58,13,43,[.15,.25,.26]);m.box(-170,terrainHeight(-170,-245)+13,-245,62,1,47,[.16,.20,.23]);
return m.data}
function dynamicWorld(t,game){const m=new Mesh();const move=Math.sin(t*.32),x=28+move*24,z=-115+Math.cos(t*.23)*16,y=terrainHeight(x,z);
// Patrolling robot: abstract surveillance obstacle, no weaponry.
m.box(x,y+.8,z,2.1,2.5,1.6,[.28,.38,.41]);m.box(x,y+3.2,z,1.6,1.4,1.5,[.30,.45,.47]);m.box(x,y+4.05,z-.83,1.05,.3,.1,[.89,.22,.22],2);for(const s of [-1,1]){m.cylinder(x+s*.7,y,z+s*.12,.26,1.1,[.2,.28,.30],6)}
// Distant UFO: readable silhouette, generated from rings and curved surfaces.
const ux=-100+Math.sin(t*.08)*22,uy=95+Math.sin(t*.4)*3,uz=-250;const seg=30;
for(let i=0;i<seg;i++){const a=i/seg*TAU,b=(i+1)/seg*TAU;const p=(r,q,h)=>[ux+Math.cos(q)*r,uy+h,uz+Math.sin(q)*r];m.quad(p(15,a,0),p(15,b,0),p(8,b,3.8),p(8,a,3.8),[.22,.34,.40]);m.quad(p(15,a,0),p(15,b,0),p(14.1,b,-.45),p(14.1,a,-.45),[.26,.74,.78],2)}m.sphere(ux,uy+2,uz,6,[.27,.45,.53],7,16);
// Gliding triangular pterosaur-like anomaly. Original abstract geometry.
const px=-14+Math.sin(t*.24)*34,py=54+Math.sin(t*.42)*4,pz=-230+Math.cos(t*.16)*12,flap=Math.sin(t*3.1)*2.3;m.triangle([px,py,pz],[px-15,py+flap,pz+5],[px-2,py-1,pz+4],[.22,.22,.24],3);m.triangle([px,py,pz],[px+15,py+flap,pz+5],[px+2,py-1,pz+4],[.20,.21,.23],3);m.cone(px,py-1,pz,1.3,3.4,[.19,.21,.22],5,3);
// A non-graphic mysterious wandering silhouette: it motivates avoidance.
const sx=-28+Math.sin(t*.24)*7,sz=-175+Math.cos(t*.27)*10,sy=terrainHeight(sx,sz);m.cylinder(sx,sy,sz,.62,3.8,[.12,.18,.20],8);m.sphere(sx,sy+4.2,sz,.75,[.13,.19,.22],8,10);
// Portal animated light core becomes more intense after the transmitter is activated.
const portal=NODES[5],yy=terrainHeight(portal.x,portal.z)+10.5;
for(let i=0;i<28;i++){const a=i/28*TAU+t*(.1+(i%3)*.06),r=3+(i%9)*.87;m.sphere(portal.x+Math.cos(a)*r,yy+Math.sin(a)*r,portal.z+(i%4-2)*.25,.25+i%3*.09,game.relay?[.28,.9,.92]:[.17,.42,.44],4,5,2)}
return m.data}
function setVAO(gl,b){const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,b);for(let i=0;i<4;i++){const size=i===3?1:3,offset=[0,12,24,36][i];gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,40,offset)}gl.bindVertexArray(null);return vao}
export class Renderer{
 constructor(canvas){this.canvas=canvas;const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,stencil:false,powerPreference:'high-performance'});if(!gl)throw Error('WebGL2 is unavailable on this device/browser.');this.gl=gl;this.worldProgram=program(gl,vertex,fragment);this.skyProgram=program(gl,skyV,skyF);this.skyVAO=gl.createVertexArray();this.worldBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.worldBuffer);const data=buildWorld();gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);this.worldCount=data.length/10;this.worldVAO=setVAO(gl,this.worldBuffer);this.dynamicBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicBuffer);gl.bufferData(gl.ARRAY_BUFFER,40000,gl.DYNAMIC_DRAW);this.dynamicVAO=setVAO(gl,this.dynamicBuffer);this.quality='auto';this.stereo=false;this.frames=0;this.fps=0;this.fpsTime=0;this.lastT=0;gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(.04,.09,.12,1);this.resize();window.addEventListener('resize',()=>this.resize());window.addEventListener('orientationchange',()=>setTimeout(()=>this.resize(),250));canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('error').textContent='Graphics context lost. Reload the page to restart the game.';document.getElementById('error').classList.remove('hidden')});}
 resize(){const q=this.quality==='low'?.68:this.quality==='medium'?.92:this.quality==='high'?1.5:Math.min(1.25,window.devicePixelRatio||1);this.canvas.width=Math.max(2,Math.round(innerWidth*q));this.canvas.height=Math.max(2,Math.round(innerHeight*q));}
 setQuality(q){this.quality=q;this.resize()}
 uniforms(prog,values){const gl=this.gl;for(const [k,v] of Object.entries(values)){const loc=gl.getUniformLocation(prog,k);if(loc===null)continue;if(v instanceof Float32Array)gl.uniformMatrix4fv(loc,false,v);else if(Array.isArray(v))gl.uniform3fv(loc,v);else gl.uniform1f(loc,v)}}
 draw(camera,game,t){const gl=this.gl;if(!this.canvas.width||!this.canvas.height)return;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const dyn=dynamicWorld(t,game);gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicBuffer);gl.bufferData(gl.ARRAY_BUFFER,dyn,gl.DYNAMIC_DRAW);const count=dyn.length/10;const half=this.stereo?2:1;for(let eye=0;eye<half;eye++){const w=Math.floor(this.canvas.width/half),aspect=w/this.canvas.height;gl.viewport(eye*w,0,w,this.canvas.height);gl.disable(gl.DEPTH_TEST);gl.useProgram(this.skyProgram);gl.bindVertexArray(this.skyVAO);this.uniforms(this.skyProgram,{uTime:t,uDay:game.daylight,uYaw:camera.yaw,uPitch:camera.pitch,uAspect:aspect});gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);gl.clear(gl.DEPTH_BUFFER_BIT);const offset=this.stereo?(eye===0?-.032:.032):0;const eyepos=[camera.x+Math.cos(camera.yaw)*offset,camera.y,camera.z+Math.sin(camera.yaw)*offset];const vp=matmul(perspective((this.stereo?83:74)*Math.PI/180,aspect,.1,1100),view(eyepos,camera.yaw,camera.pitch));gl.useProgram(this.worldProgram);this.uniforms(this.worldProgram,{uVP:vp,uEye:eyepos,uTime:t,uDay:game.daylight,uQuality:this.quality==='low'?0:1});gl.bindVertexArray(this.worldVAO);gl.drawArrays(gl.TRIANGLES,0,this.worldCount);gl.bindVertexArray(this.dynamicVAO);gl.drawArrays(gl.TRIANGLES,0,count)}gl.bindVertexArray(null);this.frames++;if(t-this.fpsTime>1){this.fps=Math.round(this.frames/(t-this.fpsTime));this.frames=0;this.fpsTime=t}}
}