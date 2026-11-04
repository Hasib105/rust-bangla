---
title: "Testing: কোড ঠিক আছে কিনা Rust নিজেই যাচাই করে"
short: "Testing"
part: 8
order: 31
summary: "`#[test]` function লিখে `cargo test` চালালে Rust তোমার কোড নিজে যাচাই করে দেয়। কোনো আলাদা framework লাগে না।"
icon: "🧪"
minutes: 9
---

## কেন শিখবো?

কোড বদলালে ভয় লাগে, "অন্য কোথাও কিছু ভেঙে গেল না তো?" হাতে হাতে চালিয়ে দেখা ক্লান্তিকর, আর ভুলও হয়।
Python বা JS-এ test করতে আলাদা library ঠিক করতে হয়। Rust-এ testing **ভাষার ভেতরেই** আছে, `cargo test` লিখলেই সব test চলে।
test থাকলে তুমি নির্ভয়ে কোড বদলাতে পারো।

## প্রথম test

function-এর আগে `#[test]` লিখলে সেটা একটা test হয়ে যায়। test-গুলো সাধারণত একই file-এর নিচে `#[cfg(test)]` দেওয়া একটা `mod tests`-এ রাখা হয়।
`#[cfg(test)]` মানে "এই অংশ শুধু `cargo test`-এর সময় compile করো", তাই তোমার আসল program ভারী হয় না।

```rust ignore
// src/lib.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*; // bring add into scope

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 3), 5);
    }
}
```

terminal-এ চালাও:

```bash
cargo test
```

test **pass** করে যদি function panic না করে। কোনো `assert` ফেল করলে panic হয়, আর সেই test **fail** ধরা হয়। প্রতিটা test আলাদা thread-এ চলে, তাই একটা ফেল করলে বাকিগুলো চলতেই থাকে।

## assert macro-গুলো

তিনটা macro সবচেয়ে বেশি লাগে:

- `assert!(শর্ত)`: শর্ত `true` না হলে panic।
- `assert_eq!(a, b)`: `a == b` না হলে panic, আর দুটো value-ই দেখিয়ে দেয়।
- `assert_ne!(a, b)`: `a != b` না হলে panic।

শেষে নিজের message-ও দেওয়া যায়। নিচের program-এ সব ঠিক থাকে, তাই কিছু panic করে না।
এখানে `main`-এ চালিয়ে দেখালাম, আসল test-এ এই লাইনগুলোই `#[test]` function-এর ভেতরে থাকবে।

```rust
fn is_even(n: i32) -> bool {
    n % 2 == 0
}

fn main() {
    assert!(is_even(4));
    assert!(!is_even(7), "7 should not be even");
    assert_eq!(2 + 2, 4);
    assert_ne!(is_even(1), true);
    println!("all checks passed");
}
```

```text
all checks passed
```

`assert_eq!` ফেল করলে এরকম পরিষ্কার message আসে, যেখানে `left` হলো তোমার পাওয়া মান আর `right` হলো যেটা আশা করেছিলে:

```text
assertion `left == right` failed
  left: 4
 right: 5
```

## Panic আর Result test

কিছু function-এর কাজই হলো ভুল input পেলে panic করা। সেটা test করতে `#[should_panic]` দিতে হয়। test তখনই pass করবে যখন function **সত্যিই panic** করে।
`expected = "..."` দিলে panic message-এর মধ্যে ওই লেখা আছে কিনা সেটাও মেলানো হয়।

আরেকটা উপায় হলো test function থেকে `Result` return করা। তখন ভেতরে `?` ব্যবহার করা যায়, আর `Err` এলে test fail হয়।

```rust ignore
pub fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("divide by zero");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "divide by zero")]
    fn zero_divisor_panics() {
        divide(1, 0);
    }

    #[test]
    fn parse_works() -> Result<(), std::num::ParseIntError> {
        let n: i32 = "42".parse()?; // Err here would fail the test
        assert_eq!(divide(n, 2), 21);
        Ok(())
    }
}
```

## Doc test আর tests/ folder

**Doc test:** documentation comment (`///`)-এর ভেতরে ` ``` ` দিয়ে example লিখলে `cargo test` সেটাও compile করে চালায়। তাতে তোমার docs কখনো পুরোনো বা ভুল থাকে না।

**`tests/` folder:** project-এর root-এ `tests/` নামে folder বানালে ওর প্রতিটা file আলাদা test crate হয়। সেখানে তুমি তোমার library শুধু `pub` অংশ দিয়ে ব্যবহার করো, ঠিক বাইরের কেউ যেভাবে করবে। একে বলে **integration test**।

```rust ignore
// src/lib.rs
/// Adds two numbers.
///
/// ```
/// assert_eq!(mylib::add(2, 3), 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// tests/basic.rs
#[test]
fn add_from_outside() {
    assert_eq!(mylib::add(1, 1), 2);
}
```

`cargo test` একসাথে unit test, integration test আর doc test সবই চালায়। শুধু নির্দিষ্ট test চালাতে নামের একটা অংশ দাও, যেমন `cargo test adds`।

## সাধারণ ভুল

`assert_eq!` দিয়ে নিজের struct মেলাতে গেলে `PartialEq` আর `Debug` লাগে। না থাকলে compile হয় না:

```rust compile_fail
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = Point { x: 1, y: 2 };
    assert_eq!(a, b); // error[E0369]: binary operation `==` cannot be applied
}
```

`assert_eq!` ভেতরে `==` চালায় (`PartialEq`), আর ফেল করলে মান print করে (`Debug`)। ঠিক করতে struct-এর ওপরে লেখো `#[derive(Debug, PartialEq)]`।

```rust
#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = Point { x: 1, y: 2 };
    assert_eq!(a, b);
    println!("{a:?} equals {b:?}");
}
```

```text
Point { x: 1, y: 2 } equals Point { x: 1, y: 2 }
```

## নিজে করো

`clamp_percent(n: i32) -> i32` নামে একটা function লেখো, যেটা `n` 0-এর কম হলে 0, 100-এর বেশি হলে 100, নয়তো `n`-ই return করে।
`main`-এ `assert_eq!` দিয়ে তিনটা কেস যাচাই করো, তারপর `ok` print করো। (আসল project-এ এই `assert_eq!`-গুলো `#[test]`-এর ভেতরে যেত।)

<details>
<summary>সমাধান দেখো</summary>

তিনটা কেসই (নিচে, ভেতরে, ওপরে) test করা ভালো অভ্যাস।

```rust
fn clamp_percent(n: i32) -> i32 {
    if n < 0 {
        0
    } else if n > 100 {
        100
    } else {
        n
    }
}

fn main() {
    assert_eq!(clamp_percent(-5), 0);
    assert_eq!(clamp_percent(50), 50);
    assert_eq!(clamp_percent(250), 100);
    println!("ok");
}
```

```text
ok
```

</details>

## মনে রাখো

- `#[test]` দিলে function test হয়, আর `cargo test` সব test চালায়। panic করলে fail, না করলে pass।
- test সাধারণত `#[cfg(test)] mod tests`-এ থাকে, আর `use super::*;` দিয়ে ওপরের কোড আনা হয়।
- `assert!`, `assert_eq!`, `assert_ne!` ব্যবহার করো। নিজের type মেলাতে `#[derive(Debug, PartialEq)]` লাগে।
- `#[should_panic]` panic আশা করে। `Result` return করা test-এ `?` চলে।
- doc comment-এর example আর `tests/` folder-এর file-ও `cargo test`-এ চলে।
