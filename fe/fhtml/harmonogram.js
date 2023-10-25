const api="http://127.0.0.1:3976/";/*"https://api.simp.klubkepler.eu/";*/
const days=["Čtvrtek 16.11.","Pátek 17.11.","Sobota 18.11"];
var tt_lkp={};
var tt_ld=false;
async function cfetch(url) {
	let lst="T_"+url;
	let t=Math.floor(new Date().getTime()/1000);
	if(lst in localStorage){
		if(t-localStorage[lst]<600) {
			console.log("fetch to "+api+url+" was cached "+(t-localStorage[lst])+"s ago");
			return JSON.parse(localStorage[url]);
		}
	}
	console.log("fetching "+api+url);
	let d=await fetch(api+url);
	let o=await d.json();
	localStorage[lst]=t;
	localStorage[url]=JSON.stringify(o);
	return o;
}
function format_update(utct){
	let d=new Date(utct);
	return d.getDate()+"."+(d.getMonth()+1)+". "+("00"+d.getHours()).slice(-2)+":"+("00"+d.getMinutes()).slice(-2)+":"+("00"+d.getSeconds()).slice(-2)
}
function lecture_popup(lec,title,time,room,id){
	return async function(){
		const data=await cfetch("annotations?ids="+id);
		document.getElementById("lecture_popup").style.display="block";
		document.getElementById("ov_lecturer").textContent=lec;
		document.getElementById("ov_title").textContent=title;
		document.getElementById("ov_time").textContent=time;
		document.getElementById("ov_room").textContent=room;
		document.getElementById("ov_annotation").textContent=data.data.annotations[id].annotation;
		document.getElementById("ov_lecturer_info").textContent=data.data.annotations[id].lecturer_info;
		document.getElementById("ov_last_update").textContent="Data z "+format_update(data.data.last_updated);
		window.history.pushState("","",urlbase+"/anotace/"+id);
		window.onpopstate=function(e){hide_lecture();};
	};
}
function popup(a){
	if(!tt_ld)
		setTimeout(function(){popup(a);},100);
	else if(a in tt_lkp)
		tt_lkp[a]();
}
function hide_lecture(){
	document.getElementById("lecture_popup").style.display="none";
	window.history.pushState("","",urlbase+"/");
	window.onpopstate=null;
}
function make_table(div,data,dayid){
	let tt=div.appendChild(document.createElement("h4"));
	tt.classList.add("day_title");
	tt.appendChild(document.createTextNode(days[dayid]));
	const table=div.appendChild(document.createElement("table"));
	table.id="timetable_"+dayid;
	for(let i=0;i<data.length;i++){
		const dr=data[i];
		const tr=table.insertRow();
		const tmb=i===0?"":(days[dayid]+" "+(data[i-1][0]===null?"":data[i-1][0].title));
		for(let j=0;j<dr.length;j++){
			const dd=dr[j];
			const td=(j==0||i==0)?tr.appendChild(document.createElement("th")):tr.insertCell();
			if(j==0){td.classList.add("time");}
			if(dd!==null){
				const tm = tmb + ((!("rowspan" in dd) || i === 0)?"":(data[i+dd.rowspan-1][0]==null?"":(" - " + data[i+dd.rowspan-1][0].title)));
				if("rowspan"in dd){
					td.setAttribute("rowspan",dd.rowspan);
				}
				if("colspan"in dd){
					td.setAttribute("colspan",dd.colspan);
				}
				let l=document.createElement("span");
				l.classList.add("lecturer");
				l.appendChild(document.createTextNode(dd.lecturer));
				td.appendChild(l);
				td.appendChild(document.createElement("br"));
				let t=document.createElement("span");
				t.classList.add("lecture");
				t.appendChild(document.createTextNode(dd.title));
				td.appendChild(t);
				if(dd.for_younger){
					let t=document.createElement("span");
					t.classList.add("for_younger");
					t.appendChild(document.createTextNode("*"));
					td.appendChild(t);
				}
				if(dd.id!=null){
					td.onclick=lecture_popup(dd.lecturer,dd.title,tm,data[0][parseInt(dd.id.split("-")[2])]?.title??"",dd.id);
					td.classList.add("clickable");
					tt_lkp[dd.id]=td.onclick;
				}
			}
		}
	}
}
async function gen_tables(){
	let tables_div=document.getElementById("harmonogram_tables");
	while(tables_div.firstChild){
		tables_div.removeChild(tables_div.lastChild);
	}
	const data=await cfetch("harmonogram");
	const hd=data.data.harmonogram;
	for(let i=0;i<hd.length;i++){
		make_table(tables_div,hd[i].harmonogram,i);
	}
	let tu=tables_div.appendChild(document.createElement("span"));
	tu.classList.add("last_update");
	tu.textContent="data z "+format_update(data.data.last_updated);
	tt_ld=true;
}
gen_tables();