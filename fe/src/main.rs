use warp::Filter;

fn insert_section(src : &str, section : &str) -> String {
	let mut out = src.to_owned();
	out.insert_str(src.find("</main>").unwrap_or(src.len()), section);
	out
}
fn insert_js(src : &str, js : &str) -> String {
	let mut out = src.to_owned();
	out.insert_str(src.find("</body>").unwrap_or(src.len()), js);
	out
}
fn insert_annoation_autopopup(src : &str, dayid : &str, id : &str) -> String {
	let mut out = src.to_owned();
	out.insert_str(src.find("</body>").unwrap_or(src.len()), &format!("<script>popup(\"{}/{}\");</script>", dayid, id));
	out
}
fn insert_sections(src : &str, sections : &[&str]) -> String {
	let mut out = src.to_owned();
	for s in sections {
		out = insert_section(&out, s);
	}
	out
}

#[tokio::main]
pub async fn main() {
	let base_html = include_str!("../html/base.html");
	let intro_section = include_str!("../html/uvod.html");
	let info_section = include_str!("../html/o_akci.html");
	let timetable_section = include_str!("../html/harmonogram.html");
	let contacts_section = include_str!("../html/kontakty.html");
	let main_css = include_str!("../html/main.css");
	let main_js = include_str!("../html/main.js");
	let timetable_js = include_str!("../html/harmonogram.js");
	let title_img = include_bytes!("../img/title.png");
	let icon_img = include_bytes!("../img/ico.png");

	let root_html = insert_js(&insert_sections(base_html, &[intro_section, info_section, timetable_section, contacts_section]), "<script>var urlbase=\"\";</script>");
	let root_annotation_html = root_html.clone();
	let root = warp::path!("anotace" / String / String).map(move |dayid : String, id : String| { warp::reply::html(insert_annoation_autopopup(&root_annotation_html, &dayid, &id)) }).or(
		warp::path::end().map(move || { warp::reply::html(root_html.clone()) }));

	let timetable_html = insert_js(&insert_sections(base_html, &[timetable_section]), "<script>var urlbase=\"/harmonogram\";</script>");
	let timetable_annotation_html = timetable_html.clone();
	let timetable = warp::path!("harmonogram" / "anotace" / String / String).map(move |dayid : String, id : String| { warp::reply::html(insert_annoation_autopopup(&timetable_annotation_html, &dayid, &id)) }).or(
		warp::path::path("harmonogram").map(move || { warp::reply::html(timetable_html.clone()) }));

	let css = warp::path("main.css").map(move || { warp::http::Response::builder().header("content-type", "text/css").body(main_css) });
	let js = warp::path("main.js").map(move || { warp::http::Response::builder().header("content-type", "text/javascript").body(main_js) });
	let tt_js = warp::path("harmonogram.js").map(move || { warp::http::Response::builder().header("content-type", "text/javascript").body(timetable_js) });
	let title = warp::path!("img" / "title.png").map(move || { warp::http::Response::builder().header("content-type", "image/png").body(std::vec::Vec::from(*title_img)) });
	let icon = warp::path!("img" / "icon.png").map(move || { warp::http::Response::builder().header("content-type", "image/png").body(std::vec::Vec::from(*icon_img)) });
	let resources = css.or(js).or(tt_js).or(title).or(icon);

	let routes = warp::get().and(root.or(timetable).or(resources));
	let addr = ([127, 0, 0, 1], 3752);
	println!("serving {}.{}.{}.{}:{}", addr.0[0], addr.0[1], addr.0[2], addr.0[3], addr.1);
	warp::serve(routes).run(addr).await;
}
