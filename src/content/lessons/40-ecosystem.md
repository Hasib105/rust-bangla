---
title: "Rust ইকোসিস্টেম আর পরের ধাপ"
short: "ইকোসিস্টেম"
part: 10
order: 40
summary: "cargo fmt, clippy, doc, workspace আর জনপ্রিয় crate-গুলো চিনে নাও, তারপর ঠিক করো এরপর কী বানাবে।"
icon: "🧰"
minutes: 8
---

## কেন শিখবো?

ভাষা শেখা শেষ হলে আসল কাজ শুরু: সবাই যে টুল আর library ব্যবহার করে, তা চেনা। Rust-এর সুবিধা হলো সব টুল `cargo`-র সাথেই আসে, আলাদা করে কিছু জোগাড় করতে হয় না।
এই শেষ পাঠে দেখবো কোড সুন্দর রাখার টুল, নিজের কোডের ডকুমেন্ট, একাধিক crate একসাথে রাখার উপায়, আর কোন crate দিয়ে কী হয়। শেষে কী বানালে তুমি সবচেয়ে বেশি শিখবে, সেটাও বলবো।

## cargo fmt আর clippy

- `cargo fmt` কোড নিজে নিজে সুন্দর করে সাজিয়ে দেয়। Rust community-র সবাই একই style মানে, তাই কারো কোড পড়তে অসুবিধা হয় না।
- `cargo clippy` একটা লিন্টার: কোড compile হলেও যেগুলো ঠিক Rust-এর রীতি নয়, সেগুলো ধরে আর ভালো লেখার উপায় বলে।

```bash
rustup component add rustfmt clippy   # একবার
cargo fmt                             # সব ফাইল সাজাও
cargo fmt --check                     # শুধু দেখো, বদলিও না (CI-তে)
cargo clippy                          # পরামর্শ দেখো
cargo clippy -- -D warnings           # warning থাকলে fail (CI-তে)
```

clippy সাধারণত নিচের পুরোনো ধাঁচের লুপ নিয়ে আপত্তি করে (index দিয়ে ঘোরা আর `&Vec<T>` parameter)। পাশেই clippy-র পছন্দের রূপ:

```rust
// The style clippy warns about
fn count_even_old(v: &Vec<i32>) -> usize {
    let mut n = 0;
    for i in 0..v.len() {
        if v[i] % 2 == 0 {
            n += 1;
        }
    }
    n
}

// The style clippy suggests
fn count_even(v: &[i32]) -> usize {
    v.iter().filter(|x| **x % 2 == 0).count()
}

fn main() {
    let v = vec![1, 2, 3, 4, 6];
    println!("old = {}", count_even_old(&v));
    println!("new = {}", count_even(&v));
}
```

```text
old = 3
new = 3
```

ফল একই, কিন্তু নতুনটা ছোট, পড়তে সহজ, আর `&[i32]` নিয়েছে বলে array বা slice সবই দেওয়া যায়।

## cargo doc: কোড থেকে ডকুমেন্ট

`///` দিয়ে লেখা comment হলো **doc comment**। `cargo doc --open` চালালে সেগুলো থেকে সুন্দর একটা ওয়েবসাইট বানায়, ঠিক docs.rs-এর মতো। Markdown চলে।

```rust
/// Returns the average of the numbers, or `None` if the slice is empty.
///
/// This text becomes the web page that `cargo doc` builds.
fn average(numbers: &[f64]) -> Option<f64> {
    if numbers.is_empty() {
        return None;
    }
    Some(numbers.iter().sum::<f64>() / numbers.len() as f64)
}

fn main() {
    println!("{:?}", average(&[2.0, 4.0, 9.0]));
    println!("{:?}", average(&[]));
}
```

```text
Some(5.0)
None
```

doc comment-এর ভেতরে একটা rust code block লিখলে `cargo test` সেটাকে সত্যিকারের test হিসেবে চালায়। তাই তোমার ডকুমেন্টের উদাহরণ কখনো পুরোনো (ভুল) হয়ে থাকে না। আর ডকুমেন্ট দেখতে চাইলে:

```bash
cargo doc --open
```

## Workspace: অনেক crate, এক প্রজেক্ট

প্রজেক্ট বড় হলে কয়েকটা crate-এ ভাগ করা হয়, যেমন `core` (logic) আর `cli` (terminal tool)। workspace এদের একসাথে রাখে: একই `Cargo.lock`, একই `target` folder, আর এক command-এ সব build ও test।

```toml
# Cargo.toml (workspace root)
[workspace]
members = ["core", "cli"]
resolver = "3"
```

```toml
# cli/Cargo.toml
[dependencies]
core = { path = "../core" }
```

```bash
cargo build                # সব member
cargo test --workspace     # সবার test
cargo run -p cli           # শুধু cli চালাও
```

## সাধারণ ভুল

আলাদা crate (বা module) থেকে function ডাকলে সেটা `pub` হতে হবে, না হলে private থাকে:

```rust compile_fail
mod utils {
    fn helper() -> i32 {
        42
    }
}

fn main() {
    println!("{}", utils::helper()); // error[E0603]: function `helper` is private
}
```

