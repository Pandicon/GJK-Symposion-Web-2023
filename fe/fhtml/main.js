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
	gl.getExtension("OES_standard_derivatives");
	console.log("using webgl");
	const vssrc=`attribute vec2 vp;
	void main(){
		gl_Position=vec4(vp*2.0-vec2(1.0,1.0),0.0,1.0);
	}`;
	const fssrc=`#extension GL_OES_standard_derivatives : enable
	precision mediump float;
	
	uniform float tm;
	uniform vec2 resolution;
	
	float wave(float x, float y)
	{
		return sin(10.0*x+10.0*y) / 5.0 +
			   sin(8.0*x+5.0*y) / 3.0 +
			   sin(4.0*x+10.0*y) / -4.0 +
			   sin(y) / 2.0 +
			   sin(x*x*y*5.0) +
			   sin(x * 8.0 + 4.0) / 5.0 +
			   sin(y * 10.0) / 5.0 + 
			   sin(x) / 4.0;
	}
	
	void main()
	{
		const vec3 col1 = vec3(0.8, 0.1, 0.5);
		const vec3 col2 = vec3(0.1, 0.1, 0.8);
		vec2 uv = gl_FragCoord.xy / resolution.xy;
		float aspect = resolution.x/resolution.y;
		uv.y /= aspect;
		uv.xy *= vec2(2., 4.);
		uv.x -= 1.;
		uv.y = uv.y + sin(tm/20.);
		
		float z = wave(uv.x, uv.y) + 2.0;
		
		
		z *= 2.0 * (sin(tm/20.)+2.);
		float d = fract(z*1.5); // by changing the coefficient of z you change the amount of lines on screen
		if(mod(z, 2.0) > 1.) d = 1.-d;
		 
		vec3 col = vec3(0.3, 0.3, 0.3);
		for(float i=0.; i<5.; i++){
			col += vec3(step(d/fwidth(z*3.5-((i+1.)/2.5)), 0.5+1. - (i+1.)/3.)*((i+1.)/5.));
		}
		
		//col *= mix(col1, col2, fwidth(z*3.)+0.3); the z coeficient needs to be multiplied respectivly to resolution and i can't get that to work properly...
		col *= mix(col1, col2, gl_FragCoord.x / resolution.x);
		
		gl_FragColor = vec4(col, 1.);
	}`;
	function make_sh(tp,src) {
		const o=gl.createShader(tp);
		gl.shaderSource(o,src);
		gl.compileShader(o);
		console.log("Compilation log:" + gl.getShaderInfoLog(o));
		return o;
	}
	const vs=make_sh(gl.VERTEX_SHADER,vssrc);
	const fs=make_sh(gl.FRAGMENT_SHADER,fssrc);
	const sh=gl.createProgram();
	gl.attachShader(sh,vs);
	gl.attachShader(sh,fs);
	gl.linkProgram(sh);
	if(!gl.getProgramParameter(sh, gl.LINK_STATUS)){
		var infor = gl.getProgramInfoLog(sh);
		throw new Error("Could not compile WebGL program: \n\n" + infor)
	}
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
	sh.resolution = gl.getUniformLocation(sh, "resolution");
	const vb=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,vb);
	gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
	const pattr=gl.getAttribLocation(sh,"vp");
	gl.vertexAttribPointer(pattr,2,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(pattr);
	const begin_t = new Date().getTime()-Math.floor(Math.random()*100000);
	let tm_loc=gl.getUniformLocation(sh,"tm");
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
		canvas.width = document.body.clientWidth;
		const time=new Date().getTime()-begin_t;
		gl.viewport(0,0,canvas.width,canvas.height);
		ms=(tms+ms)*0.5;
		mh=(tmh+mh)*0.5;
		gl.uniform1f(ms_loc,ms);
		gl.uniform1f(mh_loc,mh);
		gl.uniform1f(tm_loc,time*0.001);
		gl.uniform2f(sh.resolution, canvas.width, canvas.height);
		gl.drawArrays(gl.TRIANGLES,0,6);
		setTimeout(function(){requestAnimationFrame(render);},50);
	};
	requestAnimationFrame(render);
}
