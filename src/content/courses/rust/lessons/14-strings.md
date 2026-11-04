---
title: "String: UTF-8 আর text"
short: "String"
part: 3
order: 14
summary: "String UTF-8 bytes দিয়ে তৈরি। তাই len() মানে byte সংখ্যা, আর s[0] লেখা যায় না। কেন, আর কী করতে হয়, এই পাঠে সেটাই।"
minutes: 6
---

## কেন শিখবো?

Rust-এর `String` সবসময় **UTF-8**, তাই `é` বা `🦀`-এর মতো অক্ষর একাধিক byte নেয়। Rust এই ঝামেলা লুকায় না, সামনে এনে দেয়, ফলে ভাঙা text আর পাবে না।

## `len()` আর `chars().count()`

`len()` গুনে **byte**, অক্ষর নয়। অক্ষর গুনতে `chars().count()`। ASCII অক্ষর ১ byte, `é` ২ byte, `🦀` ৪ byte।

```rust
fn main() {
    let a = String::from("cafe");
    let b = String::from("café");
    let c = String::from("🦀");
    println!("{} bytes, {} chars", a.len(), a.chars().count());
    println!("{} bytes, {} chars", b.len(), b.chars().count());
    println!("{} bytes, {} chars", c.len(), c.chars().count());
}
```

```text
4 bytes, 4 chars
5 bytes, 4 chars
4 bytes, 1 chars
```

## String জোড়া: `push_str`, `+`, `format!`

`push_str` টুকরো আর `push` একটা `char` যোগ করে (`mut` লাগে)। `a + &b`-এ `a` move হয়, `b` ধার নেওয়া হয়, তাই `&` লাগে। `format!` কিছু move না করে নতুন `String` দেয়, আর এটাই সবচেয়ে সহজ।

```rust
fn main() {
    let mut s = String::from("Hello");
    s.push_str(", ");
    s.push('R');
    println!("{s}");

    let a = String::from("foo");
    let b = String::from("bar");
    let c = a + &b; // a is moved, b is only borrowed
    println!("{c} {b}");

    println!("{}", format!("{c}-{b}-{}", 42));
}
```

```text
Hello, R
foobar bar
foobar-bar-42
```

## অক্ষর আর byte slice

index (`s[3]`) দিয়ে অক্ষর পাওয়া যায় না, কারণ সেটা byte না অক্ষর, তা অস্পষ্ট। অক্ষর চাইলে `chars()`। টুকরো চাইলে `&s[0..3]`, কিন্তু সংখ্যাগুলো **byte** offset, আর অক্ষরের মাঝে কাটলে panic।

```rust
fn main() {
    let s = String::from("café");
    println!("{:?}", s.chars().next());
    println!("{:?}", s.chars().nth(3));
    println!("{}", &s[0..3]); // bytes 0, 1, 2 are c, a, f
}
```

```text
Some('c')
Some('é')
caf
```

## `trim`, `split_whitespace`, `parse`

`trim()` দুই পাশের ফাঁকা কাটে, `split_whitespace()` শব্দে ভাঙে, `parse::<i32>()` শব্দকে সংখ্যা বানায়। সংখ্যা না হলে `Err` আসে, তাই ফল `Result` (লেসন ১৬)।

```rust
fn main() {
    let line = "  10 20 abc 30  ";
    let t = line.trim();
    println!("[{t}]");

    let mut total = 0;
    for word in t.split_whitespace() {
        if let Ok(n) = word.parse::<i32>() {
            total += n;
        } else {
            println!("skip {word}");
        }
    }
    println!("total = {total}");
}
```

```text
[10 20 abc 30]
skip abc
total = 60
```

## সাধারণ ভুল

`String`-এ index দিয়ে অক্ষর নেওয়া:

```rust compile_fail
fn main() {
    let s = String::from("hello");
    let c = s[0]; // error[E0277]: the type `str` cannot be indexed by `{integer}`
    println!("{c}");
}
```

`chars().nth(0)` ব্যবহার করো। আর দুটো `String` জোড়ায় `a + b` লিখলেও error হয়, লিখতে হয় `a + &b`।

## নিজে করো

`"  Rust is fun  "` নাও। `trim` করে প্রতিটা শব্দ আর তার অক্ষর সংখ্যা print করো, শেষে মোট শব্দ সংখ্যা।

<details>
<summary>সমাধান দেখো</summary>

```rust
fn main() {
    let text = "  Rust is fun  ";
    let mut count = 0;
    for word in text.trim().split_whitespace() {
        println!("{word}: {}", word.chars().count());
        count += 1;
    }
    println!("words = {count}");
}
```

```text
Rust: 4
is: 2
fun: 3
words = 3
```

</details>

## মনে রাখো

- `String` UTF-8। `len()` byte গোনে, অক্ষর গুনতে `chars().count()`।
- `s[0]` চলে না। অক্ষরে `chars()`, টুকরোয় byte range `&s[a..b]`।
- জোড়ায় `push_str`, `+ &b` বা `format!`।
- `trim`, `split_whitespace`, `parse::<T>()` (ফল `Result`)।