সমাধান: `pub fn helper()`। workspace-এ এটা আরো বেশি দরকার, কারণ প্রতিটা member আলাদা crate, আর অন্য crate শুধু `pub` জিনিসই দেখতে পায়।

## পরিচিত crate-গুলো

crate এর জন্য [crates.io](https://crates.io), আর ডকুমেন্টের জন্য [docs.rs](https://docs.rs)। `cargo add <name>` দিয়ে যোগ করা যায়।

| crate | কী করে |
|---|---|
| `serde` (+ `serde_json`) | struct থেকে JSON/TOML/YAML-এ আর ফিরে আসা। `#[derive(Serialize, Deserialize)]` |
| `tokio` | async runtime: network, timer, task (গত পাঠে দেখেছো) |
| `axum` | tokio-র ওপর web server framework |
| `clap` | command line argument parser, `--help` সহ। আমাদের হাতে লেখা `Config::build`-এর পেশাদার রূপ |
| `rayon` | data parallelism: `iter()`-কে `par_iter()` বানালেই সব CPU core কাজ করে |
| `anyhow` / `thiserror` | সহজ error handling, আগের `?`-এর পাঠের শেষে বলা হয়েছিল |

`rayon` কী করে, তার ধারণা আমরা নিজেই std দিয়ে বানাতে পারি: ডেটা দুই ভাগ, দুই thread, যোগফল জোড়া। `rayon` এই কাজ অনেক বুদ্ধি করে, অনেক ভাগে আর কম খরচে করে।

```rust
use std::thread;

fn parallel_sum(data: &[u64]) -> u64 {
    let mid = data.len() / 2;
    let (left, right) = data.split_at(mid);
    thread::scope(|s| {
        let a = s.spawn(|| left.iter().sum::<u64>());
        let b = s.spawn(|| right.iter().sum::<u64>());
        a.join().unwrap() + b.join().unwrap()
    })
}

fn main() {
    let data: Vec<u64> = (1..=100).collect();
    println!("sum = {}", parallel_sum(&data));
}
```

```text
sum = 5050
```

rayon দিয়ে সেটা একটা লাইন (crate লাগে, তাই `ignore`):

```rust ignore
use rayon::prelude::*;

fn main() {
    let data: Vec<u64> = (1..=100).collect();
    let sum: u64 = data.par_iter().sum();
    println!("sum = {sum}");
}
```

## এরপর কী বানাবে?

শেখার সবচেয়ে ভালো উপায় নিজের একটা জিনিস বানানো। কয়েকটা আইডিয়া, সহজ থেকে কঠিন:

1. **নিজের CLI tool**: todo list, file renamer, বা `clap` দিয়ে বানানো mini grep-এর উন্নত রূপ।
2. **JSON/CSV প্রসেসর**: `serde` দিয়ে ফাইল পড়ে হিসাব করা।
3. **ছোট web API**: `axum` + `serde`, ডেটা JSON-এ ফেরত দেওয়া।
4. **একটা খেলা বা terminal UI**: `ratatui` বা `bevy` দিয়ে।
5. **open source-এ যোগ দাও**: ছোট issue দিয়ে শুরু করো, ভালো প্রজেক্টে `good first issue` লেবেল দেখো।

আটকে গেলে official [The Rust Book](https://doc.rust-lang.org/book/) আর [Rust by Example](https://doc.rust-lang.org/rust-by-example/) আছে। আর compiler-এর error message পড়ো: Rust-এ সেটাই তোমার সবচেয়ে ভালো শিক্ষক।

## নিজে করো

আগের `count_even`-এর মতোই, clippy-র পছন্দের ধাঁচে `sum_squares(v: &[i32]) -> i32` লেখো। index দিয়ে লুপ চালিও না, iterator ব্যবহার করো। `[1, 2, 3]`-এর জন্য ফল print করো।

<details>
<summary>সমাধান দেখো</summary>

`map` প্রতিটাকে বর্গ করে, `sum` যোগ করে। 1 + 4 + 9 = 14।

```rust
fn sum_squares(v: &[i32]) -> i32 {
    v.iter().map(|x| x * x).sum()
}

fn main() {
    println!("{}", sum_squares(&[1, 2, 3]));
}
```

```text
14
```

</details>

## মনে রাখো

- `cargo fmt` কোড সাজায়, `cargo clippy` রীতি-বিরুদ্ধ কোড ধরে। দুটোই CI-তে চালানো ভালো অভ্যাস।
- `///` doc comment থেকে `cargo doc` ওয়েবসাইট বানায়, আর ভেতরের উদাহরণ `cargo test`-এ যাচাই হয়।
- workspace একসাথে অনেক crate রাখে: এক `Cargo.lock`, এক `target`। অন্য crate থেকে ডাকতে `pub` লাগে।
- serde, tokio, axum, clap, rayon: এই পাঁচটা crate চিনলে বেশিরভাগ বাস্তব প্রজেক্ট শুরু করা যায়।
- এবার বানানোর পালা: ছোট একটা প্রজেক্ট বেছে নাও আর শেষ করো। অভিনন্দন, তুমি Rust শিখেছো! 🦀
