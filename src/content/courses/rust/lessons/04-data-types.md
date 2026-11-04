---
title: "Data type: সংখ্যা, char, tuple, array"
short: "Data types"
part: 1
order: 4
summary: "integer, float, bool, char, tuple আর array। overflow কীভাবে সামলাতে হয় আর as দিয়ে type বদলানো যায়।"
minutes: 6
---

## কেন শিখবো?

Python-এ `int` যত বড় হোক চলে, কিন্তু Rust-এ প্রতিটা সংখ্যার **নির্দিষ্ট আকার** আছে। তাই কোন type কতটা ধরে আর সীমা ছাড়ালে কী হয়, জানা দরকার।

## Integer

`i` মানে ঋণাত্মকও চলবে (signed), `u` মানে শুধু ০ বা বেশি (unsigned)। সংখ্যা মানে বিট: `u8` ০ থেকে ২৫৫, `i32` ডিফল্ট, `usize` index আর `len()`-এর জন্য। float-এর ডিফল্ট `f64`।

```rust
fn main() {
    let a: u8 = 255;
    let b: i32 = -42;
    let c: i64 = 10_000_000_000;
    println!("{a} {b} {c}");
    println!("u8 max = {}, i32 min = {}", u8::MAX, i32::MIN);
}
```

```text
255 -42 10000000000
u8 max = 255, i32 min = -2147483648
```

## Overflow

`u8`-এর সীমা ২৫৫। ছাড়ালে debug build-এ program **panic** করে, release-এ ঘুরে শুরুতে চলে যায়। নিজে বেছে নিতে: `checked_add` (overflow হলে `None`), `wrapping_add` (ঘুরে যায়), `saturating_add` (সীমায় আটকায়)।

```rust
fn main() {
    let x: u8 = 250;
    println!("{:?}", x.checked_add(10));
    println!("{:?}", x.checked_add(5));
    println!("{}", x.wrapping_add(10));
    println!("{}", x.saturating_add(10));
}
```

```text
None
Some(255)
4
255
```

## bool, char আর float

`bool` হলো `true` বা `false`। `char` একটা **একক অক্ষর**, single quote-এ লেখা, আর এটা **৪ byte** কারণ পুরো Unicode ধরে। দুটো integer ভাগ করলে ফলও integer, আর `%` দেয় ভাগশেষ।

```rust
fn main() {
    let ok: bool = 5 > 3;
    let crab = '🦀';
    println!("{ok} {crab}");
    println!("{}", std::mem::size_of::<char>());
    println!("{} {} {}", 7 / 2, 7 % 2, 7.0 / 2.0);
}
```

```text
true 🦀
4
3 1 3.5
```

## Tuple আর array

**tuple** ভিন্ন type রাখে (`.0`, `.1` দিয়ে পাওয়া যায়)। **array**-তে সব element এক type, index ০ থেকে। দুটোরই আকার স্থির।

```rust
fn main() {
    let person = ("Anika", 22);
    let (name, age) = person;
    println!("{name} {age} {}", person.0);

    let days = [10, 20, 30];
    let zeros = [0; 4];
    println!("{} {} {:?}", days[1], days.len(), zeros);
}
```

```text
Anika 22 Anika
20 3 [0, 0, 0, 0]
```

## as: type বদলানো

Rust নিজে type বদলায় না, `as` লিখতে হয়। ছোট type-এ নামালে মান কেটে যায়, float থেকে integer-এ দশমিক পড়ে যায়।

```rust
fn main() {
    let f = 3.99;
    let big: i32 = 300;
    println!("{}", f as i32);
    println!("{}", big as u8);
    println!("{}", 'a' as u32);
}
```

```text
3
44
97
```

## সাধারণ ভুল

দুটো ভিন্ন integer type যোগ করা:

```rust compile_fail
fn main() {
    let a: i32 = 5;
    let b: i64 = 10;
    println!("{}", a + b); // error[E0308]: mismatched types
}
```

একটাকে `as` দিয়ে মেলাও: `a as i64 + b`।

## নিজে করো

`celsius: f64 = 36.6` থেকে Fahrenheit (`c * 9 / 5 + 32`) বের করে এক দশমিক ঘরে print করো।

<details>
<summary>সমাধান দেখো</summary>

float-এর হিসাবে সংখ্যাগুলোও float হতে হয়: `9.0`, `5.0`, `32.0`।

```rust
fn main() {
    let celsius: f64 = 36.6;
    let fahrenheit = celsius * 9.0 / 5.0 + 32.0;
    println!("{fahrenheit:.1}");
}
```

```text
97.9
```

</details>

## মনে রাখো

- integer-এর আকার নির্দিষ্ট: `i32` (ডিফল্ট), `u8`, `i64`, `usize`। float-এর ডিফল্ট `f64`।
- overflow সামলাতে `checked_`, `wrapping_`, `saturating_`।
- `char` ৪ byte, tuple-এ ভিন্ন type, array-তে এক type।
- `as` দিয়ে type বদলায়, কিন্তু মান কেটে যেতে পারে।
