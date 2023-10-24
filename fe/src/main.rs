pub mod utils;
mod gen_routes;

#[tokio::main]
pub async fn main() {
	gen_routes::run_server([127, 0, 0, 1], 3752).await;
}
