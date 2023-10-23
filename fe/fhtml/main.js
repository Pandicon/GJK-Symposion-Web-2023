function open_main_page(){
	window.location="/";
}
function open_timetable(){
	window.location="/harmonogram";
}

const canvas=document.getElementById("hbg_canvas");
const gl = canvas.getContext("webgl");
if (!gl) {
	console.log("trying experimental-webgl...");
	gl=canvas.getContext("experimental-webgl");
}
if (!gl) {
	console.warn("webgl not supported, fallback to gif");
	let si=document.getElementById("header_bg").appendChild(document.createElement("img"));
	si.src="/img/baked_bg.gif";
} else {
	console.log("using webgl");
	const vssrc=`attribute vec2 vp;
	varying vec2 uv;
	uniform vec2 aspect;
	void main(){
		uv=vp*aspect;
		gl_Position=vec4(vp*2.0-vec2(1.0,1.0),0.0,1.0);
	}`;
	const fssrc=`precision mediump float;
	varying vec2 uv;
	uniform float tm;

	/* https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83 */
	vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
	vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
	float snoise(vec3 v){ 
		const vec2 C = vec2(1.0/6.0,1.0/3.0);
		const vec4 D = vec4(0.0,0.5,1.0,2.0);
		vec3 i=floor(v + dot(v, C.yyy));
		vec3 x0=v-i+dot(i,C.xxx);
		vec3 g=step(x0.yzx,x0.xyz);
		vec3 l=1.0-g;
		vec3 i1=min(g.xyz,l.zxy);
		vec3 i2=max(g.xyz,l.zxy);
		vec3 x1=x0-i1+1.0*C.xxx;
		vec3 x2=x0-i2+2.0*C.xxx;
		vec3 x3=x0-1.+3.0*C.xxx;
		i = mod(i,289.0); 
		vec4 p=permute(permute(permute( 
			i.z+vec4(0.0,i1.z,i2.z,1.0))
			+i.y+vec4(0.0,i1.y,i2.y,1.0)) 
			+i.x+vec4(0.0,i1.x,i2.x,1.0));
		float n_=1.0/7.0;
		vec3  ns=n_*D.wyz-D.xzx;
		vec4 j=p-49.0*floor(p*ns.z*ns.z);
		vec4 x_=floor(j*ns.z);
		vec4 y_=floor(j-7.0*x_);
		vec4 x=x_*ns.x+ns.yyyy;
		vec4 y=y_*ns.x+ns.yyyy;
		vec4 h=1.0-abs(x)-abs(y);
		vec4 b0=vec4(x.xy,y.xy);
		vec4 b1=vec4(x.zw,y.zw);
		vec4 s0=floor(b0)*2.0+1.0;
		vec4 s1=floor(b1)*2.0+1.0;
		vec4 sh=-step(h,vec4(0.0));
		vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
		vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
		vec3 p0=vec3(a0.xy,h.x);
		vec3 p1=vec3(a0.zw,h.y);
		vec3 p2=vec3(a1.xy,h.z);
		vec3 p3=vec3(a1.zw,h.w);
		vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
		p0*=norm.x;
		p1*=norm.y;
		p2*=norm.z;
		p3*=norm.w;
		vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
		m=m*m;
		return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
	}
	void main(){
		float n=16.0*snoise(vec3(uv*.5,tm))+8.0*snoise(vec3(uv*1.0,tm+1.0))+4.0*snoise(vec3(uv*2.0,tm+2.0));
		n=mod(n,1.0);
		if(n<0.7){
			gl_FragColor=vec4(1.0,1.0,1.0,1.0);
		}else{
			vec3 col1=vec3(0.53,0.46,0.68);
			vec3 col2=vec3(0.21,0.12,0.37);
			gl_FragColor=vec4(mix(col1,col2,sin(uv.x+tm*20.0)*0.5+0.5),1.0);
		}
	}`;
	function make_sh(tp,src) {
		const o=gl.createShader(tp);
		gl.shaderSource(o,src);
		gl.compileShader(o);
		return o;
	}
	const vs=make_sh(gl.VERTEX_SHADER,vssrc);
	const fs=make_sh(gl.FRAGMENT_SHADER,fssrc);
	const sh=gl.createProgram();
	gl.attachShader(sh,vs);
	gl.attachShader(sh,fs);
	gl.linkProgram(sh);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	gl.useProgram(sh);
	const verts=new Float32Array([
		0,0,
		1,0,
		0,1,
		1,0,
		0,1,
		1,1,
	]);
	const vb=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,vb);
	gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
	const pattr=gl.getAttribLocation(sh,"vp");
	gl.vertexAttribPointer(pattr,2,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(pattr);
	const begin_t = new Date().getTime();
	function render(){
		canvas.width = window.innerWidth;
		const time=new Date().getTime()-begin_t;
		gl.viewport(0,0,canvas.width,canvas.height);
		gl.uniform1f(gl.getUniformLocation(sh,"tm"),time*0.00002);
		gl.uniform2f(gl.getUniformLocation(sh,"aspect"),canvas.width*0.01,canvas.height*0.01);
		gl.drawArrays(gl.TRIANGLES,0,6);
		setTimeout(function(){requestAnimationFrame(render);},20);
	}
	requestAnimationFrame(render);
}
