use std::io::{Read, Write};

fn mk_clean(file : &str) {
	let mut buff : String = String::new();
	{
		let mut f = std::fs::File::open(&(String::from("./fhtml/")+file)).unwrap();
		f.read_to_string(&mut buff).unwrap();
	}
	buff.retain(|c| return c != '\t' && c != '\n');
	{
		let mut f = std::fs::File::create(&(String::from("./html/")+file)).unwrap();
		f.write_all(buff.as_bytes()).unwrap();
	}
}
fn main() {
	for f in std::fs::read_dir("./fhtml/").unwrap() {
		mk_clean(&f.unwrap().file_name().into_string().unwrap());
	}
}
