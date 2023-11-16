const api="https://api.simp.klubkepler.eu/";
var tt_lkp={};
var tt_ld=false;
var time_info = new Set();
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
	let o=await(fetch(api+url).then((r)=>{
		if(r.ok){
			return r.json();
		}
		throw new Error("fetch_error");
	}).then((o)=>{
		localStorage[lst]=t;
		localStorage[url]=JSON.stringify(o);
		return o;
	}).catch((e)=>{
		console.error("net_error: "+e);
		if(lst in localStorage){
			console.log("fallback to cache "+api+url+" from "+(t-localStorage[lst])+"s ago");
			return JSON.parse(localStorage[url]);
		}
		return null;
	}));
	return o;
}
function format_update(utct){
	let d=new Date(utct);
	return d.getDate()+"."+(d.getMonth()+1)+". "+("00"+d.getHours()).slice(-2)+":"+("00"+d.getMinutes()).slice(-2)+":"+("00"+d.getSeconds()).slice(-2)
}
function lecture_popup(lec,title,time,room,id){
	return async function(){
		const data=await cfetch("annotations?ids="+id);
		clear_info();
		document.getElementById("lecture_popup").style.display="block";
		const split_lec = lec.split("\n");
		for(let i = 0; i < split_lec.length; i += 1) {
			if(i > 0) {
				document.getElementById("ov_lecturer").appendChild(document.createElement("br"));
			}
			document.getElementById("ov_lecturer").appendChild(document.createTextNode(split_lec[i]));
		}
		const split_title = title.split("\n");
		for(let i = 0; i < split_title.length; i += 1) {
			if(i > 0) {
				document.getElementById("ov_title").appendChild(document.createElement("br"));
			}
			document.getElementById("ov_title").appendChild(document.createTextNode(split_title[i]));
		}
		document.getElementById("ov_time").textContent=time;
		document.getElementById("ov_room").textContent=room;
		const split_annotation = data.data.annotations[id].annotation.split("\n");
		for(let i = 0; i < split_annotation.length; i += 1) {
			if(i > 0) {
				document.getElementById("ov_annotation").appendChild(document.createElement("br"));
			}
			document.getElementById("ov_annotation").appendChild(document.createTextNode(split_annotation[i]));
		}
		const split_lecturer_info = data.data.annotations[id].lecturer_info.split("\n");
		for(let i = 0; i < split_lecturer_info.length; i += 1) {
			if(i > 0) {
				document.getElementById("ov_lecturer_info").appendChild(document.createElement("br"));
			}
			document.getElementById("ov_lecturer_info").appendChild(document.createTextNode(split_lecturer_info[i]));
		}
		document.getElementById("ov_last_update").textContent="Data z "+format_update(data.data.last_updated);
		window.history.pushState("","",urlbase+"anotace/"+id);
		window.onpopstate=function(e){hide_lecture();};
	};
}
function popup(a){
	if(!tt_ld)
		setTimeout(function(){popup(a);},100);
	else if(a in tt_lkp)
		tt_lkp[a]();
}
function remove_children(node) {
	while (node.firstChild) {
		node.removeChild(node.lastChild);
	}
}
function clear_info(){
	remove_children(document.getElementById("ov_lecturer"));
	remove_children(document.getElementById("ov_title"));
	remove_children(document.getElementById("ov_annotation"));
	remove_children(document.getElementById("ov_lecturer_info"));
}
function hide_lecture(){
	clear_info();
	document.getElementById("lecture_popup").style.display="none";
	window.history.pushState("","",urlbase);
	window.onpopstate=null;
}
function make_cell(td,dd,data,i,j,tmb){
	if(dd!==null){
		const tm=tmb+((!("rowspan"in dd)||i===0)?"":(data[i+dd.rowspan-1][0]==null?"":(" - "+data[i+dd.rowspan-1][0].title)));
		if("rowspan"in dd){
			td.setAttribute("rowspan",dd.rowspan);
		}
		if("colspan"in dd){
			td.setAttribute("colspan",dd.colspan);
		}
		if(j>0){
			let l=document.createElement("span");
			l.classList.add("lecturer");
			const split_lecturer = dd.lecturer.split("\n");
			for(let i = 0; i < split_lecturer.length; i += 1) {
				if(i > 0) {
					l.appendChild(document.createElement("br"));
				}
				l.appendChild(document.createTextNode(split_lecturer[i]));
			}
			td.appendChild(l);
			td.appendChild(document.createElement("br"));
		}
		let t=document.createElement("span");
		t.classList.add("lecture");
		const split_title = dd.title.split("\n");
		for(let i = 0; i < split_title.length; i += 1) {
			if(i > 0) {
				t.appendChild(document.createElement("br"));
			}
			t.appendChild(document.createTextNode(split_title[i]));
		}
		td.appendChild(t);
		let cell_data = `time:${tm},lecturer:${dd.lecturer},title:${dd.title}`;
		if(time_info.has(cell_data)) {
			td.classList.add("mobile_hidden");
		} else {
			time_info.add(cell_data);
		};
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
function make_table(div,data,dayid,day){
	time_info = new Set();
	let tt=div.appendChild(document.createElement("h4"));
	tt.classList.add("clickable");
	tt.classList.add("day_title");
	tt.textContent=day;
	tt.onclick=function(){
		window.location="/harmonogram/day"+dayid;
	};
	const table=div.appendChild(document.createElement("table"));
	table.id="timetable_"+dayid;
	for(let i=0;i<data.length;i++){
		const dr=data[i];
		const tr=table.insertRow();
		const tmb=i===0?"":(day+" "+(data[i-1][0]===null?"":data[i-1][0].title));
		for(let j=0;j<dr.length;j++){
			let dd=dr[j];
			const td=(j==0||i==0)?tr.appendChild(document.createElement("th")):tr.insertCell();
			if(i==0) {
				td.scope = "col";
			}
			if(j==0){
				td.classList.add("time");
				td.scope = "row";
				if(i==0) {
					dd=null;
				} else {
					dd=data[i-1][0];
				}
			}
			make_cell(td,dd,data,i,j,tmb);
		}
	}
	let etd=table.insertRow().appendChild(document.createElement("th"));
	etd.classList.add("time");
	etd.scope = "row";
	make_cell(etd,data[data.length-1][0],data,1,0,"");
	time_info = new Set();
}
async function gen_tables(days){
	let tables_div=document.getElementById("harmonogram_tables");
	while(tables_div.firstChild){
		tables_div.removeChild(tables_div.lastChild);
	}
	const data=await cfetch("harmonogram?days="+days);
	if(data){
		if("note"in data.data){
			let n=tables_div.appendChild(document.createElement("span"));
			n.classList.add("tt_note");
			for(const line of data.data.note.split("\n")) {
				let n_l=n.appendChild(document.createElement("div"));
				n_l.textContent=line;
			}
		}
		const hd=data.data.harmonogram;
		if(hd){
			for(let i=0;i<hd.length;i++){
				make_table(tables_div,hd[i].harmonogram,days.split(",")[i],hd[i].day);
			}
			let tu=tables_div.appendChild(document.createElement("span"));
			tu.classList.add("last_update");
			tu.textContent="Data z "+format_update(data.data.last_updated);
		}
	} else {
		let n=tables_div.appendChild(document.createElement("span"));
		n.classList.add("error_text");
		n.textContent="Nepodařilo se načíst harmonogram.";
	}
	tt_ld=true;
}
