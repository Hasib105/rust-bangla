---
title: "Lifetime: reference কতক্ষণ বাঁচবে"
short: "Lifetimes"
part: 5
order: 22
summary: "Lifetime annotation compiler-কে জানায় একটা reference কতক্ষণ বৈধ, যাতে dangling reference কখনো তৈরি না হয়।"
icon: "⏳"
minutes: 10
video: "h00o91WVDbk"
---

## কেন শিখবো?

C-তে এমন ভুল খুব সহজ: একটা function-এর ভেতরের variable-এর address ফেরত দিলে। function শেষ হলে সেই memory মুছে যায়, আর address ঝুলে থাকে (**dangling pointer**)। এর ফল crash বা অদ্ভুত bug।
Rust compile time-এই এটা আটকায়। এর হাতিয়ার হলো **lifetime**, মানে একটা reference কতক্ষণ বৈধ থাকবে তার হিসাব। বেশিরভাগ সময় compiler নিজেই হিসাব করে নেয়। শুধু কিছু জায়গায় তোমাকে সাহায্য করতে হয়।

## Dangling reference আটকানো

borrowing-এর পাঠে দেখেছো reference কখনো মালিকের চেয়ে বেশিদিন বাঁচতে পারে না। নিচে `r` ভেতরের scope-এর `x`-কে ধরে আছে, কিন্তু `x` আগেই মরে গেছে:

```rust compile_fail
fn main() {
    let r;
    {
        let x = 5;
        r = &x; // error[E0597]: `x` does not live long enough
    }
    println!("{r}");
}
```

compiler বলে `x` যথেষ্ট সময় বাঁচেনি, কারণ `println!` পর্যন্ত `r`-এর দরকার ছিল। Rust এই হিসাবটা প্রতিটা reference-এর জন্য করে।

## `longest<'a>`: কোন reference কতক্ষণ বাঁচবে

দুটো `&str` থেকে বড়টা ফেরত দেওয়ার function ধরো। ফেরত আসা reference কি প্রথমটার সাথে বাঁধা, না দ্বিতীয়টার? compiler নিজে বুঝতে পারে না, তাই লিখে বলতে হয়।
`'a` একটা lifetime-এর নাম। নিচের মানে: "দুটো input আর output, তিনটেই অন্তত `'a` সময় ধরে বৈধ। ফলাফল দুই input-এর মধ্যে যেটা কম বাঁচে, তার বেশি বাঁচবে না।"

```rust
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

fn main() {
    let first = String::from("rustacean");
    let second = String::from("crab");
    let result = longest(&first, &second);
    println!("longest: {result}");
}
```

```text
longest: rustacean
```

lifetime annotation কোনো reference-কে বেশিদিন বাঁচায় না। এটা শুধু compiler-কে বলে দেয় reference-গুলোর মধ্যে সম্পর্ক কী, যাতে সে যাচাই করতে পারে।

নিচের কোড এই যাচাইয়ে ধরা পড়ে। `result` ভেতরের scope-এ বানানো `inner`-এর reference হতে পারে, কিন্তু `inner` আগেই মরে যায়:

```rust compile_fail
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

fn main() {
    let first = String::from("rustacean");
    let result;
    {
        let inner = String::from("crab");
        result = longest(&first, &inner); // error[E0597]: `inner` does not live long enough
    }
    println!("{result}");
}
```

## Struct-এ reference রাখা

struct কোনো reference ধরে রাখলে তারও lifetime লিখতে হয়। মানে: "এই struct তার ধরা text-এর চেয়ে বেশিদিন বাঁচতে পারবে না।"

```rust
struct Excerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first = novel.split('.').next().unwrap();
    let e = Excerpt { part: first };
    println!("{}", e.part);
}
```

```text
Call me Ishmael
```

`e` কেবল `novel`-এর ভেতরের অংশ ধার নিয়েছে, তাই `novel` বেঁচে থাকতে থাকতেই `e` ব্যবহার করা যায়।

## Elision: বেশিরভাগ সময় লিখতেই হয় না

প্রতিটা function-এ `'a` লিখতে হলে খুব বিরক্তিকর হতো। তাই compiler তিনটা নিয়মে নিজেই বসিয়ে নেয় (**lifetime elision**):

1. প্রতিটা reference parameter পায় নিজস্ব আলাদা lifetime।
2. যদি reference parameter ঠিক **একটাই** থাকে, output-ও সেই lifetime পায়।
3. যদি method-এ `&self` থাকে, output পায় `self`-এর lifetime।

এর বাইরে compiler আন্দাজ করে না, তখন তোমাকে লিখতে হয়। `longest`-এ দুটো reference input, তাই নিয়ম ২ খাটে না। সেজন্যই ওখানে `'a` লাগে।

```rust
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

fn main() {
    println!("{}", first_word("hello brave new world"));
}
```

```text
hello
```

এখানে একটাই reference input, তাই কোনো `'a` ছাড়াই চলে।

## `'static`

`'static` মানে "পুরো program চলা পর্যন্ত বৈধ"। string literal-এর text binary-র ভেতরেই থাকে, তাই সব literal হলো `&'static str`।

```rust
fn motto() -> &'static str {
    "memory safe, no GC"
}

fn main() {
    let m = motto();
    println!("{m}");
}
```

```text
memory safe, no GC
```

compiler কখনো `'static` লিখতে বললে সাধারণত সেটা ভুল পথ। আগে দেখো তুমি কি আসলে local variable-এর reference ফেরত দিতে চাইছো কি না। তখন `String` ফেরত দেওয়াই ঠিক সমাধান।

## সাধারণ ভুল

function-এর ভেতরে বানানো জিনিসের reference ফেরত দেওয়া:

```rust compile_fail
fn make() -> &String { // error[E0106]: missing lifetime specifier
    let s = String::from("temp");
    &s
}

fn main() {
    println!("{}", make());
}
```

compiler বলে এই reference কার থেকে ধার নেওয়া, তা বলার মতো কোনো input নেই। আসলে `s` function শেষে মরে যায়, তাই `&s` ফেরত দেওয়া সম্ভবই না। সমাধান হলো মালিকানা ফেরত দেওয়া: `-> String`, আর শেষে শুধু `s`।

## নিজে করো

`pick_first<'a>(a: &'a str, b: &str) -> &'a str` নামে একটা function লেখো, যেটা সবসময় প্রথমটা ফেরত দেয় (দ্বিতীয়টার lifetime আলাদা, তাই `b`-তে `'a` নেই)। `main`-এ `"alpha"` আর একটা `String` দিয়ে ডাকো।

<details>
<summary>সমাধান দেখো</summary>

ফলাফল শুধু `a`-র সাথে বাঁধা, তাই `b`-র আলাদা lifetime হলে সমস্যা নেই।

```rust
fn pick_first<'a>(a: &'a str, b: &str) -> &'a str {
    println!("ignoring {b}");
    a
}

fn main() {
    let other = String::from("beta");
    let r = pick_first("alpha", &other);
    println!("{r}");
}
```

```text
ignoring beta
alpha
```

</details>

## মনে রাখো

- lifetime হলো reference কতক্ষণ বৈধ তার হিসাব। এর কাজ dangling reference আটকানো।
- `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str` মানে ফলাফল দুই input-এর ছোট lifetime পর্যন্ত বাঁচে।
- reference রাখা struct-এ lifetime লাগে: `struct Excerpt<'a> { part: &'a str }`।
- elision-এর নিয়মে বেশিরভাগ জায়গায় lifetime লিখতে হয় না। `'static` মানে পুরো program জুড়ে, যেমন string literal।
