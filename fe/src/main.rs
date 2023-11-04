pub mod utils;
mod gen_routes;

#[tokio::main]
pub async fn main() {
	gen_routes::run_server([0, 0, 0, 0], 8080).await;
}
