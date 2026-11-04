---
title: "কেন Rust? Install আর প্রথম project"
short: "Why Rust"
part: 1
order: 1
summary: "Rust কেন C-এর মতো দ্রুত অথচ নিরাপদ, আর rustup ও cargo দিয়ে প্রথম project চালানোর পদ্ধতি।"
icon: "🚀"
minutes: 8
---

## কেন শিখবো?

C আর C++ খুব দ্রুত, কিন্তু memory নিয়ে ভুল করলে program crash করে বা security hole তৈরি হয়।
Python, Java বা Go নিরাপদ, কিন্তু তাদের garbage collector (GC) পেছনে চলতে থাকে, তাই সময় আর RAM বেশি লাগে।

Rust দুটোই দেয়: C-এর মতো গতি, আবার memory safety, **আর GC ছাড়াই**।
কীভাবে? compiler আগেই কোড পরীক্ষা করে। ভুল থাকলে program চালাতেই দেয় না। এই কারণে Rust-এর compiler শুরুতে একটু কড়া মনে হয়, কিন্তু পরে সেটাই বন্ধু হয়ে যায়।

## Rust কোথায় ব্যবহার হয়?

- **Operating system ও browser:** Linux kernel-এ Rust ব্যবহার হচ্ছে, Firefox-এর অনেক অংশ Rust-এ লেখা।
- **Cloud ও network:** Cloudflare, AWS আর Discord-এর মতো কোম্পানি দ্রুত ও নিরাপদ service বানাতে Rust নেয়।
- **CLI tool:** `ripgrep`, `bat`, `fd`-এর মতো জনপ্রিয় command-line tool।
- **WebAssembly, embedded, game, blockchain:** যেখানে গতি আর নির্ভরযোগ্যতা দুটোই দরকার।

Stack Overflow survey-তে Rust বছরের পর বছর "সবচেয়ে প্রিয় language"-এর তালিকায় ওপরে থাকে।

## Install করা: rustup

Rust install করার সরকারি টুলের নাম **rustup**। এটা compiler (`rustc`), build tool (`cargo`) আর আপডেট সব একসাথে সামলায়।

Linux বা macOS-এ terminal-এ এই একটা command চালাও:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Windows-এ [rustup.rs](https://rustup.rs) থেকে `rustup-init.exe` নামিয়ে চালাও। তখন Visual Studio C++ Build Tools লাগতে পারে, installer সেটা বলে দেবে।

install শেষে নতুন terminal খুলে version দেখো:

```bash
rustc --version
cargo --version
```

দুটো command-ই একটা version নম্বর দেখালে সব ঠিক আছে। পরে নতুন version এলে `rustup update` চালালেই হয়।

## প্রথম project: cargo new

`rustc` দিয়ে একটা ফাইল compile করা যায়, কিন্তু বাস্তবে সবাই **cargo** ব্যবহার করে। cargo project বানায়, compile করে, চালায়, আর বাইরের library-ও আনে।

```bash
cargo new hello
cd hello
```

`cargo new hello` এই ফোল্ডার বানায়:

```text
hello/
├── Cargo.toml
└── src/
    └── main.rs
```

`Cargo.toml` হলো project-এর পরিচয়পত্র:

```toml
[package]
name = "hello"
version = "0.1.0"
edition = "2024"
```

`edition` বলে Rust-এর কোন সংস্করণের নিয়ম চলবে। আর `src/main.rs`-এ cargo আগে থেকেই একটা কাজের program লিখে দেয়:

```rust
fn main() {
    println!("Hello, world!");
}
```

```text
Hello, world!
```

`main` হলো program-এর শুরু। এটা কীভাবে কাজ করে, পরের পাঠে দেখবো।

## cargo-র তিনটা প্রধান command

```bash
cargo run
cargo check
cargo build --release
```

- `cargo run`: compile করে সঙ্গে সঙ্গে চালায়। প্রতিদিনের কাজ এটাই।
- `cargo check`: শুধু ভুল আছে কিনা দেখে, binary বানায় না। তাই অনেক দ্রুত।
- `cargo build --release`: পুরো optimization সহ বানায়। ফলাফল থাকে `target/release/hello`-তে। শুধু `cargo run` করলে debug build হয়, যেটা compile-এ দ্রুত কিন্তু চালাতে ধীর।

`target/` ফোল্ডারে সব বানানো ফাইল জমে। এটা git-এ রাখার দরকার নেই, `cargo new` আগেই `.gitignore` বানিয়ে সেটা বাদ দিয়ে দেয়।

## সাধারণ ভুল

project ফোল্ডারের **বাইরে** `cargo run` চালানো:

```text
error: could not find `Cargo.toml` in `/home/you` or any parent directory
```

cargo `Cargo.toml` খুঁজে পায়নি, কারণ তুমি ভুল ফোল্ডারে আছো। `cd hello` করে project-এর ভেতরে ঢুকলেই ঠিক হয়ে যায়।

## নিজে করো

`greet` নামে একটা নতুন project বানাও, `src/main.rs`-এর লেখা বদলে `Hello, Rust!` print করাও, তারপর `cargo run` চালাও।

<details>
<summary>সমাধান দেখো</summary>

```bash
cargo new greet
cd greet
```

`src/main.rs` ফাইলটা এমন হবে:

```rust
fn main() {
    println!("Hello, Rust!");
}
```

```text
Hello, Rust!
```

তারপর `cargo run` চালালেই terminal-এ এই লেখা আসবে।

</details>

## মনে রাখো

- Rust দেয় C-এর গতি আর memory safety, কিন্তু GC ছাড়া।
- `rustup` দিয়ে Rust install আর update হয়।
- `cargo new` নতুন project বানায়, `cargo run` চালায়, `cargo check` দ্রুত ভুল ধরে।
- release-এর জন্য `cargo build --release`, ফলাফল `target/release/`-এ।
- `Cargo.toml` project-এর তথ্য রাখে, আর কোড থাকে `src/main.rs`-এ।
