---
title: "Variable: let, mut আর shadowing"
short: "Variables"
part: 1
order: 3
summary: "Rust-এ variable ডিফল্টভাবে বদলায় না। বদলাতে চাইলে mut লাগে, আর shadowing দিয়ে নতুন করে বানানো যায়।"
icon: "📦"
minutes: 8
video: "rebzB9YrEq0"
---

## কেন শিখবো?

Python বা JS-এ যেকোনো variable যখন-তখন বদলে ফেলা যায়। বড় program-এ তাই "এই মানটা কে বদলালো?" খুঁজে বের করা কঠিন হয়ে পড়ে।
Rust উল্টো পথে হাঁটে: variable **ডিফল্টভাবে বদলায় না**। বদলাতে চাইলে তোমাকে স্পষ্ট করে বলতে হয়। ফলে কোড পড়লেই বোঝা যায় কোন মান স্থির, আর কোনটা বদলাতে পারে।

## let: immutable variable

`let` দিয়ে variable বানাতে হয়। একবার মান দিলে সেটা আর বদলানো যায় না।

```rust
fn main() {
    let x = 5;
    println!("x = {x}");
}
```

```text
x = 5
```

type লিখতে হয়নি, কারণ compiler মান দেখে নিজেই বুঝে নেয় (`5` মানে `i32`)। চাইলে লেখা যায়: `let x: i32 = 5;`।

## mut: বদলানো যায় এমন variable

বদলাতে চাইলে `let`-এর পরে `mut` (mutable) লেখো।

```rust
fn main() {
    let mut score = 10;
    println!("before: {score}");
    score = score + 5;
    println!("after: {score}");
}
```

```text
before: 10
after: 15
```

`score += 5` লিখলেও একই কাজ হয়। তবে type বদলানো যায় না। `score`-এ পরে লেখা ঢুকাতে গেলে error আসবে।

## Shadowing: একই নামে নতুন variable

আবার `let` লিখে একই নামে নতুন variable বানানোকে বলে **shadowing**। পুরোনোটা আড়ালে চলে যায়।
এটা `mut` থেকে আলাদা, কারণ এখানে সত্যিই নতুন variable তৈরি হয়, তাই **type-ও বদলানো যায়**।

```rust
fn main() {
    let spaces = "   ";
    let spaces = spaces.len();
    println!("spaces = {spaces}");

    let x = 1;
    let x = x + 1;
    {
        let x = x * 10;
        println!("inner x = {x}");
    }
    println!("outer x = {x}");
}
```

```text
spaces = 3
inner x = 20
outer x = 2
```

প্রথমে `spaces` ছিল লেখা, পরে হয়ে গেল সংখ্যা। ভেতরের `{ }`-এ shadow করা `x` শুধু সেই scope পর্যন্ত থাকে, বাইরে এসে আগের `x` ফিরে আসে।

## const: সবসময়ের ধ্রুব মান

`const` কখনোই বদলায় না। এখানে `mut` চলে না, type লিখতেই হয়, আর মান compile-এর সময়ই জানা থাকতে হবে। নাম লেখা হয় বড় হাতের অক্ষরে।

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

বড় সংখ্যায় `_` দিলে পড়তে সুবিধা হয়, মানে বদলায় না। `const` যেকোনো জায়গায় লেখা যায়, এমনকি `main`-এর বাইরেও।

## নামকরণ

- variable আর function: `snake_case`, যেমন `user_age`।
- `const`: `SCREAMING_SNAKE_CASE`, যেমন `MAX_POINTS`।
- যে variable ব্যবহার করছো না, তার নাম `_` দিয়ে শুরু করলে compiler warning দেয় না, যেমন `_unused`।

## সাধারণ ভুল

`mut` ছাড়া মান বদলানোর চেষ্টা:

```rust compile_fail
fn main() {
    let x = 5;
    x = 6; // error[E0384]: cannot assign twice to immutable variable `x`
    println!("{x}");
}
```

compiler বলে `cannot assign twice to immutable variable`, আর পরামর্শও দেয় `let mut x`। ঠিক করতে লেখো `let mut x = 5;`। অথবা যদি নতুন একটা variable চাও, shadowing করো: `let x = 6;`।

## নিজে করো

`price = 200` নামে একটা variable বানাও। এরপর shadowing দিয়ে ১০ যোগ করে নতুন `price` বানাও। তারপর সেটাকে `mut` variable বানিয়ে ২ দিয়ে গুণ করো আর print করো: `420`।

<details>
<summary>সমাধান দেখো</summary>

প্রথমে shadowing (`let price = price + 10`), তারপর `let mut` দিয়ে বদলানো যায় এমন variable বানিয়ে `*=` ব্যবহার।

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

- `let` দিয়ে বানানো variable ডিফল্টভাবে বদলায় না। বদলাতে চাইলে `let mut`।
- shadowing মানে আবার `let` দিয়ে নতুন variable বানানো, আর এতে type-ও বদলানো যায়।
- `const` সবসময় ধ্রুব: type লিখতে হয়, নাম `UPPER_CASE`।
- নামকরণ: variable `snake_case`, const `SCREAMING_SNAKE_CASE`।
