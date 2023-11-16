function open_main_page(){
	window.location="/";
};
function open_timetable(){
	window.location="/harmonogram";
};
function to_about_event() {
	window.location="/#o_akci";
};
function to_harmonogram() {
	window.location="/#harmonogram";
};
function to_contacts() {
	window.location="/#kontakty";
};
console.log(`  __     ______   ____ _   _  ___  _     \n
  \\ \\   / /  _ \\ / ___| | | |/ _ \\| |    \n
   \\ \\ / /| |_) | |   | |_| | | | | |    \n
    \\ V / |  _ <| |___|  _  | |_| | |___ \n
     \\_/  |_| \\_\\\\____|_| |_|\\___/|_____|`);

const canvas=document.getElementById("hbg_canvas");
const header_bg=document.getElementById("header_bg");
let gl = canvas.getContext("webgl");
if (!gl) {
	gl=canvas.getContext("experimental-webgl");
};
if (!gl || !gl.getExtension("OES_standard_derivatives")) {
	console.warn("webgl not supported, fallback to gif");
	document.getElementById("header_bg").classList.add("header_bg_nogl");
} else {
	console.log("using webgl");
	const vssrc=`attribute vec2 vp;
	varying vec2 uv;
	uniform float aspect;
	uniform float tmv;
	void main(){
		gl_Position=vec4(vp*2.0-vec2(1.0,1.0),0.0,1.0);
		uv=vp*vec2(2.,4./aspect);
		uv+=vec2(-1.,sin(tmv/20.));
	}`;
	const fssrc=`#extension GL_OES_standard_derivatives : enable
	precision highp float;
	varying vec2 uv;
	uniform float coef;
	uniform float tm;
	uniform vec2 mp;
	uniform float ms;
	uniform float mh;
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
		const vec3 colline=vec3(1.0);
		float z=wave(uv)+2.0;
		z*=2.0*(sin(tm/20.)+2.);
		vec2 rmp=mp-gl_FragCoord.xy;
		float mfactor=exp(-0.0001*dot(rmp,rmp));
		z=mix(z,mh+3.0,mfactor);
		float d2=fract(z*coef);
		float d=fract(d2*2.0);
		if(d2>0.5){
			colbg=mix(colA,colB,(sin(uv.x*5.+tm/15.0)+1.)/2.0);
			colbg=mix(colbg,vec3(1.0),ms*mfactor);
		}
		vec3 col;
		for(float i=0.;i<5.0;i++){
			col+=vec3(step(d/fwidth(z*3.5-((i+1.)/2.5)),1.5-(i+1.)/3.)*((i+1.)/5.0));
		}
		col=clamp(1.-col,0.,1.);
		gl_FragColor=vec4(mix(colline,colbg,col),1.);
	}`;
	function make_sh(tp,src) {
		const o=gl.createShader(tp);
		gl.shaderSource(o,src);
		gl.compileShader(o);
		return o;
	};
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
	var begin_t = new Date().getTime();
	var tm_loc=gl.getUniformLocation(sh,"tm");
	var tmv_loc=gl.getUniformLocation(sh,"tmv");
	var aspect_loc=gl.getUniformLocation(sh,"aspect");
	var coef_loc=gl.getUniformLocation(sh,"coef");
	var mp_loc=gl.getUniformLocation(sh,"mp");
	var ms_loc=gl.getUniformLocation(sh,"ms");
	var mh_loc=gl.getUniformLocation(sh,"mh");
	function jswave(x,y){
		return Math.sin(10.0*x+10.0*y)/5.0+
			   Math.sin(8.0*x+5.0*y)/3.0+
			   Math.sin(4.0*x+10.0*y)/-4.0+
			   Math.sin(y)/2.0+
			   Math.sin(x*x*y*5.0)+
			   Math.sin(x*8.0+4.0)/5.0+
			   Math.sin(y*10.0)/5.0+
			   Math.sin(x)/4.0;
	};
	var smp={"x":0,"y":0};
	document.onmousemove=function(e){
		smp.x=e.clientX*2.0;
		smp.y=canvas.height-e.clientY*2.0;
		gl.uniform2f(mp_loc,smp.x,smp.y);
		smp.x=smp.x*2/canvas.width-1;
		smp.y=smp.y*4/canvas.width;
	};
	var ms=0.5,tms=0.5;
	document.onmousedown=function(){tms=0.8;};
	document.onmouseup=function(){tms=0.5;};
	let then = 0;
	let fps = 0;
	let droppedFrames = 0;
	let lowPower = false;
	function render(now){
		now *= 0.001;
		const deltaTime = now - then;
		then = now
		fps = 1 / deltaTime;
		canvas.width = header_bg.clientWidth*2.0;
		canvas.height = header_bg.clientHeight*2.0;
		const time=(new Date().getTime()-begin_t)*0.0005;
		gl.viewport(0,0,canvas.width,canvas.height);
		ms=(tms+ms)*0.5;
		gl.uniform1f(ms_loc,ms);
		gl.uniform1f(tm_loc,time);
		gl.uniform1f(tmv_loc,time);
		gl.uniform1f(aspect_loc, canvas.width/canvas.height);
		gl.uniform1f(coef_loc, canvas.width>2200?1.25:0.75);
		let st20=Math.sin(time/20.);
		gl.uniform1f(mh_loc,(jswave(smp.x,smp.y+st20)+2.0)*2.0*(st20+2.));
		gl.drawArrays(gl.TRIANGLES,0,6);
		if(fps < 15){
			droppedFrames += 1;
			
			if(droppedFrames > 50){
				console.warn("Too many dropped frames switching to low FPS mode.");
				lowPower = true;
			}
		}
		else{
			droppedFrames -=1;
		}
		setTimeout(function(){requestAnimationFrame(render);},lowPower ? 1000 : 50);
	};
	requestAnimationFrame(render);
};
document.getElementsByTagName("footer")[0].addEventListener("dblclick",function(e){
	const s=document.getElementsByClassName("emj");
	const d=["","inline"];
	for(let i=0;i<s.length;i++){
		s[i].style.display=d[1-d.indexOf(s[i].style.display)];
	}
});
