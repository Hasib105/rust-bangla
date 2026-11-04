---
title: "Borrowing: ধার নাও, মালিক হয়ো না"
short: "Borrowing"
part: 2
order: 8
summary: "`&` দিয়ে value ধার নেওয়া যায়, মালিকানা না নিয়েই। একসাথে অনেক পাঠক, অথবা একজন লেখক।"
minutes: 5
---

## কেন শিখবো?

function-এ `String` পাঠালে মালিকানা চলে যায়। C-তে সমাধান pointer, কিন্তু ভুল pointer crash করে। Rust-এর সমাধান **reference**: মালিকানা না নিয়ে ধার নেওয়া, আর compiler দেখে ধারটা নিরাপদ কি না।

## & আর &mut

`&s` পড়ার জন্য ধার, মালিক আগের জনই থাকে। বদলাতে চাইলে `&mut`: variable-ও `mut` হতে হয়, call-এও `&mut` লিখতে হয়।

```rust
fn length(s: &String) -> usize {
    s.len()
}

fn add_world(s: &mut String) {
    s.push_str(", world");
}

fn main() {
    let mut s = String::from("hello");
    let n = length(&s); // lend, do not give away
    add_world(&mut s);
    println!("{s} ({n})");
}
```

```text
hello, world (5)
```

## নিয়ম: অনেক পাঠক অথবা একজন লেখক

একই সময়ে হয় **যত খুশি `&`**, অথবা **ঠিক একটা `&mut`**, দুটো একসাথে নয়। নইলে একজন পড়ার সময় আরেকজন বদলালে **data race** হতো। Rust এটা compile-এর সময়ই আটকায়।

```rust
fn main() {
    let s = String::from("rust");
    let a = &s;
    let b = &s;
    println!("{a} {b} {s}");
}
```

```text
rust rust rust
```

## Reference কখন শেষ হয় (NLL)

reference শেষ হয় তার **শেষ ব্যবহারে**, scope-এর শেষে নয় (NLL)। তাই পাঠকের কাজ শেষ হলে পরে `&mut` নেওয়া যায়।

```rust
fn main() {
    let mut s = String::from("hi");
    let r1 = &s;
    println!("{r1}"); // last use: borrow ends
    let r2 = &mut s; // fine now
    r2.push('!');
    println!("{r2}");
}
```

```text
hi
hi!
```

## Dangling reference হয় না

C-তে free হয়ে যাওয়া memory-র pointer (dangling) বানানো যায়। Rust-এ reference সবসময় বৈধ value-র দিকে থাকে, compiler এটা আটকায়।

```rust compile_fail
fn dangle() -> &String {
    let s = String::from("temp");
    &s // s is dropped at the end of the function
}

fn main() {
    let r = dangle();
    println!("{r}");
}
```

`s` function-এর শেষে drop হয়, তাই compiler আপত্তি করে (E0106)। ঠিক করতে `String` নিজেই return করো।

## সাধারণ ভুল

পাঠক বেঁচে থাকতে লেখক নেওয়া:

```rust compile_fail
fn main() {
    let mut s = String::from("hi");
    let r = &s;
    s.push('!'); // error[E0502]: cannot borrow `s` as mutable
    println!("{r}");
}
```

`r` পরে ব্যবহার হচ্ছে, তাই borrow চলছে। `println!("{r}")` আগে করো। আর `&` দিয়ে বদলাতে গেলে E0596 আসে, `&mut` লাগে।

## নিজে করো

`shout(s: &mut String)` শেষে `"!"` জুড়বে, `count_chars(s: &String) -> usize` দৈর্ঘ্য দেবে। `"hey"` দিয়ে শুরু করে দুটো ডাকো আর print করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
fn shout(s: &mut String) {
    s.push('!');
}

fn count_chars(s: &String) -> usize {
    s.len()
}

fn main() {
    let mut s = String::from("hey");
    shout(&mut s);
    let n = count_chars(&s);
    println!("{s} ({n})");
}
```

```text
hey! (4)
```

</details>

## মনে রাখো

- `&x` পড়ার ধার, `&mut x` বদলানোর ধার। মালিকানা বদলায় না।
- অনেক `&` অথবা একটা `&mut`, একসাথে নয়। এতে data race আটকায়।
- reference শেষ হয় শেষ ব্যবহারে (NLL)।
- reference কখনো মরা value-র দিকে থাকে না।
