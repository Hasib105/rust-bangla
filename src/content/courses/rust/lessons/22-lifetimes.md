---
title: "Lifetime: reference কতক্ষণ বাঁচবে"
short: "Lifetimes"
part: 5
order: 22
summary: "Lifetime annotation compiler-কে জানায় একটা reference কতক্ষণ বৈধ, যাতে dangling reference কখনো তৈরি না হয়।"
minutes: 6
---

## কেন শিখবো?

C-তে function-এর ভেতরের variable-এর address ফেরত দিলে সেটা ঝুলে থাকে (**dangling pointer**)। Rust compile time-এই এটা আটকায়, **lifetime** (reference কতক্ষণ বৈধ) দিয়ে। বেশিরভাগ সময় compiler নিজেই হিসাব করে, শুধু কিছু জায়গায় সাহায্য লাগে।

## Dangling reference আটকানো

reference কখনো মালিকের চেয়ে বেশিদিন বাঁচতে পারে না। নিচে `x` আগেই মরে গেছে, কিন্তু `r` তাকে ধরে আছে:

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

## `longest<'a>`

দুটো `&str` থেকে বড়টা ফেরত দিলে compiler জানে না ফলাফল কার সাথে বাঁধা। `'a` একটা lifetime-এর নাম: "দুটো input আর output অন্তত `'a` ধরে বৈধ, ফলাফল দুই input-এর যেটা কম বাঁচে তার বেশি বাঁচবে না।" annotation কোনো reference-কে বেশিদিন বাঁচায় না, শুধু সম্পর্ক জানায়।

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

## Struct-এ reference রাখা

struct reference ধরলে তারও lifetime লিখতে হয়: struct তার ধরা text-এর চেয়ে বেশিদিন বাঁচবে না।

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

## Elision আর `'static`

compiler তিন নিয়মে নিজেই lifetime বসায় (**elision**): (১) প্রতিটা reference parameter আলাদা lifetime পায়, (২) reference parameter **একটাই** হলে output সেটা পায়, (৩) `&self` থাকলে output `self`-এরটা পায়। `longest`-এ দুটো input, তাই `'a` লাগে।
`'static` মানে পুরো program জুড়ে বৈধ, যেমন সব string literal (`&'static str`)।

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

`s` function শেষে মরে যায়, কোনো annotation তাকে বাঁচাতে পারে না। ঠিক করো মালিকানা ফেরত দিয়ে: `-> String`, আর শেষে `s`।

## নিজে করো

`pick_first<'a>(a: &'a str, b: &str) -> &'a str` লেখো, যা সবসময় প্রথমটা ফেরত দেয়। `main`-এ `"alpha"` আর একটা `String` দিয়ে ডাকো।

<details>
<summary>সমাধান দেখো</summary>

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

- lifetime হলো reference কতক্ষণ বৈধ তার হিসাব, কাজ dangling reference আটকানো।
- `longest<'a>`-এ ফলাফল দুই input-এর ছোট lifetime পর্যন্ত বাঁচে। struct-এ reference থাকলে `Excerpt<'a>`।
- elision-এ বেশিরভাগ জায়গায় লিখতে হয় না। `'static` মানে পুরো program জুড়ে।
