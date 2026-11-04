---
title: "Variable: let, mut আর shadowing"
short: "Variables"
part: 1
order: 3
summary: "Rust-এ variable ডিফল্টভাবে বদলায় না। বদলাতে চাইলে mut লাগে, আর shadowing দিয়ে নতুন করে বানানো যায়।"
minutes: 5
---

## কেন শিখবো?

Python বা JS-এ variable যখন-তখন বদলায়, তাই "কে বদলালো?" খোঁজা কঠিন। Rust-এ variable **ডিফল্টভাবে বদলায় না**, বদলাতে চাইলে স্পষ্ট বলতে হয়।

## let আর mut

`let` দিয়ে বানানো variable একবার মান পেলে আর বদলায় না। বদলাতে চাইলে `let mut`। type লিখতে হয় না, compiler নিজেই বোঝে।

```rust
fn main() {
    let x = 5;
    let mut score = 10;
    score += 5;
    println!("x = {x}, score = {score}");
}
```

```text
x = 5, score = 15
```

## Shadowing

আবার `let` লিখে একই নামে নতুন variable বানানোকে **shadowing** বলে। এটা `mut` থেকে আলাদা, কারণ এখানে নতুন variable তৈরি হয়, তাই **type-ও বদলানো যায়**। ভেতরের `{ }`-এর shadow বাইরে এলে শেষ হয়।

```rust
fn main() {
    let spaces = "   ";
    let spaces = spaces.len();
    println!("spaces = {spaces}");

    let x = 1;
    {
        let x = x * 10;
        println!("inner x = {x}");
    }
    println!("outer x = {x}");
}
```

```text
spaces = 3
inner x = 10
outer x = 1
```

## const

`const` কখনো বদলায় না। `mut` চলে না, type লিখতেই হয়, নাম বড় হাতের (`SCREAMING_SNAKE_CASE`)। variable আর function-এর নাম `snake_case`।

```rust
const MAX_POINTS: u32 = 100_000;

fn main() {
    let used = 25_000;
    println!("left: {}", MAX_POINTS - used);
}
```

```text
left: 75000
```

## সাধারণ ভুল

`mut` ছাড়া মান বদলানো:

```rust compile_fail
fn main() {
    let x = 5;
    x = 6; // error[E0384]: cannot assign twice to immutable variable `x`
    println!("{x}");
}
```

ঠিক করতে লেখো `let mut x = 5;`, অথবা shadowing করো: `let x = 6;`।

## নিজে করো

`price = 200` বানাও। shadowing দিয়ে ১০ যোগ করো, তারপর `mut` variable বানিয়ে ২ দিয়ে গুণ করে print করো: `420`।

<details>
<summary>সমাধান দেখো</summary>

```rust
fn main() {
    let price = 200;
    let price = price + 10; // shadowing: 210
    let mut price = price;  // now it can change
    price *= 2;
    println!("{price}");
}
```

```text
420
```

</details>

## মনে রাখো

- `let` ডিফল্টভাবে বদলায় না, বদলাতে `let mut`।
- shadowing মানে আবার `let`, এতে type-ও বদলানো যায়।
- `const` সবসময় ধ্রুব: type লিখতে হয়, নাম `UPPER_CASE`।
- variable `snake_case`, const `SCREAMING_SNAKE_CASE`।
