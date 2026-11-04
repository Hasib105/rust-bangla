---
title: "Ownership: Rust-এর হৃদয়"
short: "Ownership"
part: 2
order: 7
summary: "প্রতিটা value-এর মালিক একজনই। মালিক scope থেকে বের হলে value নিজে থেকেই মুছে যায়।"
icon: "🧠"
minutes: 9
video: "V59N9xxKfoU"
---

## কেন শিখবো?

C-তে memory নিজে `free` করতে হয়। ভুলে গেলে memory leak হয়, আর দুবার করলে crash।
Python বা Java-তে একটা garbage collector (GC) পেছনে বসে memory পরিষ্কার করে, কিন্তু তাতে সময় আর RAM খরচ হয়।

Rust তৃতীয় একটা পথ নিয়েছে, যার নাম **ownership**। compiler নিজেই হিসাব রাখে কোন value কখন মুছতে হবে। ফলে GC লাগে না, আবার নিজে `free`-ও করতে হয় না।
এই একটা ধারণা বুঝলে Rust-এর বাকি ৮০% সহজ হয়ে যায়।

## তিনটা নিয়ম

1. প্রতিটা value-এর একজন **মালিক** (owner) থাকে। মালিক হলো একটা variable।
2. একই সময়ে মালিক থাকে **একজনই**।
3. মালিক scope (`{ }`) থেকে বের হলে value **drop** হয়, মানে memory ফেরত যায়।

```rust
fn main() {
    {
        let s = String::from("hello"); // s is the owner
        println!("inside: {s}");
    } // s goes out of scope here -> the String is dropped
    println!("outside: s is gone");
}
```

```text
inside: hello
outside: s is gone
```

## Move: মালিকানা হাত বদল

`String`-এর লেখাগুলো থাকে heap-এ। `let b = a;` লিখলে Rust heap-এর ডেটা কপি করে না, শুধু **মালিকানা** `a` থেকে `b`-তে চলে যায়।
এটাকে বলে **move**। এরপর `a` আর ব্যবহার করা যায় না, যাতে একই memory দুবার free হওয়ার সুযোগ না থাকে।

```rust
fn main() {
    let a = String::from("rust");
    let b = a; // ownership moves from a to b
    println!("b = {b}");
}
```

```text
b = rust
```

সত্যিকারের দ্বিতীয় কপি চাইলে `.clone()` ডাকো। তখন heap-এ নতুন করে জায়গা নেওয়া হয়, তাই এটা একটু দামি।

```rust
fn main() {
    let a = String::from("rust");
    let b = a.clone(); // deep copy: two owners, two Strings
    println!("a = {a}, b = {b}");
}
```

```text
a = rust, b = rust
```

## Copy type: ছোট জিনিস কপি হয়

`i32`, `f64`, `bool`, `char` আর এদের দিয়ে বানানো tuple পুরোটাই stack-এ থাকে, আর কপি করতে খুবই সস্তা।
এগুলো `Copy` trait মেনে চলে, তাই `let y = x;` লিখলে move হয় না, **কপি** হয়। দুটোই ব্যবহার করা যায়।

```rust
fn main() {
    let x = 5;
    let y = x; // i32 is Copy: x is still valid
    println!("x = {x}, y = {y}");
}
```

```text
x = 5, y = 5
```

## Function-এ পাঠালেও move হয়

function-এ `String` পাঠালে মালিকানা function-এর ভেতরে চলে যায়। আবার function কোনো value **return** করলে মালিকানা ফিরে আসে।

```rust
fn takes(s: String) {
    println!("got {s}");
} // s is dropped here

fn gives() -> String {
    String::from("fresh")
}

fn main() {
    let name = String::from("Ferris");
    takes(name); // name moved into takes
    let t = gives(); // ownership comes out to t
    println!("t = {t}");
}
```

```text
got Ferris
t = fresh
```

প্রতিবার মালিকানা পাঠিয়ে আবার ফেরত আনা ঝামেলার কাজ। এর সমাধান হলো **borrowing**, যা পরের পাঠে আছে।

## সাধারণ ভুল

move-এর পরে পুরোনো নাম ব্যবহার করা:

```rust compile_fail
fn main() {
    let a = String::from("rust");
    let b = a;
    println!("{a} {b}"); // error[E0382]: borrow of moved value: `a`
}
```

compiler পরিষ্কার বলে দেয় `value borrowed here after move`। ঠিক করার তিনটা উপায় আছে:
`b`-ই ব্যবহার করো, অথবা `a.clone()` করো, অথবা (পরের পাঠে) `&a` দিয়ে ধার দাও।

## নিজে করো

`make_greeting` নামে একটা function লেখো। এটা একটা `String` নাম নেবে আর `"Hello, <name>!"` return করবে।
তারপর `main`-এ return হওয়া String আর নামের দৈর্ঘ্য দুটোই print করো। মনে রেখো, নামটা function-এ move হয়ে যাবে!

<details>
<summary>সমাধান দেখো</summary>

দৈর্ঘ্যটা move হওয়ার **আগেই** বের করে রাখতে হবে। `usize` হলো `Copy`, তাই `len` পরেও ব্যবহার করা যায়।

```rust
fn make_greeting(name: String) -> String {
    format!("Hello, {name}!")
}

fn main() {
    let name = String::from("Karim");
    let len = name.len(); // read before the move
    let greeting = make_greeting(name); // name moved here
    println!("{greeting} ({len} letters)");
}
```

```text
Hello, Karim! (5 letters)
```

</details>

## মনে রাখো

- একটা value, একজন মালিক। মালিক scope থেকে বের হলে value drop হয়।
- `String`, `Vec` ইত্যাদি heap-এর জিনিস `=` বা function call-এ **move** হয়।
- `i32`, `bool`, `char`-এর মতো ছোট type **Copy** হয়, তাই এদের move হয় না।
- দ্বিতীয় কপি দরকার হলে `.clone()`, কিন্তু বেশিরভাগ সময় borrow (`&`) করাই ভালো।
