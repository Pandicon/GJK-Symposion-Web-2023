use warp::Filter;

fn insert_section(src : &str, section : &str) -> String {
	let mut out = src.to_owned();
	out.insert_str(src.find("</main>").unwrap_or(src.len()), section);
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
	let icon = include_bytes!("../img/ico.png");

	let root_html = insert_sections(base_html, &[intro_section, info_section, timetable_section, contacts_section]);
	let root = warp::path::end().map(move || { warp::reply::html(root_html.clone()) });
	let empty_html = base_html;
	let empty = warp::path("empty").map(move || { warp::reply::html(empty_html) });
	let css = warp::path("main.css").map(move || { warp::http::Response::builder().header("content-type", "text/css").body(main_css) });
	let icon = warp::path!("img" / "icon.png").map(move || { warp::http::Response::builder().header("content-type", "image/png").body(std::vec::Vec::from(*icon)) });
	let routes = warp::get().and(root.or(css).or(icon).or(empty));
	let addr = ([127, 0, 0, 1], 3752);
	println!("serving {}.{}.{}.{}:{}", addr.0[0], addr.0[1], addr.0[2], addr.0[3], addr.1);
	warp::serve(routes).run(addr).await;
}
