---
title: "Module, Cargo আর crate"
short: "Module"
part: 4
order: 18
summary: "mod দিয়ে কোড ভাগ করা, pub দিয়ে দরজা খোলা, use দিয়ে ছোট নাম। সাথে ফাইল সাজানো আর Cargo.toml দিয়ে অন্যের crate আনা।"
minutes: 5
---

## কেন শিখবো?

একটা `main.rs`-এ হাজার লাইন ঢোকালে কিছু খুঁজে পাওয়া যায় না। **module** কোডকে ঘরে ভাগ করে, আর **`pub`** ঠিক করে কোন দরজা বাইরের জন্য খোলা। Rust-এ সবকিছু ডিফল্টে **private**।

## mod আর pub

`mod নাম { ... }` একটা module বানায়। ভেতরের জিনিসে যেতে `নাম::জিনিস` path লিখতে হয়, আর জিনিসটা `pub` না হলে বাইরে থেকে যাওয়া যায় না। private মানে "এই module-এর বাইরে বন্ধ"।

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

## use, self আর super

`use` লম্বা path-এর ছোট নাম দেয়, `as` নাম বদলায়। path শুরু হয় `crate::` (root), `self::` (এই module) বা `super::` (parent) দিয়ে। **child module parent-এর private জিনিসও দেখতে পায়**, উল্টোটা নয়।

```rust
mod shop {
    const TAX: f64 = 0.1; // private to shop and its children

    pub mod price {
        pub fn with_tax(p: f64) -> f64 {
            p * (1.0 + super::TAX) // child reads parent's private item
        }
    }
}

use shop::price::with_tax as taxed;

fn main() {
    println!("{:.2}", taxed(100.0));
}
```

```text
110.00
```

struct-এও `pub` আলাদা লাগে: `pub struct User { pub name: String, age: u8 }` লিখলে `name` বাইরে থেকে পড়া যায়, `age` নয়।

## আলাদা ফাইল আর Cargo.toml

`main.rs`-এ `mod utils;` লিখলে Rust `src/utils.rs` খুঁজে নেয়। `src/main.rs` হলো **binary crate**-এর root, আর `src/lib.rs` হলো **library crate**-এর root। অন্যের crate আনতে `cargo add` করো, তাহলে `Cargo.toml`-এর `[dependencies]`-এ লাইন বসে, আর `Cargo.lock` ঠিক কোন version নেওয়া হলো তা মনে রাখে।

```bash
cargo add serde --features derive
```

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
```

কোডে ব্যবহার করতে হয় `use serde::Serialize;` লিখে।

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

ঠিক করো `pub fn secret_code()` লিখে।

## নিজে করো

`geometry` module বানাও: এতে `pub fn area(w: f64, h: f64) -> f64` আর ভেতরে `pub mod circle`-এ `pub fn area(r: f64) -> f64` (`std::f64::consts::PI * r * r`)। `main`-এ `geometry::area(3.0, 4.0)` আর `geometry::circle::area(2.0)` দুই দশমিক পর্যন্ত print করো।

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

- সবকিছু ডিফল্টে private। খুলতে `pub` লাগে (struct-এর field-এও আলাদা `pub`)।
- `use` ছোট নাম দেয়, `as` নাম বদলায়। child parent-এর private জিনিস দেখে, উল্টোটা নয়।
- `mod utils;` মানে `src/utils.rs`। `main.rs` binary, `lib.rs` library।
- বাইরের crate আনতে `cargo add`। `Cargo.lock` সঠিক version মনে রাখে।
