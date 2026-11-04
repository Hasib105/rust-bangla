---
title: "কেন Rust? Install আর প্রথম project"
short: "Why Rust"
part: 1
order: 1
summary: "Rust কেন C-এর মতো দ্রুত অথচ নিরাপদ, আর rustup ও cargo দিয়ে প্রথম project চালানোর পদ্ধতি।"
minutes: 5
---

## কেন শিখবো?

C আর C++ দ্রুত, কিন্তু memory ভুলে crash আর security hole হয়। Python বা Java নিরাপদ, কিন্তু garbage collector (GC) সময় আর RAM খায়।
Rust দেয় C-এর গতি আর memory safety, **GC ছাড়াই**। compiler আগেই কোড পরীক্ষা করে।

## Install: rustup

Rust install করার সরকারি টুল **rustup**। এটা compiler (`rustc`), `cargo` আর update সামলায়। Windows-এ [rustup.rs](https://rustup.rs) থেকে installer নামাও।

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version
cargo --version
```

নতুন terminal খুলে দুটো version দেখালে সব ঠিক। পরে `rustup update` দিয়ে update করো।

## প্রথম project: cargo new

বাস্তবে সবাই **cargo** ব্যবহার করে। এটা project বানায়, compile করে, চালায়।

```bash
cargo new hello
cd hello
```

```text
hello/
├── Cargo.toml
└── src/
    └── main.rs
```

`Cargo.toml` হলো project-এর পরিচয়পত্র (নাম, version, edition)। আর কোড থাকে `src/main.rs`-এ:

```rust
fn main() {
    println!("Hello, world!");
}
```

```text
Hello, world!
```

## cargo-র তিনটা command

- `cargo run`: compile করে চালায়। প্রতিদিনের কাজ।
- `cargo check`: শুধু ভুল দেখে, binary বানায় না। তাই অনেক দ্রুত।
- `cargo build --release`: পুরো optimization সহ বানায়। ফলাফল `target/release/`-এ।

## সাধারণ ভুল

project ফোল্ডারের **বাইরে** `cargo run` চালানো:

```text
error: could not find `Cargo.toml` in `/home/you` or any parent directory
```

`cd hello` করে project-এর ভেতরে ঢুকলেই ঠিক।

## নিজে করো

`greet` নামে নতুন project বানাও, `Hello, Rust!` print করাও, তারপর `cargo run` চালাও।

<details>
<summary>সমাধান দেখো</summary>

```bash
cargo new greet
cd greet
```

`src/main.rs`:

```rust
fn main() {
    println!("Hello, Rust!");
}
```

```text
Hello, Rust!
```

</details>

## মনে রাখো

- Rust দেয় C-এর গতি আর memory safety, GC ছাড়া।
- `rustup` দিয়ে install ও update হয়।
- `cargo new` বানায়, `cargo run` চালায়, `cargo check` দ্রুত ভুল ধরে।
- release build যায় `target/release/`-এ।
