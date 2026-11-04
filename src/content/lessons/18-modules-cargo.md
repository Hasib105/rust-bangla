---
title: "Module, Cargo আর crate"
short: "Module"
part: 4
order: 18
summary: "mod দিয়ে কোড ভাগ করা, pub দিয়ে দরজা খোলা, use দিয়ে ছোট নাম। সাথে ফাইল সাজানো আর Cargo.toml দিয়ে অন্যের crate আনা।"
icon: "🗂️"
minutes: 10
video: "ESepORcIBB0"
---

## কেন শিখবো?

একটা `main.rs`-এ হাজার লাইন ঢোকালে কিছু খুঁজে পাওয়া যায় না, আর সব function সবাই ছুঁতে পারে বলে যেকেউ যা-তা বদলে ফেলে।
**module** কোডকে নামওয়ালা ঘরে ভাগ করে, আর **`pub`** ঠিক করে কোন দরজা বাইরের জন্য খোলা। Rust-এ সবকিছু ডিফল্টে **private**, তাই খোলা জিনিস মানে ইচ্ছা করে খোলা জিনিস।
আর অন্যের লেখা কোড (crate) আনতে লাগে শুধু `Cargo.toml`-এ এক লাইন। এই পাঠে তিনটাই।

## mod আর pub

`mod নাম { ... }` একটা module বানায়। ভেতরের জিনিসে যেতে `নাম::জিনিস` পথ (path) লিখতে হয়, আর জিনিসটা `pub` না হলে বাইরে থেকে যাওয়া যায় না।
এখানে সব এক ফাইলে দেখাচ্ছি, কারণ module আসলে কোডের ভাগ, ফাইলের ভাগ পরের কথা।

```rust
mod greetings {
    pub fn hello(name: &str) -> String {
        format!("{}, {name}!", prefix())
    }

    fn prefix() -> &'static str {
        "Hello" // private helper
    }
}

fn main() {
    println!("{}", greetings::hello("Rust"));
}
```

```text
Hello, Rust!
```

`prefix` private, তবু `hello` সেটা ডাকতে পারে, কারণ দুজনই একই module-এর ভেতরে। private মানে "এই module-এর বাইরে বন্ধ"।

## use: ছোট নাম

প্রতিবার লম্বা path লেখা বিরক্তিকর। `use` একটা ছোট নাম বসিয়ে দেয়। নাম মিলে গেলে `as` দিয়ে অন্য নাম দেওয়া যায়।

```rust
mod shapes {
    pub mod square {
        pub fn area(side: i32) -> i32 {
            side * side
        }
    }
    pub mod rect {
        pub fn area(w: i32, h: i32) -> i32 {
            w * h
        }
    }
}

use shapes::rect;
use shapes::square::area as square_area;

fn main() {
    println!("{}", square_area(4));
    println!("{}", rect::area(2, 5));
}
```

```text
16
10
```

## nested module, self আর super

module-এর ভেতরে module থাকতে পারে (ফাইল-ফোল্ডারের মতো গাছ)। path-এ তিনটা শব্দ কাজে লাগে:

- `self::` মানে এই module থেকে শুরু
- `super::` মানে এক ধাপ উপরের (parent) module থেকে শুরু
- `crate::` মানে সবার উপরের root থেকে শুরু

একটা নিয়ম মনে রাখো: **ভেতরের (child) module উপরের (parent) module-এর private জিনিসও দেখতে পায়**, কিন্তু উল্টোটা নয়।

```rust
mod shop {
    const TAX: f64 = 0.1; // private to shop and its children

    pub mod price {
        pub fn with_tax(p: f64) -> f64 {
            p * (1.0 + super::TAX) // child reads parent's private item
        }
    }

    pub fn show() {
        println!("{:.2}", self::price::with_tax(100.0));
    }
}

fn main() {
    shop::show();
    println!("{:.1}", crate::shop::price::with_tax(50.0));
}
```

```text
110.00
55.0
```

struct-এও `pub` আলাদাভাবে লাগে: `pub struct User { pub name: String, age: u8 }` লিখলে `name` বাইরে থেকে পড়া যায়, কিন্তু `age` নয়। তাই module-এর বাইরের কেউ ভেতরের অবস্থা এলোমেলো করতে পারে না।

## আলাদা ফাইলে module

প্রোগ্রাম বড় হলে প্রতিটা module আলাদা ফাইলে যায়। `main.rs`-এ শুধু `mod utils;` লিখলেই Rust `src/utils.rs` খুঁজে নেয়। (এই কোড একটা প্রজেক্টের ফাইল, তাই এখানে চালানো হচ্ছে না।)

