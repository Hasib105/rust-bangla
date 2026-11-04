---
title: "Borrowing: ধার নাও, মালিক হয়ো না"
short: "Borrowing"
part: 2
order: 8
summary: "`&` দিয়ে value ধার নেওয়া যায়, মালিকানা না নিয়েই। একসাথে অনেক পাঠক, অথবা একজন লেখক।"
icon: "🤝"
minutes: 9
video: "sgXW4gzn72Y"
---

## কেন শিখবো?

গত পাঠে দেখলাম, function-এ `String` পাঠালে মালিকানা চলে যায়। শুধু দৈর্ঘ্য জানার জন্য প্রতিবার String পাঠিয়ে আবার ফেরত আনা বিরক্তিকর।
C-তে এর সমাধান pointer, কিন্তু pointer ভুল জায়গায় তাকিয়ে থাকলে crash হয়। Rust-এর সমাধান হলো **reference**: মালিকানা না নিয়ে শুধু ধার নেওয়া, আর compiler দেখে নেয় ধারটা নিরাপদ কি না।

## `&T`: পড়ার জন্য ধার

variable-এর সামনে `&` বসালে একটা reference তৈরি হয়। এটা ধার নেওয়া, মালিক এখনও আগের জনই।
function-এ `&String` পাঠালে সে পড়তে পারে, কিন্তু মালিকানা পায় না। তাই call-এর পরেও `s` ব্যবহার করা যায়।

```rust
fn length(s: &String) -> usize {
    s.len()
}

fn main() {
    let s = String::from("hello");
    let n = length(&s); // lend s, do not give it away
    println!("{s} has {n} letters");
}
```

```text
hello has 5 letters
```

## `&mut T`: বদলানোর জন্য ধার

সাধারণ `&` দিয়ে শুধু পড়া যায়। বদলাতে চাইলে দরকার `&mut`। তবে variable-টাও `mut` হতে হবে, আর call-এর সময়ও `&mut` লিখতে হবে।

```rust
fn add_world(s: &mut String) {
    s.push_str(", world");
}

fn main() {
    let mut s = String::from("hello");
    add_world(&mut s);
    println!("{s}");
}
```

```text
hello, world
```

## নিয়ম: অনেক পাঠক অথবা একজন লেখক

Rust-এর borrow-এর মূল নিয়ম একটাই। একই সময়ে হয় **যত খুশি `&`** (পাঠক), অথবা **ঠিক একটা `&mut`** (লেখক)। দুটো একসাথে নয়।

কেন? ভাবো, একজন একটা তালিকা পড়ছে আর আরেকজন সেটা বদলে দিচ্ছে। পাঠক হঠাৎ অর্ধেক-বদলানো ডেটা দেখবে। এটাই **data race**-এর গোড়া। Rust এটা compile-এর সময়েই আটকে দেয়, তাই runtime-এ এই বিপদ আসে না।

অনেক পাঠক একসাথে থাকতে পারে, কারণ কেউ কিছু বদলাচ্ছে না:

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

একটা reference শেষ হয় তার **শেষ ব্যবহারে**, scope-এর শেষে নয়। এই বুদ্ধিটার নাম NLL (non-lexical lifetimes)। তাই আগের পাঠক কাজ শেষ করে ফেললে পরে `&mut` নেওয়া যায়।

```rust
fn main() {
    let mut s = String::from("hi");
    let r1 = &s;
    println!("{r1}"); // last use of r1: the borrow ends here
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

C-তে এমন pointer বানানো যায় যে এমন memory দেখাচ্ছে যা আগেই free হয়ে গেছে। একে বলে dangling pointer। Rust-এ reference সবসময় বৈধ value-র দিকেই থাকে।

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

`s` function-এর শেষে drop হয়ে যায়, তার reference ফেরত দিলে সেটা মরা memory দেখাতো। তাই compiler আপত্তি করে (E0106)। ঠিক করতে `String` নিজেই return করো, তাহলে মালিকানা caller-এর কাছে যাবে। এর পুরো গল্প lifetimes-এর পাঠে আসবে।

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

`r` পরে আবার ব্যবহার হচ্ছে, তাই তার borrow তখনও চলছে। compiler বলে `immutable borrow later used here`।
ঠিক করার উপায়: `println!("{r}")` আগে করে ফেলো, তাহলে NLL borrow শেষ করে দেবে। আর `&` reference দিয়ে বদলাতে চাইলে (`s.push` ইত্যাদি) `&mut` লাগবে, নইলে E0596 আসে।

## নিজে করো

দুটো function লেখো। `shout(s: &mut String)` শেষে `"!"` জুড়বে। `count_chars(s: &String) -> usize` দৈর্ঘ্য দেবে।
`main`-এ `"hey"` দিয়ে শুরু করো, `shout` ডাকো, তারপর String আর দৈর্ঘ্য print করো।

<details>
<summary>সমাধান দেখো</summary>

`shout`-এ `&mut` নিতে হয়, আর `count_chars`-এ `&`। দুটোই ধার, তাই `main`-এ `s` সবসময় আমাদের হাতেই থাকে।

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

- `&x` ধার নেয় (পড়া), `&mut x` ধার নেয় (বদলানো)। মালিকানা বদলায় না।
- একই সময়ে অনেক `&` অথবা একটা `&mut`, দুটো একসাথে নয়। এতেই data race আটকায়।
- reference শেষ হয় শেষ ব্যবহারে (NLL), scope-এর শেষে নয়।
- reference কখনো মরা value-র দিকে থাকতে পারে না। compiler এটা compile-এর সময়েই আটকায়।
