---
title: "Ownership: Rust-এর হৃদয়"
short: "Ownership"
part: 2
order: 7
summary: "প্রতিটা value-এর মালিক একজনই। মালিক scope থেকে বের হলে value নিজে থেকেই মুছে যায়।"
icon: "🧠"
minutes: 5
video: "V59N9xxKfoU"
---

## কেন শিখবো?

C-তে নিজে `free` করতে হয়, ভুললে leak, দুবার করলে crash। Python/Java-তে GC সময় আর RAM খায়। Rust-এর তৃতীয় পথ **ownership**: compiler নিজেই হিসাব রাখে কখন value মুছবে।

## তিনটা নিয়ম

১. প্রতিটা value-এর একজন **মালিক** (variable)। ২. একই সময়ে মালিক **একজনই**। ৩. মালিক scope (`{ }`) থেকে বের হলে value **drop** হয়, memory ফেরত যায়।

```rust
fn main() {
    {
        let s = String::from("hello"); // s is the owner
        println!("inside: {s}");
    } // s goes out of scope: the String is dropped
    println!("outside: s is gone");
}
```

```text
inside: hello
outside: s is gone
```

## Move আর clone

`let b = a;` লিখলে `String`-এর **মালিকানা** `a` থেকে `b`-তে চলে যায়। একে **move** বলে, এরপর `a` ব্যবহার করা যায় না। সত্যিকারের কপি চাইলে `.clone()` (একটু দামি)।

```rust
fn main() {
    let a = String::from("rust");
    let b = a.clone(); // two owners, two Strings
    println!("a = {a}, b = {b}");
}
```

```text
a = rust, b = rust
```

## Copy type

`i32`, `f64`, `bool`, `char` stack-এ থাকে, কপি সস্তা। এগুলো `Copy`, তাই `let y = x;` লিখলে move নয়, **কপি** হয়।

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

## Function আর মালিকানা

function-এ `String` পাঠালে মালিকানা ভেতরে চলে যায়। function কিছু **return** করলে মালিকানা caller-এ ফেরে। বারবার পাঠিয়ে ফেরত আনার সমাধান **borrowing**, পরের পাঠে।

```rust
fn takes(s: String) {
    println!("got {s}");
} // s is dropped here

fn gives() -> String {
    String::from("fresh")
}

fn main() {
    let name = String::from("Ferris");
    takes(name); // name moved
    let t = gives();
    println!("t = {t}");
}
```

```text
got Ferris
t = fresh
```

## সাধারণ ভুল

move-এর পরে পুরোনো নাম ব্যবহার:

```rust compile_fail
fn main() {
    let a = String::from("rust");
    let b = a;
    println!("{a} {b}"); // error[E0382]: borrow of moved value: `a`
}
```

ঠিক করতে `b` ব্যবহার করো, বা `a.clone()` করো, বা `&a` দিয়ে ধার দাও।

## নিজে করো

`make_greeting(name: String) -> String` লেখো যা `"Hello, <name>!"` দেয়। `main`-এ greeting আর নামের দৈর্ঘ্য print করো। নাম move হয়ে যাবে, মনে রেখো!

<details>
<summary>সমাধান দেখো</summary>

দৈর্ঘ্য move-এর **আগে** বের করতে হবে। `usize` `Copy`, তাই পরেও চলে।

```rust
fn make_greeting(name: String) -> String {
    format!("Hello, {name}!")
}

fn main() {
    let name = String::from("Karim");
    let len = name.len(); // read before the move
    let greeting = make_greeting(name);
    println!("{greeting} ({len} letters)");
}
```

```text
Hello, Karim! (5 letters)
```

</details>

## মনে রাখো

- এক value, এক মালিক। মালিক scope ছাড়লে value drop।
- `String`, `Vec` `=` বা function call-এ **move** হয়।
- `i32`, `bool`, `char` **Copy**, move হয় না।
- দ্বিতীয় কপি লাগলে `.clone()`, তবে বেশিরভাগ সময় borrow (`&`) ভালো।