```text
my_app/
├── Cargo.toml
└── src/
    ├── main.rs      <- binary crate root
    ├── lib.rs       <- (optional) library crate root
    ├── utils.rs     <- module `utils`
    └── net/
        ├── mod.rs   <- module `net` (or write src/net.rs instead)
        └── http.rs  <- module `net::http`
```

```rust ignore
// src/utils.rs
pub fn shout(s: &str) -> String {
    s.to_uppercase()
}
```

```rust ignore
// src/main.rs
mod utils; // loads src/utils.rs

fn main() {
    println!("{}", utils::shout("hi"));
}
```

`src/main.rs` হলো **binary crate**-এর root (চালানোর প্রোগ্রাম), আর `src/lib.rs` হলো **library crate**-এর root (অন্যে ব্যবহার করার কোড)। একটা প্রজেক্টে দুটোই থাকতে পারে। `main.rs` তখন নিজের library-কে `use my_app::...` দিয়ে ডাকে।
এভাবে ভাগ করলে পরে টেস্ট লেখা সহজ হয়।

## Cargo.toml আর বাইরের crate

অন্যের লেখা কোড হলো **crate**, আর সবার crate থাকে [crates.io](https://crates.io)-তে। কাজে লাগাতে `Cargo.toml`-এর `[dependencies]`-এ নাম আর version লেখো। এক কমান্ডে সেটাও হয়ে যায়:

```bash
cargo add serde --features derive
```

```toml
[package]
name = "my_app"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = { version = "1", features = ["derive"] }
```

পরের `cargo build` বা `cargo run`-এ Cargo crate নামিয়ে compile করে আর ঠিক কোন version নেওয়া হলো তা `Cargo.lock`-এ লিখে রাখে, যাতে সবার মেশিনে একই কোড চলে। কোডে ব্যবহার করতে হয় `use` দিয়ে:

```rust ignore
use serde::Serialize; // from the serde crate

#[derive(Serialize)]
struct Point {
    x: i32,
    y: i32,
}
```

> এই কোর্সের runnable কোডে crate চলে না, শুধু std। তাই serde-র উদাহরণ চালানো যাচ্ছে না, নিজের প্রজেক্টে `cargo add` করে চালিয়ে দেখো।

## সাধারণ ভুল

`pub` ছাড়া function ডাকা:

```rust compile_fail
mod bank {
    fn secret_code() -> i32 {
        1234
    }
}

fn main() {
    println!("{}", bank::secret_code()); // error[E0603]: function `secret_code` is private
}
```

compiler বলে `private function`। ইচ্ছা করে খুলতে চাইলে `pub fn secret_code()` লেখো। আর যদি না খোলার কথা হয়, তাহলে `bank`-এর ভেতরেই একটা `pub` function বানিয়ে সেটা দিয়ে কাজ করাও।

## নিজে করো

`geometry` নামে একটা module বানাও। এতে একটা `pub fn area(w: f64, h: f64) -> f64` থাকবে (আয়তক্ষেত্রের ক্ষেত্রফল), আর ভেতরে `pub mod circle`-এ `pub fn area(r: f64) -> f64` (`std::f64::consts::PI * r * r`)।
`main`-এ `geometry::area(3.0, 4.0)` আর `geometry::circle::area(2.0)` দুটো দুই দশমিক পর্যন্ত print করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
mod geometry {
    pub fn area(w: f64, h: f64) -> f64 {
        w * h
    }

    pub mod circle {
        pub fn area(r: f64) -> f64 {
            std::f64::consts::PI * r * r
        }
    }
}

fn main() {
    println!("{:.2}", geometry::area(3.0, 4.0));
    println!("{:.2}", geometry::circle::area(2.0));
}
```

```text
12.00
12.57
```

</details>

## মনে রাখো

- সবকিছু ডিফল্টে private। বাইরে খুলতে `pub` লাগে (struct-এর field-এও আলাদা `pub`)।
- `use` ছোট নাম দেয়, `as` নাম বদলায়। path শুরু হয় `crate::`, `self::` বা `super::` দিয়ে।
- child module parent-এর private জিনিস দেখতে পায়, parent child-এর private জিনিস পায় না।
- `mod utils;` লিখলে Rust `src/utils.rs` (বা `src/utils/mod.rs`) খুঁজে নেয়। `main.rs` binary, `lib.rs` library।
- বাইরের crate আনতে `cargo add নাম` বা `Cargo.toml`-এর `[dependencies]`। `Cargo.lock` সঠিক version মনে রাখে।
