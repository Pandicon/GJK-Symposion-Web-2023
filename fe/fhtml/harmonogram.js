const api="https://api.simp.klubkepler.eu/";
const days=["Čtvrtek 16.11.","Pátek 17.11.","Sobota 18.11"];
const dayids=["streda/","ctvrtek/","patek/"];
var tt_lkp={};
var tt_ld=false;
function format_update(utct){
	let d=new Date(utct*1000);
	return d.getDate()+"."+(d.getMonth()+1)+". "+("00"+d.getHours()).slice(-2)+":"+("00"+d.getMinutes()).slice(-2)+":"+("00"+d.getSeconds()).slice(-2)
}
function lecture_popup(lec,title,time,room,id){
	return async function(){
		console.log("fetching "+api+"anotace/"+id);
		const resp=await fetch(api+"anotace/"+id);
		const data=await resp.json();
		document.getElementById("lecture_popup").style.display="block";
		document.getElementById("ov_lecturer").textContent=lec;
		document.getElementById("ov_title").textContent=title;
		document.getElementById("ov_time").textContent=time;
		document.getElementById("ov_room").textContent=room;
		document.getElementById("ov_annotation").textContent=data.data.info.annotation;
		document.getElementById("ov_lecturer_info").textContent=data.data.info.lecturer_info;
		document.getElementById("ov_last_update").textContent="data z "+format_update(data.data.last_updated);
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
function make_table(div,data,day,dayid){
	let tt=div.appendChild(document.createElement("h4"));
	tt.classList.add("day_title");
	tt.appendChild(document.createTextNode(day));
	const table=div.appendChild(document.createElement("table"));
	table.id="timetable_"+dayid;
	for(let i=0;i<data.length;i++){
		const dr=data[i];
		const tr=table.insertRow();
		const tm=day+" "+(dr[0]===null?"":dr[0].title);
		for(let j=0;j<dr.length;j++){
			const dd=dr[j];
			const td=tr.insertCell();
			if(dd!==null){
				if("row_span"in dd){
					td.setAttribute("rowspan",dd.row_span);
				}
				if("col_span"in dd){
					td.setAttribute("colspan",dd.col_span);
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
					td.onclick=lecture_popup(dd.title,dd.lecturer,tm,data[0][j]===null?"":data[0][j].title,dayid+dd.id);
					td.classList.add("clickable");
					tt_lkp[dayid+dd.id]=td.onclick;
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
	console.log("fetching "+api+"harmonogram");
	const resp=await fetch(api+"harmonogram");
	const data=await resp.json();
	const hd=data.data.harmonogram;
	for(let i=0;i<hd.length;i++){
		make_table(tables_div,hd[i],days[i],dayids[i]);
	}
	let tu=tables_div.appendChild(document.createElement("span"));
	tu.classList.add("last_update");
	tu.textContent="data z "+format_update(data.data.last_updated);
	tt_ld=true;
}
gen_tables();
