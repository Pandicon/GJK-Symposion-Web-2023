use std::io::{Read, Write};
use chrono::{Datelike, Timelike};

fn file_name_to_id(name: &str) -> String {
	name.replace(".", "_")
}
fn mk_clean(file : &str) {
	let mut buff : String = String::new();
	{
		let mut f = std::fs::File::open(String::from("./fhtml/")+file).unwrap();
		f.read_to_string(&mut buff).unwrap();
	}
	buff.retain(|c| c != '\t' && c != '\n');
	{
		let mut f = std::fs::File::create(String::from("./html/")+file).unwrap();
		f.write_all(buff.as_bytes()).unwrap();
	}
}
fn cached_ep(routes : &mut std::vec::Vec<&'static str>, hot_reload: bool, path : &'static str, epid : &'static str, ep : &str, ct : &str, val : &str, args : &str, cached_postfix : &str) -> String {
	let release_build = std::env::var("PROFILE").unwrap() == "release";
	routes.push(epid);
	
	if release_build || !hot_reload {
		let code = String::from("{\n\t\tif utils::check_if_modified_since(modified) {\n\t\t\tcached_response_t(")+ct+").body("+epid+
			"_data).unwrap()\n\t\t} else {\n\t\t\tutils::reply_cached"+cached_postfix+"()\n\t\t}\n\t}";
		format!("\tlet {}_data = {};\n\tlet {}_route = warp::path!({}).and(warp::header::optional(\"If-Modified-Since\")).map(move |{}modified : Option<String>| {});\n",
			epid, val, epid, ep, args, code)
	} else {
		let code = String::from("{\n\t\tif utils::check_if_modified_since(modified) {\n\t\t\tlet mut file = std::fs::File::open(&std::path::Path::new(\"") + path + "\")).unwrap();\n\t\t\tlet mut rsrc = String::new();\n\t\t\tlet _ = std::io::Read::read_to_string(&mut file, &mut rsrc);\n\t\t\tlet r: &'static str = Box::leak(rsrc.into_boxed_str());\n\t\t\tcached_response_t("+ct+").body(r).unwrap()\n\t\t} else {\n\t\t\tutils::reply_cached"+cached_postfix+"()\n\t\t}\n\t}";
		format!("\tlet {}_route = warp::path!({}).and(warp::header::optional(\"If-Modified-Since\")).map(move |{}modified : Option<String>| {});\n",
			epid, ep, args, code)
	}
}
fn cached_ep_annot(routes : &mut std::vec::Vec<&'static str>, epid : &'static str, ep : &str, ct : &str, val : &str, args : &str) -> String {
	routes.push(epid);
	let code1 = String::from("{\n\t\tif utils::check_if_modified_since(modified) {\n\t\t\tcached_response_t(")+ct+").body(utils::insert_annoation_autopopup(&"+epid+
		"_adata, &id)).unwrap()\n\t\t} else {\n\t\t\tutils::reply_cached()\n\t\t}\n\t}";
	let code2 = String::from("{\n\t\tif utils::check_if_modified_since(modified) {\n\t\t\tcached_response_t(")+ct+").body("+epid+
		"_data.clone()).unwrap()\n\t\t} else {\n\t\t\tutils::reply_cached()\n\t\t}\n\t}";
	format!("\tlet {}_data = {};\n\tlet {}_adata = {}_data.clone();\n\
		\tlet {}_route = warp::path!({}\"anotace\" / String).and(warp::header::optional(\"If-Modified-Since\")).map(move |{}id : String, modified : Option<String>| {}).or(\
		warp::path!({}).and(warp::header::optional(\"If-Modified-Since\")).map(move |{}modified : Option<String>| {}));\n",
		epid, val, epid, epid, epid, if ep.is_empty() { String::from("") } else { String::from(ep)+" / " }, args, code1, ep, args, code2)
}
fn page_with_sections(sections : &str, urlbase : &str) -> String {
	format!("utils::insert_js(&utils::insert_sections(rsrc_base_html, &[{}]), \"<script>var urlbase=\\\"{}\\\";</script>\")", sections, urlbase)
}
const DAYS : [&str; 7] = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS : [&str; 12] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
fn gen_routes() -> String {
	let release_build = std::env::var("PROFILE").unwrap() == "release";
	let now = chrono::offset::Utc::now();
	let date = now.date_naive();
	let time = now.time();
	let build_time = format!("{}, {:0>2} {} {:0>4} {:0>2}:{:0>2}:{:0>2} GMT", DAYS[date.weekday().num_days_from_monday() as usize], date.day0()+1,
		MONTHS[date.month0() as usize], date.year(), time.hour(), time.minute(), time.second());
	let mut out = String::from("use warp::Filter;\nuse crate::utils;\n");
	out += &format!(r#"pub const YEAR : u32 = {};
pub const MONTH0 : u32 = {};
pub const DAY : u32 = {};
pub const HOUR : u32 = {};
pub const MINUTE : u32 = {};
pub const SECOND : u32 = {};
"#, date.year(), date.month0(), date.day0()+1, time.hour(), time.minute(), time.second());
	out += &(String::from(r#"pub fn cached_response() -> warp::http::response::Builder {
	warp::http::Response::builder().header("last-modified", ""#) + &build_time + r#"")
}
pub fn cached_response_t(content_type : &str) -> warp::http::response::Builder {
	cached_response().header("content-type", content_type)
}"#);
	out += "\npub async fn run_server(ip : [u8; 4], port : u16) {\n";
	for f in std::fs::read_dir("./html/").unwrap() {
		let fn_ = f.unwrap().file_name().into_string().unwrap();
		if release_build {
			out += &format!("\tlet rsrc_{} = include_str!(\"../html/{}\");\n", file_name_to_id(&fn_), fn_);
		} else {
			let id = file_name_to_id(&fn_);
			out += &format!("\tlet mut file = std::fs::File::open(&std::path::Path::new(\"./html/{}\")).unwrap();\n\tlet mut rsrc_{} = String::new();\n\tlet _ = std::io::Read::read_to_string(&mut file, &mut rsrc_{});\n\tlet rsrc_{}: &'static str = Box::leak(rsrc_{}.into_boxed_str());\n", fn_, id, id, id, id);
		}
	}
	for f in std::fs::read_dir("./img/").unwrap() {
		let fn_ = f.unwrap().file_name().into_string().unwrap();
		out += &format!("\tlet img_{} = include_bytes!(\"../img/{}\");\n", file_name_to_id(&fn_), fn_);
	}
	let mut routes = vec![];
	out += &cached_ep_annot(&mut routes, "root", "", "utils::CT_HTML", &page_with_sections("rsrc_uvod_html, rsrc_o_akci_html, rsrc_harmonogram_html, rsrc_kontakty_html", ""), "");
	out += &cached_ep_annot(&mut routes, "harmonogram", "\"harmonogram\"", "utils::CT_HTML", &page_with_sections("rsrc_harmonogram_html", ""), "");
	out += &cached_ep(&mut routes, !release_build, if release_build { "./html/main.css" } else { "./fhtml/main.css" }, "main_css", "\"main.css\"", "utils::CT_CSS", "rsrc_main_css", "", "_str");
	out += &cached_ep(&mut routes, !release_build, if release_build { "./html/main.js" } else { "./fhtml/main.js" }, "main_js", "\"main.js\"", "utils::CT_JS", "rsrc_main_js", "", "_str");
	out += &cached_ep(&mut routes, !release_build, if release_build { "./html/harmonogram.js" } else { "./fhtml/harmonogram.js" }, "harmonogram_js", "\"harmonogram.js\"", "utils::CT_JS", "rsrc_harmonogram_js", "", "_str");
	out += &cached_ep(&mut routes, false, "./img/title.png","title", "\"img\" / \"title.png\"", "utils::CT_PNG", "img_title_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, false, "./img/ico.png","icon", "\"img\" / \"icon.png\"", "utils::CT_PNG", "img_ico_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, false, "./img/fbi.png","fbi", "\"img\" / \"fb.png\"", "utils::CT_PNG", "img_fb_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, false, "./img/igi.png","igi", "\"img\" / \"ig.png\"", "utils::CT_PNG", "img_ig_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, false, "./img/mail.png","maili", "\"img\" / \"mail.png\"", "utils::CT_PNG", "img_mail_png.as_slice()", "", "_slice");
	out += &(String::from("\n\tlet routes = ") + routes[0] + "_route");
	for r in routes.iter().skip(1) {
		out += &(String::from(".or(") + r + "_route)");
	}
	out += r#";
	println!("serving on {}.{}.{}.{}:{}...", ip[0], ip[1], ip[2], ip[3], port);
	warp::serve(routes).run((ip, port)).await;
}"#;
	out
}
fn main() {
	std::fs::create_dir_all("./html").expect("Couldn't create the html directory");
	for f in std::fs::read_dir("./fhtml/").unwrap() {
		mk_clean(&f.unwrap().file_name().into_string().unwrap());
	}
	let r = gen_routes();
	{
		let mut f = std::fs::File::create("./src/gen_routes.rs").unwrap();
		f.write_all(r.as_bytes()).unwrap();
	}
}
