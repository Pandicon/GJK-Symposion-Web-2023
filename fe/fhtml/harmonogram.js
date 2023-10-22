const api = "https://api.simp.klubkepler.eu/";
function lecture_popup(id) {
	return async function() {
		const resp = await fetch(api+"anotace/streda/"+id);/* test */
		const data = await resp.json();
		alert(data.data.info.annotation);
	};
}
function make_table(div, data) {
	const table = div.appendChild(document.createElement("table"));
	for (let i = 0; i < data.length; i++) {
		const dr = data[i];
		const tr = table.insertRow();
		for (let j = 0; j < dr.length; j++) {
			const dd = dr[j];
			const td = tr.insertCell();
			if (dd !== null) {
				if ("row_span" in dd) {
					td.setAttribute("rowspan", dd.row_span);
				}
				if ("col_span" in dd) {
					td.setAttribute("colspan", dd.col_span);
				}
				let l = document.createElement("span");
				l.setAttribute("class", "lecturer");
				l.appendChild(document.createTextNode(dd.lecturer));
				td.appendChild(l);
				td.appendChild(document.createElement("br"));
				let t = document.createElement("span");
				t.setAttribute("class", "lecture");
				t.appendChild(document.createTextNode(dd.title));
				td.appendChild(t);
				if (dd.for_younger) {
					let t = document.createElement("span");
					t.setAttribute("class", "for_younger");
					t.appendChild(document.createTextNode("*"));
					td.appendChild(t);
				}
				if (dd.id != null) {
					td.onclick = lecture_popup(dd.id);
					td.setAttribute("class", "clickable");
				}
			}
		}
	}
}
async function gen_tables() {
	let tables_div = document.getElementById("harmonogram_tables");
	const resp = await fetch(api+"harmonogram");
	const data = await resp.json();
	const hd = data.data.harmonogram;
	for (let i = 0; i < hd.length; i++) {
		make_table(tables_div, hd[i]);
	}
}
gen_tables();
