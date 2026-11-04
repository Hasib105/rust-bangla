---
title: "Testing: কোড ঠিক আছে কিনা Rust নিজেই যাচাই করে"
short: "Testing"
part: 8
order: 31
summary: "`#[test]` function লিখে `cargo test` চালালে Rust তোমার কোড নিজে যাচাই করে দেয়। কোনো আলাদা framework লাগে না।"
icon: "🧪"
minutes: 5
---

## কেন শিখবো?

কোড বদলালে ভয় লাগে, "অন্য কোথাও কিছু ভাঙলো না তো?" Rust-এ testing **ভাষার ভেতরেই** আছে, আলাদা library লাগে না। `cargo test` লিখলেই সব test চলে।

## প্রথম test

function-এর আগে `#[test]` দিলে সেটা test। test থাকে `#[cfg(test)]` দেওয়া `mod tests`-এ, যা শুধু `cargo test`-এর সময় compile হয়। `use super::*;` দিয়ে ওপরের কোড আনা হয়। panic না করলে **pass**, `assert` ফেল করলে panic মানে **fail**।

```rust ignore
// src/lib.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 3), 5);
    }
}
```

```bash
cargo test
```

## assert macro

- `assert!(শর্ত)`: `true` না হলে panic।
- `assert_eq!(a, b)`: `a == b` না হলে panic, দুটো মানই দেখায়।
- `assert_ne!(a, b)`: `a != b` না হলে panic।

আসল test-এ এগুলো `#[test]` function-এর ভেতরে যায়। এখানে `main`-এ চালিয়ে দেখছি।

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

## `should_panic` আর `Result`

ভুল input-এ function panic করলে সেটা test করতে `#[should_panic]`। panic **না** হলে test fail। test থেকে `Result` return করলে ভেতরে `?` চলে, `Err` এলে fail।

```rust ignore
#[test]
#[should_panic(expected = "divide by zero")]
fn zero_divisor_panics() {
    divide(1, 0);
}

#[test]
fn parse_works() -> Result<(), std::num::ParseIntError> {
    let n: i32 = "42".parse()?;
    assert_eq!(n, 42);
    Ok(())
}
```

## `tests/` folder আর doc test

project root-এর `tests/` folder-এর প্রতিটা file আলাদা crate, যেখানে শুধু `pub` অংশ ব্যবহার করা যায় (**integration test**)। `///` comment-এর ভেতরের ` ``` ` example-ও `cargo test` চালায় (**doc test**)।

```rust ignore
// tests/basic.rs
#[test]
fn add_from_outside() {
    assert_eq!(mylib::add(1, 1), 2);
}
```

## সাধারণ ভুল

নিজের struct `assert_eq!` দিয়ে মেলাতে `PartialEq` (তুলনা) আর `Debug` (ফেল করলে print) লাগে:

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

ঠিক করতে struct-এর ওপরে `#[derive(Debug, PartialEq)]` লেখো।

## নিজে করো

`clamp_percent(n: i32) -> i32` লেখো: `n` 0-এর কম হলে 0, 100-এর বেশি হলে 100, নইলে `n`। `main`-এ `assert_eq!` দিয়ে তিনটা কেস যাচাই করে `ok` print করো।

<details>
<summary>সমাধান দেখো</summary>

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

- `#[test]` দিলে function test, `cargo test` সব চালায়। panic করলে fail।
- test থাকে `#[cfg(test)] mod tests`-এ, সঙ্গে `use super::*;`।
- `assert!`, `assert_eq!`, `assert_ne!`। নিজের type-এ `#[derive(Debug, PartialEq)]` লাগে।
- `#[should_panic]` panic আশা করে। `tests/` folder আর doc comment-এর example-ও চলে।
