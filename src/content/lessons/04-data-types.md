---
title: "Data type: সংখ্যা, char, tuple, array"
short: "Data types"
part: 1
order: 4
summary: "integer, float, bool, char, tuple আর array। overflow কীভাবে সামলাতে হয় আর as দিয়ে type বদলানো যায়।"
icon: "🔢"
minutes: 9
video: "81uFIdHmMIY"
---

## কেন শিখবো?

Python-এ `int` যত বড় হোক চলে, কিন্তু Rust-এ প্রতিটা সংখ্যার **নির্দিষ্ট আকার** আছে। তাই memory কম লাগে আর গতি বাড়ে।
বিনিময়ে তোমাকে জানতে হয় কোন type কতটা ধরে, আর সীমা ছাড়ালে কী হয়। C-তে সীমা ছাড়ালে নিঃশব্দে ভুল ফল আসে, Rust এখানে তোমাকে ঠিকভাবে সামলানোর উপায় দেয়।

## Integer

নামের মধ্যেই আকার লেখা থাকে: `i` মানে ঋণাত্মক সংখ্যাও চলবে (signed), `u` মানে শুধু ০ বা তার বেশি (unsigned)।

| type | বিট | সীমা |
|---|---|---|
| `u8` | ৮ | 0 থেকে 255 |
| `i32` | ৩২ | প্রায় ±২১০ কোটি (ডিফল্ট) |
| `i64` | ৬৪ | অনেক অনেক বড় |
| `usize` | মেশিন অনুযায়ী | array-র index ও দৈর্ঘ্য |

```rust
fn main() {
    let a: u8 = 255;
    let b: i32 = -42;
    let c: i64 = 10_000_000_000;
    let d: usize = 3;
    println!("{a} {b} {c} {d}");
    println!("u8 max = {}, i32 min = {}", u8::MAX, i32::MIN);
}
```

```text
255 -42 10000000000 3
u8 max = 255, i32 min = -2147483648
```

কিছু না লিখলে integer-এর ডিফল্ট type `i32`। `usize` সবচেয়ে বেশি দেখবে `len()` আর index-এর সময়।

## Overflow: সীমা ছাড়ালে

`u8`-এর সীমা 255। এর বেশি হলে overflow। debug build-এ program **panic** করে (থেমে যায়), আর release build-এ চুপচাপ ঘুরে শুরুতে চলে যায়।
দুটোর কোনোটাই না চাইলে নিজেই স্পষ্ট করে বলে দাও:

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

- `checked_add`: overflow হলে `None`, না হলে `Some(ফল)`।
- `wrapping_add`: ঘুরে শুরুতে চলে যায় (260 হয়ে যায় 4)।
- `saturating_add`: সর্বোচ্চ সীমায় আটকে যায়।

`Some`/`None` নিয়ে পরে আলাদা পাঠ আছে। এখন শুধু মনে রাখো `None` মানে "হলো না"।

## Float, bool আর char

দশমিকের জন্য `f64` (ডিফল্ট) আর `f32`। `bool` হলো `true` বা `false`। আর `char` একটা **একক অক্ষর**, যা single quote-এ লিখতে হয়।

```rust
fn main() {
    let x = 2.5;
    let y: f32 = 1.5;
    println!("{}", x * 2.0);
    println!("{}", 0.1 + 0.2);
    println!("{}", y / 2.0);
    println!("{}", 7 / 2);
    println!("{}", 7.0 / 2.0);
}
```

```text
5
0.30000000000000004
0.75
3
3.5
```

`0.1 + 0.2` ঠিক `0.3` হয় না, এটা প্রায় সব language-এর float-এর স্বভাব। আর `7 / 2` দুটো integer, তাই ফলও integer `3`, দশমিক কেটে যায়।

```rust
fn main() {
    let ok: bool = 5 > 3;
    let letter = 'R';
    let crab = '🦀';
    println!("{ok} {letter} {crab}");
    println!("{} {}", letter.len_utf8(), crab.len_utf8());
    println!("{}", std::mem::size_of::<char>());
}
```

```text
true R 🦀
1 4
4
```

Rust-এর `char` **৪ byte**, কারণ এটা পুরো Unicode ধরে। তাই ইংরেজি অক্ষর, বাংলা অক্ষর বা emoji, সবই একটা `char` হতে পারে।

## Tuple আর array

**tuple** বিভিন্ন type এক জায়গায় রাখে, আর আকার স্থির। **array**-তে সব element একই type, আকারও স্থির।

```rust
fn main() {
    let person = ("Anika", 22, 5.4);
    let (name, age, height) = person;
    println!("{name} {age} {height}");
    println!("{}", person.0);

    let days = [10, 20, 30];
    let zeros = [0; 4];
    println!("{} {} {:?}", days[1], days.len(), zeros);
}
```

```text
Anika 22 5.4
Anika
20 3 [0, 0, 0, 0]
```

tuple-এর element পেতে `.0`, `.1`, আর array-র জন্য `[index]` (০ থেকে শুরু)। `[0; 4]` মানে `0` চারবার। `let (name, age, height) = person;` লিখে ভেঙে নেওয়াকে বলে destructuring।
array-র index সীমার বাইরে গেলে program panic করে, অন্য memory পড়ে না।

## as: type বদলানো

Rust নিজে থেকে এক type-কে আরেক type বানায় না। বদলাতে চাইলে `as` লেখো।

```rust
fn main() {
    let f = 3.99;
    let big: i32 = 300;
    let neg: i32 = -1;
    println!("{}", f as i32);
    println!("{}", big as u8);
    println!("{}", neg as u32);
    println!("{}", 65u8 as char);
    println!("{}", 'a' as u32);
}
```

```text
3
44
4294967295
A
97
```

ছোট type-এ নামালে বাড়তি অংশ কেটে যায় (300 হয় 44), আর float থেকে integer-এ দশমিক ফেলে দেয়। তাই `as` ব্যবহারের সময় একটু সাবধান।

## সাধারণ ভুল

দুটো ভিন্ন integer type একসাথে যোগ করা:

```rust compile_fail
fn main() {
    let a: i32 = 5;
    let b: i64 = 10;
    println!("{}", a + b); // error[E0308]: mismatched types
}
```

compiler বলে `expected i32, found i64`। ঠিক করতে একটাকে `as` দিয়ে মেলাও: `a as i64 + b`।

## নিজে করো

`celsius: f64 = 36.6` নিয়ে Fahrenheit বের করো (সূত্র: `c * 9 / 5 + 32`) আর এক দশমিক ঘরে print করো।

<details>
<summary>সমাধান দেখো</summary>

float-এর সঙ্গে হিসাবে সংখ্যাগুলোও float হতে হবে, তাই `9.0`, `5.0`, `32.0`।

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
- overflow সামলাতে `checked_`, `wrapping_`, `saturating_` method আছে।
- `char` ৪ byte, single quote-এ লেখা হয়, আর যেকোনো Unicode অক্ষর হতে পারে।
- tuple-এ ভিন্ন type, array-তে এক type, দুটোরই আকার স্থির।
- type বদলাতে `as` লাগে, কিন্তু ছোট type-এ নামালে মান কেটে যেতে পারে।
