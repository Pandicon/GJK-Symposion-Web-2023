function open_main_page(){
	window.location="/";
}
function open_timetable(){
	window.location="/harmonogram";
}
function to_about_event() {
	window.location = "/#o_akci";
}
function to_harmonogram() {
	window.location = "/#harmonogram";
}
function to_contacts() {
	window.location = "/#kontakty";
}

/*
__     ______   ____ _   _  ___  _     
\ \   / /  _ \ / ___| | | |/ _ \| |    
 \ \ / /| |_) | |   | |_| | | | | |    
  \ V / |  _ <| |___|  _  | |_| | |___ 
   \_/  |_| \_\\____|_| |_|\___/|_____|
*/
const vrchol_title = 
"  __     ______   ____ _   _  ___  _     \n" +
"  \\ \\   / /  _ \\ / ___| | | |/ _ \\| |    \n" +
"   \\ \\ / /| |_) | |   | |_| | | | | |    \n" + 
"    \\ V / |  _ <| |___|  _  | |_| | |___ \n" + 
"     \\_/  |_| \\_\\\\____|_| |_|\\___/|_____|";
console.log(vrchol_title);

const canvas=document.getElementById("hbg_canvas");
const header_bg=document.getElementById("header_bg");
let gl = canvas.getContext("webgl");

if (!gl) {
	gl=canvas.getContext("experimental-webgl");
}
if (!gl) {
	console.warn("webgl not supported, fallback to gif");
	document.getElementById("header_bg").classList.add("header_bg_nogl");
} else {
	gl.getExtension("OES_standard_derivatives");
	console.log("using webgl");
	const vssrc=`attribute vec2 vp;
	varying vec2 uv;
	uniform vec2 resolution;
	uniform float tmv;
	void main(){
		gl_Position=vec4(vp*2.0-vec2(1.0,1.0),0.0,1.0);
		float aspect=resolution.x/resolution.y;
		uv=vp*vec2(2.,4./aspect);
		uv+=vec2(-1.,sin(tmv/20.));
	}`;
	const fssrc=`#extension GL_OES_standard_derivatives : enable
	precision mediump float;
	varying vec2 uv;
	uniform float coef;
	uniform float tm;
	float wave(vec2 p){
		return sin(10.0*p.x+10.0*p.y)/5.0+
			   sin(8.0*p.x+5.0*p.y)/3.0+
			   sin(4.0*p.x+10.0*p.y)/-4.0+
			   sin(p.y)/2.0+
			   sin(p.x*p.x*p.y*5.0)+
			   sin(p.x*8.0+4.0)/5.0+
			   sin(p.y*10.0)/5.0+
			   sin(p.x)/4.0;
	}
	void main(){
		const vec3 colA=vec3(0.50,0.51,0.68);
		const vec3 colB=vec3(0.18,0.18,0.35);
		vec3 colbg=vec3(0.98,0.95,0.87);
		const vec3 colline=vec3(0.2);
		float z=wave(uv)+2.0;
		z*=2.0*(sin(tm/20.)+2.);
		float d2=fract(z*coef);
		float d=fract(d2*2.0);
		if(d2>0.5)colbg=mix(colA,colB,(sin(uv.x*5.+tm/15.0)+1.)/2.0);
		vec3 col;
		for(float i=0.;i<5.0;i++){
			col+=vec3(step(d/fwidth(z*3.5-((i+1.)/2.5)),1.5-(i+1.)/3.)*((i+1.)/5.0));
		}
		col=clamp(1.-col,0.,1.);
		gl_FragColor=vec4(mix(colline, colbg, col),1.);
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
	let tm_loc=gl.getUniformLocation(sh,"tm");
	let tmv_loc=gl.getUniformLocation(sh,"tmv");
	let res_loc=gl.getUniformLocation(sh,"resolution");
	let coef_loc=gl.getUniformLocation(sh,"coef");
	let mp_loc=gl.getUniformLocation(sh,"mp");
	let ms_loc=gl.getUniformLocation(sh,"ms");
	let mh_loc=gl.getUniformLocation(sh,"mh");
	document.onmousemove=function(e){
		gl.uniform2f(mp_loc,e.clientX*0.01,(canvas.height-e.clientY)*0.01);
	};
	var ms=0.1,tms=0.3,mh=0.1,tmh=8.0;
	document.onmousedown=function(){tms=1.3;tmh=12.0;};
	document.onmouseup=function(){tms=0.3;tmh=6.0;};
	function render(){
		canvas.width = header_bg.clientWidth*2.0;
		canvas.height = header_bg.clientHeight*2.0;
		const time=new Date().getTime()-begin_t;
		gl.viewport(0,0,canvas.width,canvas.height);
		ms=(tms+ms)*0.5;
		mh=(tmh+mh)*0.5;
		gl.uniform1f(ms_loc,ms);
		gl.uniform1f(mh_loc,mh);
		gl.uniform1f(tm_loc,time*0.001);
		gl.uniform1f(tmv_loc,time*0.001);
		gl.uniform2f(res_loc, canvas.width, canvas.height);
		gl.uniform1f(coef_loc, canvas.width>2200?1.25:0.75);
		gl.drawArrays(gl.TRIANGLES,0,6);
		setTimeout(function(){requestAnimationFrame(render);},50);
	};
	requestAnimationFrame(render);
}
