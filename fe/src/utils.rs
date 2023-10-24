pub fn insert_section(src : &str, section : &str) -> String {
	let mut out = src.to_owned();
	out.insert_str(src.find("</main>").unwrap_or(src.len()), section);
	out
}
pub fn insert_js(src : &str, js : &str) -> String {
	let mut out = src.to_owned();
	out.insert_str(src.find("</body>").unwrap_or(src.len()), js);
	out
}
pub fn insert_annoation_autopopup(src : &str, id : &str) -> String {
	let mut out = src.to_owned();
	if id.len() > 10 {
		return out;
	}
	out.insert_str(src.find("</body>").unwrap_or(src.len()), &format!("<script>popup(\"{}\");</script>", id));
	out
}
pub fn insert_sections(src : &str, sections : &[&str]) -> String {
	let mut out = src.to_owned();
	for s in sections {
		out = insert_section(&out, s);
	}
	out
}
pub const CT_HTML : &str = "text/html; charset=utf-8";
pub const CT_CSS : &str = "text/css; charset=utf-8";
pub const CT_JS : &str = "text/javascript; charset=utf-8";
pub const CT_PNG : &str = "image/png";
pub const MONTHS : [&str; 12] = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
pub fn check_if_modified_since(mod_if_time : Option<String>) -> bool {
	if let Some(t) = mod_if_time {
		if t.len() != 29 { return true; }
		if let Ok(x) = (t[12..16]).parse::<u32>() { if x < crate::gen_routes::YEAR { return true } } else { return true; }
		if let Some(x) = MONTHS.iter().position(|i| **i == t[8..11]) { if (x as u32) < crate::gen_routes::MONTH0 { return true } } else { return true; }
		if let Ok(x) = (t[5..7]).parse::<u32>() { if x < crate::gen_routes::DAY { return true } } else { return true; }
		if let Ok(x) = (t[17..19]).parse::<u32>() { if x < crate::gen_routes::HOUR { return true } } else { return true; }
		if let Ok(x) = (t[20..22]).parse::<u32>() { if x < crate::gen_routes::MINUTE { return true } } else { return true; }
		if let Ok(x) = (t[23..25]).parse::<u32>() { if x < crate::gen_routes::SECOND { return true } } else { return true; }
		return false;
	}
	true
}
pub fn reply_cached() -> warp::http::Response<String> {
	warp::http::Response::builder().status(304).body(String::new()).unwrap()
}
pub fn reply_cached_str() -> warp::http::Response<&'static str> {
	warp::http::Response::builder().status(304).body("").unwrap()
}
const EMPTY_BARR : [u8; 0] = [];
pub fn reply_cached_slice() -> warp::http::Response<&'static [u8]> {
	warp::http::Response::builder().status(304).body(EMPTY_BARR.as_slice()).unwrap()
}
 
