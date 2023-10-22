function make_table(div, data) {
	const table = div.appendChild(document.createElement("table"));
	for (let i = 0; i < data.length; i++) {
		const dr = data[i];
		const tr = table.insertRow();
		for (let j = 0; j < dr.length; j++) {
			const dd = dr[j];
			const td = tr.insertCell();
			if (dd !== null) {
				td.appendChild(document.createTextNode(dd.title));
			}
		}
	}
}
async function fetch_tt() {
	const resp = await fetch("https://api.simp.klubkepler.eu/harmonogram"); /* using old api for testing */
	return await resp.json();
}
async function gen_tables() {
	let tables_div = document.getElementById("harmonogram_tables");
	const data = await fetch_tt();
	const hd = data.data.harmonogram;
	for (let i = 0; i < hd.length; i++) {
		make_table(tables_div, hd[i]);
	}
}
gen_tables();
