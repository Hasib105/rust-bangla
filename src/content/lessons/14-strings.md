---
title: "String: UTF-8 আর text"
short: "String"
part: 3
order: 14
summary: "String UTF-8 bytes দিয়ে তৈরি। তাই len() মানে byte সংখ্যা, আর s[0] লেখা যায় না। কেন, আর কী করতে হয়, এই পাঠে সেটাই।"
icon: "🔤"
minutes: 9
video: "j6yjnVr7kTA"
---

## কেন শিখবো?

Python-এ `"café"[3]` লিখলে `é` পাওয়া যায়, সহজ। C-তে string মানে `char` array, আর ভুল করে মাঝখানে কাটলে ভাঙা অক্ষর বা crash।
Rust-এর `String` সবসময় **UTF-8**, মানে `é` বা `🦀`-এর মতো অক্ষর একাধিক byte নেয়। Rust এই ঝামেলা লুকায় না, সামনে এনে দেয়। একবার নিয়মটা বুঝলে ভাঙা text আর কখনো পাবে না।

## len() আর chars().count()

`len()` গুনে **byte**, অক্ষর নয়। অক্ষর গুনতে চাইলে `chars().count()`। ASCII অক্ষর ১ byte, কিন্তু `é` নেয় ২ byte আর `🦀` নেয় ৪ byte।

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

## String বাড়ানো: push_str, + আর format!

- `push_str("...")` পুরো টুকরো, `push('c')` একটা `char` যোগ করে। দুটোর জন্যই `mut` লাগে।
- `a + &b` লিখলে `a` **move** হয়ে নতুন String-এর অংশ হয়ে যায় (ownership-এর কথা মনে আছে?), আর `b` শুধু ধার নেওয়া হয়। তাই `b`-এর আগে `&` লাগে।
- অনেক টুকরো জোড়ার সবচেয়ে সহজ উপায় `format!`। এটা `println!`-এর মতোই, কিন্তু print না করে `String` ফেরত দেয়, আর কোনো কিছু move করে না।

```rust
fn main() {
    let mut s = String::from("Hello");
    s.push_str(", ");
    s.push('R');
    s.push_str("ust");
    println!("{s}");

    let a = String::from("foo");
    let b = String::from("bar");
    let c = a + &b; // a is moved, b is only borrowed
    println!("{c} {b}");

    let d = format!("{c}-{b}-{}", 42);
    println!("{d}");
}
```

```text
Hello, Rust
foobar bar
foobar-bar-42
```

## কেন s[0] লেখা যায় না

ধরো `s = "café"`। `s[3]` বলতে কী বোঝাবে? তিন নম্বর **byte**? সেটা তো `é`-এর অর্ধেক, ভাঙা জিনিস। নাকি তিন নম্বর **অক্ষর**? সেটা বের করতে শুরু থেকে প্রতিটা অক্ষর দেখে দেখে গুনতে হবে, মানে O(n) সময়, অথচ `s[3]` দেখে মনে হয় এক ধাপের কাজ।
দুই অর্থেই সমস্যা, তাই Rust সোজা না করে দেয়।

```rust compile_fail
fn main() {
    let s = String::from("hello");
    let c = s[0]; // error[E0277]: the type `str` cannot be indexed by `{integer}`
    println!("{c}");
}
```

যা করা যায়:

- অক্ষর চাইলে `chars()`। `nth(3)` বা `next()` একটা `Option<char>` দেয়।
- টুকরো চাইলে range slice `&s[0..3]`, কিন্তু এখানে সংখ্যাগুলো **byte** offset। কাটার জায়গা কোনো অক্ষরের মাঝখানে পড়লে প্রোগ্রাম panic করে।

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

## trim, split_whitespace আর parse

text সামলানোর তিনটা রোজকার method:

- `trim()` দুই পাশের ফাঁকা জায়গা কেটে দেয়
- `split_whitespace()` ফাঁকা জায়গায় ভেঙে এক এক করে শব্দ দেয়
- `parse::<i32>()` শব্দকে সংখ্যায় বদলায়। সংখ্যা না হলে সফল হয় না, তাই ফল আসে `Result`-এ (`Ok` বা `Err`)। `Result` নিয়ে বিস্তারিত লেসন ১৬-তে। এখানে `if let Ok(n)` দিয়ে শুধু সফলগুলো নিচ্ছি

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

দুটো `String` সরাসরি `+` দিয়ে জোড়া:

```rust compile_fail
fn main() {
    let a = String::from("foo");
    let b = String::from("bar");
    let c = a + b; // error[E0308]: mismatched types
    println!("{c}");
}
```

compiler বলে `expected &str, found String`। `+`-এর ডান দিকে `&str` লাগে। ঠিক করো `a + &b` লিখে, অথবা আরও সহজে `format!("{a}{b}")` দিয়ে।

## নিজে করো

`"  Rust is fun  "` নাও। `trim` করো, তারপর `split_whitespace` দিয়ে প্রতিটা শব্দ আর তার অক্ষর সংখ্যা (`chars().count()`) এক লাইনে print করো। শেষে মোট শব্দ সংখ্যা print করো (একটা counter রাখো)।

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
- `s[0]` লেখা যায় না। অক্ষরের জন্য `chars()`, টুকরোর জন্য byte range `&s[a..b]`, যেটা অক্ষরের মাঝে কাটলে panic করে।
- জোড়া লাগাতে `push_str`, `+ &b` বা সবচেয়ে সহজ `format!`। `a + b` লিখলে error, `&` ভুলো না।
- `trim`, `split_whitespace`, `parse::<T>()` text থেকে ডেটা বের করার প্রধান হাতিয়ার। `parse` সবসময় `Result` ফেরত দেয়।
