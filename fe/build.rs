use std::io::{Read, Write};
use chrono::{Datelike, Timelike};

const HOT_RELOAD_OPTION : bool = true;
const HOT_RELOAD : bool = false;

fn file_name_to_id(name: &str) -> String {
	name.replace(".", "_")
}
fn mk_clean(file : &str) {
	let mut buff : String = String::new();
	{
		let mut f = std::fs::File::open(String::from("./fhtml/")+file).unwrap();
		f.read_to_string(&mut buff).unwrap();
	}
	let mut keep = false;
	buff.retain(|c| {
		if c != '\t' && c != '\n' {
			if file.ends_with(".js") && c == '#' {
				keep = true;
			}
			return true;
		}
		if c == '\n' && keep {
			keep = false;
			true
		} else {
			false
		}
	});
	{
		let mut f = std::fs::File::create(String::from("./html/")+file).unwrap();
		f.write_all(buff.as_bytes()).unwrap();
	}
}
fn _uncached_ep(routes : &mut std::vec::Vec<&'static str>, epid : &'static str, ep : &str, ct : &str, val : &str, args : &str) -> String {
	routes.push(epid);
	let code = String::from("{\n\t\tutils::uncached_response_t(")+ct+").body("+epid+"_data).unwrap()\n\t}";
	format!("\tlet {}_data = {};\n\tlet {}_route = warp::path!({}).map(move |{}| {});\n", epid, val, epid, ep, args, code)
}
fn str_hot_reload_ep(routes : &mut std::vec::Vec<&'static str>, epid : &'static str, ep : &str, path : &'static str, ct : &str, args : &str) -> String {
	routes.push(epid);
	let code = String::from("{\n\t\tlet tm = utils::file_mod_time(\"")+path+"\");\n\t\tlet mut ul = (*"+epid+"_updated).lock().unwrap();\n\t\tif tm > *ul {\n\t\t\t*ul = tm;\n\t\t\t*(*"+
		epid+"_data).lock().unwrap() = std::fs::read_to_string(\""+path+"\").unwrap();\n\t\t}\n\t\tutils::uncached_response_t("+ct+").body((*(*"+epid+"_data).lock().unwrap()).clone()).unwrap()\n\t}";
	format!("\tlet {}_data = std::sync::Arc::new(std::sync::Mutex::new(String::new()));\n\tlet {}_updated = std::sync::Arc::new(std::sync::Mutex::new(0 as u64));\n\t\
		let {}_route = warp::path!({}).map(move |{}| {});\n", epid, epid, epid, ep, args, code)
}
fn cached_ep(routes : &mut std::vec::Vec<&'static str>, epid : &'static str, ep : &str, ct : &str, val : &str, args : &str, cached_postfix : &str) -> String {
	routes.push(epid);
	let code = String::from("{\n\t\tif utils::check_if_modified_since(modified) {\n\t\t\tcached_response_t(")+ct+").body("+epid+
		"_data).unwrap()\n\t\t} else {\n\t\t\tutils::reply_cached"+cached_postfix+"()\n\t\t}\n\t}";
	format!("\tlet {}_data = {};\n\tlet {}_route = warp::path!({}).and(warp::header::optional(\"If-Modified-Since\")).map(move |{}modified : Option<String>| {});\n",
		epid, val, epid, ep, args, code)
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
	format!("utils::insert_js(&utils::insert_sections(_rsrc_base_html, &[{}]), \"<script>var urlbase=\\\"{}\\\";</script>\")", sections, urlbase)
}
const DAYS : [&str; 7] = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS : [&str; 12] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
fn gen_routes() -> String {
	//let hot_reload = std::env::var("ENABLE_HOT_RELOAD").is_ok();
	let hot_reload = HOT_RELOAD;
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
	if hot_reload {
		out += "\tprintln!(\"hot-reload is on!\");\n";
	} else if HOT_RELOAD_OPTION {
		out += "\tprintln!(\"hot-reload is {}!\", if std::env::args().any(|a| a == \"--hot-reload\") { \"on (from command line)\" } else { \"off\" });\n";
	}
	for f in std::fs::read_dir("./html/").unwrap() {
		let fn_ = f.unwrap().file_name().into_string().unwrap();
		out += &format!("\tlet _rsrc_{} = include_str!(\"../html/{}\");\n", file_name_to_id(&fn_), fn_);
	}
	for f in std::fs::read_dir("./img/").unwrap() {
		let fn_ = f.unwrap().file_name().into_string().unwrap();
		out += &format!("\tlet _img_{} = include_bytes!(\"../img/{}\");\n", file_name_to_id(&fn_), fn_);
	}
	let mut routes = vec![];
	out += &cached_ep_annot(&mut routes, "root", "", "utils::CT_HTML", &page_with_sections("_rsrc_uvod_html, _rsrc_o_akci_html, _rsrc_harmonogram_html, &utils::load_tables(\"0,1,2\"), _rsrc_kontakty_html", "/"), "");
	out += &cached_ep_annot(&mut routes, "harmonogram", "\"harmonogram\"", "utils::CT_HTML", &page_with_sections("_rsrc_harmonogram_html, &utils::load_tables(\"0,1,2\")", "/harmonogram"), "");
	out += &cached_ep_annot(&mut routes, "harmonogram0", "\"harmonogram\" / \"day0\"", "utils::CT_HTML", &page_with_sections("_rsrc_harmonogram_html, &utils::load_tables(\"0\")", "/harmonogram/day0"), "");
	out += &cached_ep_annot(&mut routes, "harmonogram1", "\"harmonogram\" / \"day1\"", "utils::CT_HTML", &page_with_sections("_rsrc_harmonogram_html, &utils::load_tables(\"1\")", "/harmonogram/day1"), "");
	out += &cached_ep_annot(&mut routes, "harmonogram2", "\"harmonogram\" / \"day2\"", "utils::CT_HTML", &page_with_sections("_rsrc_harmonogram_html, &utils::load_tables(\"2\")", "/harmonogram/day2"), "");
	if !HOT_RELOAD_OPTION {
		if hot_reload {
			out += &str_hot_reload_ep(&mut routes, "main_css", "\"main.css\"", "./fhtml/main.css", "utils::CT_CSS", "");
			out += &str_hot_reload_ep(&mut routes, "main_js", "\"main.js\"", "./fhtml/main.js", "utils::CT_JS", "");
			out += &str_hot_reload_ep(&mut routes, "harmonogram_js", "\"harmonogram.js\"", "./fhtml/harmonogram.js", "utils::CT_JS", "");
		} else {
			out += &cached_ep(&mut routes, "main_css", "\"main.css\"", "utils::CT_CSS", "_rsrc_main_css", "", "_str");
			out += &cached_ep(&mut routes, "main_js", "\"main.js\"", "utils::CT_JS", "_rsrc_main_js", "", "_str");
			out += &cached_ep(&mut routes, "harmonogram_js", "\"harmonogram.js\"", "utils::CT_JS", "_rsrc_harmonogram_js", "", "_str");
		}
	}
	out += &cached_ep(&mut routes, "title", "\"img\" / \"title.png\"", "utils::CT_PNG", "_img_title_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, "icon", "\"img\" / \"icon.png\"", "utils::CT_PNG", "_img_ico_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, "fbi", "\"img\" / \"fb.png\"", "utils::CT_PNG", "_img_fb_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, "igi", "\"img\" / \"ig.png\"", "utils::CT_PNG", "_img_ig_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, "maili", "\"img\" / \"mail.png\"", "utils::CT_PNG", "_img_mail_png.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, "bgi", "\"img\" / \"bg.svg\"", "utils::CT_SVG", "_img_bg_svg.as_slice()", "", "_slice");
	out += &cached_ep(&mut routes, "baked_bgi", "\"img\" / \"baked_bg.gif\"", "utils::CT_GIF", "_img_baked_bg_gif.as_slice()", "", "_slice");
	out += &(String::from("\n\tlet routes = ") + routes[0] + "_route");
	for r in routes.iter().skip(1) {
		out += &(String::from(".or(") + r + "_route)");
	}
	out += ";\n";
	let end = |routes_var : &str| { String::from("\tprintln!(\"serving on {}.{}.{}.{}:{}...\", ip[0], ip[1], ip[2], ip[3], port);\n\twarp::serve(")+routes_var+").run((ip, port)).await;" };
	if HOT_RELOAD_OPTION {
		let mut routes2 = vec![];
		routes.push("hot_reloads");
		out += "\tif std::env::args().any(|a| a == \"--hot-reload\") {\n";
		out += &str_hot_reload_ep(&mut routes2, "main_css", "\"main.css\"", "./fhtml/main.css", "utils::CT_CSS", "");
		out += &str_hot_reload_ep(&mut routes2, "main_js", "\"main.js\"", "./fhtml/main.js", "utils::CT_JS", "");
		out += &str_hot_reload_ep(&mut routes2, "harmonogram_js", "\"harmonogram.js\"", "./fhtml/harmonogram.js", "utils::CT_JS", "");
		out += "\t\tlet routes2 = routes.or(main_css_route).or(main_js_route).or(harmonogram_js_route);\n";
		out += &end("routes2");
		out += "\t} else {\n";
		out += &cached_ep(&mut routes2, "main_css", "\"main.css\"", "utils::CT_CSS", "_rsrc_main_css", "", "_str");
		out += &cached_ep(&mut routes2, "main_js", "\"main.js\"", "utils::CT_JS", "_rsrc_main_js", "", "_str");
		out += &cached_ep(&mut routes2, "harmonogram_js", "\"harmonogram.js\"", "utils::CT_JS", "_rsrc_harmonogram_js", "", "_str");
		out += "\t\tlet routes2 = routes.or(main_css_route).or(main_js_route).or(harmonogram_js_route);\n";
		out += &end("routes2");
		out += "\t}\n";
	} else {
		out += &end("routes");
	}
	out += "}";
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
