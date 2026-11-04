---
title: "Rust ইকোসিস্টেম আর পরের ধাপ"
short: "ইকোসিস্টেম"
part: 10
order: 40
summary: "cargo fmt, clippy, doc, workspace আর জনপ্রিয় crate-গুলো চিনে নাও, তারপর ঠিক করো এরপর কী বানাবে।"
icon: "🧰"
minutes: 5
---

## কেন শিখবো?

সব দরকারি টুল `cargo`-র সাথেই আসে। শেষ পাঠে চিনে নাও কোড সাজানোর টুল, ডকুমেন্ট, workspace আর জনপ্রিয় crate।

## cargo fmt আর clippy

`cargo fmt` কোড সুন্দর করে সাজায়, আচরণ বদলায় না। `cargo clippy` লিন্টার: compile হওয়া কোডেও রীতি-বিরুদ্ধ অংশ ধরে। দুটোই CI-তে চালানো ভালো অভ্যাস।

```bash
cargo fmt                      # format all files
cargo fmt --check              # check only (CI)
cargo clippy -- -D warnings    # fail on any warning (CI)
```

## cargo doc

`///` হলো **doc comment**। `cargo doc --open` সেগুলো থেকে ওয়েবসাইট বানায়। ভেতরের rust code block-কে `cargo test` সত্যিকারের test হিসেবে চালায়।

```rust
/// Returns the average of the numbers, or `None` if the slice is empty.
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

## Workspace

বড় প্রজেক্ট কয়েকটা crate-এ ভাগ হয়। workspace সবাইকে একসাথে রাখে: **একই `Cargo.lock`, একই `target` folder**।

```toml
# Cargo.toml (workspace root)
[workspace]
members = ["core", "cli"]
resolver = "3"
```

## পরিচিত crate

[crates.io](https://crates.io)-তে crate খোঁজো, `cargo add <name>` দিয়ে যোগ করো।

- `serde`: struct থেকে JSON-এ আর ফিরে আসা।
- `tokio`: async runtime; `axum`: তার ওপর web framework।
- `clap`: command line argument parser।
- `rayon`: `iter()`-কে `par_iter()` করলেই সব core কাজ করে। নিচে তার হাতে-লেখা রূপ:

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

## সাধারণ ভুল

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

`pub fn helper()` লেখো। workspace-এ অন্য crate শুধু `pub` জিনিসই দেখে।

## নিজে করো

clippy-র পছন্দের ধাঁচে `sum_squares(v: &[i32]) -> i32` লেখো (index-loop নয়, iterator)। `[1, 2, 3]`-এর ফল print করো।

<details>
<summary>সমাধান দেখো</summary>

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

- `cargo fmt` সাজায়, `cargo clippy` রীতি-বিরুদ্ধ কোড ধরে।
- `///` থেকে `cargo doc`; ভেতরের উদাহরণ `cargo test`-এ যাচাই হয়।
- workspace: এক `Cargo.lock`, এক `target`; অন্য crate থেকে ডাকতে `pub`।
- এবার বানানোর পালা: একটা ছোট প্রজেক্ট বেছে শেষ করো। অভিনন্দন, তুমি Rust শিখেছো! 🦀
