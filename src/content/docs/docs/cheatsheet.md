---
title: Rust চিটশিট
description: এক পাতায় Rust-এর জরুরি syntax।
sidebar:
  order: 2
---

## Variable আর Type

```rust
let x = 5;              // immutable
let mut y = 10;         // mutable
const MAX: u32 = 100;   // constant
let t: (i32, f64) = (1, 2.0);
let a = [1, 2, 3];
let s: &str = "hi";     // string slice
let owned = String::from("hi");
```

## Function আর Control flow

```rust
fn add(a: i32, b: i32) -> i32 { a + b } // last expression is returned

let kind = if n % 2 == 0 { "even" } else { "odd" };
for i in 0..5 { }       // 0,1,2,3,4
for i in (1..=3).rev() { }
let v = loop { break 42; };
```

## Ownership আর Borrowing

| লিখলে | মানে |
|---|---|
| `let b = a;` | move (String/Vec) বা copy (i32/bool) |
| `a.clone()` | নতুন কপি |
| `&a` | পড়ার জন্য ধার (অনেকজন একসাথে নিতে পারে) |
| `&mut a` | লেখার জন্য ধার (একসাথে একজনই) |

## Struct, Enum, Match

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point { x: i32, y: i32 }

impl Point {
    fn new(x: i32, y: i32) -> Self { Self { x, y } }
    fn dist2(&self) -> i32 { self.x * self.x + self.y * self.y }
}

enum Shape { Circle(f64), Rect { w: f64, h: f64 } }

match shape {
    Shape::Circle(r) => 3.14 * r * r,
    Shape::Rect { w, h } => w * h,
}
```

## Option আর Result

```rust
let o: Option<i32> = Some(3);
let n = o.unwrap_or(0);
if let Some(v) = o { }

fn parse(s: &str) -> Result<i32, std::num::ParseIntError> {
    let n: i32 = s.trim().parse()?; // ? returns the error early
    Ok(n * 2)
}
```

## Collection

```rust
let mut v = vec![3, 1, 2];
v.push(4);
v.sort();
let first = v.get(0);           // Option<&i32>

use std::collections::HashMap;
let mut m = HashMap::new();
*m.entry("rust").or_insert(0) += 1;
```

## Iterator আর Closure

```rust
let evens: Vec<i32> = (1..=10).filter(|n| n % 2 == 0).collect();
let total: i32 = v.iter().map(|x| x * 2).sum();
for (i, x) in v.iter().enumerate() { }
```

## Trait আর Generic

```rust
trait Speak { fn speak(&self) -> String; }

fn loudest<T: PartialOrd + Copy>(a: T, b: T) -> T { if a > b { a } else { b } }
fn show(x: &impl std::fmt::Display) { println!("{x}"); }
let shapes: Vec<Box<dyn Speak>> = Vec::new();
```

## Smart pointer আর Concurrency

| টাইপ | কখন |
|---|---|
| `Box<T>` | heap-এ রাখতে, recursive type-এ |
| `Rc<T>` | এক thread-এ অনেক মালিক |
| `RefCell<T>` | runtime-এ borrow check করে ভেতরের মান বদলাতে |
| `Arc<T>` | অনেক thread-এ অনেক মালিক |
| `Mutex<T>` | অনেক thread থেকে নিরাপদে বদলাতে |

```rust
use std::sync::{Arc, Mutex};
use std::thread;

let c = Arc::new(Mutex::new(0));
let hs: Vec<_> = (0..4).map(|_| {
    let c = Arc::clone(&c);
    thread::spawn(move || *c.lock().unwrap() += 1)
}).collect();
for h in hs { h.join().unwrap(); }
```

## Cargo কমান্ড

```bash
cargo new app       # new project
cargo run           # build + run
cargo test          # run tests
cargo build --release
cargo add serde     # add a dependency
cargo fmt && cargo clippy
```
