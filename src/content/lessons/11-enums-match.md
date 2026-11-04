---
title: "Enum আর match"
short: "Enum"
part: 3
order: 11
summary: "একটা value কয়েকটা রূপের যেকোনো একটা হতে পারে, আর `match` প্রতিটা রূপ সামলাতে বাধ্য করে।"
icon: "🔀"
minutes: 5
video: "wVJ2_mt22mg"
---

## কেন শিখবো?

ডেটা অনেক সময় "এটা **অথবা** ওটা" হয়, যেমন বৃত্ত নয়তো আয়তক্ষেত্র। C-তে সংখ্যা দিয়ে এটা সামলাতে হয়, আর case ভুললে কেউ ধরে না। Rust-এর **enum** আর **match**-এ compiler নিজে দেখে নেয় সব case সামলানো হয়েছে কি না।

## Enum আর `match`

`enum`-এর প্রতিটা রূপকে variant বলে। `match` প্রতিটা variant-এর জন্য আলাদা কাজ লেখে, আর সে নিজেও একটা expression।

```rust
enum Light {
    Red,
    Yellow,
    Green,
}

fn action(l: Light) -> &'static str {
    match l {
        Light::Red => "stop",
        Light::Yellow => "slow down",
        Light::Green => "go",
    }
}

fn main() {
    println!("{}", action(Light::Red));
    println!("{}", action(Light::Green));
}
```

```text
stop
go
```

## ডেটাসহ variant আর method

প্রতিটা variant নিজের ডেটা বহন করতে পারে, আর `match`-এর ভেতরে সেটা নামে বের করা যায়। struct-এর মতো enum-এও `impl` চলে।

```rust
enum Shape {
    Circle(f64),
    Rect { w: f64, h: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(r) => 3.0 * r * r,
            Shape::Rect { w, h } => w * h,
        }
    }
}

fn main() {
    println!("{}", Shape::Circle(2.0).area());
    println!("{}", Shape::Rect { w: 3.0, h: 4.0 }.area());
}
```

```text
12
12
```

## `_`, `if let` আর `matches!`

`_` মানে "বাকি সব"। একটা variant নিয়েই আগ্রহ থাকলে `if let`, আর হ্যাঁ/না জানতে `matches!` (এটা `bool` দেয়, `|` দিয়ে একাধিক রূপ মেলে)।

```rust
enum Light {
    Red,
    Yellow,
    Green,
}

fn main() {
    let l = Light::Green;
    let text = match l {
        Light::Green => "go",
        _ => "wait", // every other variant
    };
    println!("{text}");

    if let Light::Yellow = Light::Yellow {
        println!("careful");
    }
    println!("{}", matches!(Light::Red, Light::Red | Light::Yellow));
}
```

```text
go
careful
true
```

## সাধারণ ভুল

একটা variant বাদ দিয়ে `match` লেখা:

```rust compile_fail
enum Light {
    Red,
    Yellow,
    Green,
}

fn main() {
    let l = Light::Red;
    let s = match l { // error[E0004]: non-exhaustive patterns: `Light::Green` not covered
        Light::Red => "stop",
        Light::Yellow => "slow down",
    };
    println!("{s}");
}
```

`match`-কে সব variant সামলাতে হয় (exhaustive)। বাদ পড়া variant যোগ করো, অথবা `_` দাও।

## নিজে করো

`Coin` enum বানাও (`Penny`, `Nickel`, `Dime`, `Quarter`) আর `cents(c: Coin) -> u32` লেখো, যা `1`, `5`, `10`, `25` দেবে। `Dime` আর `Quarter`-এর যোগফল print করো।

<details>
<summary>সমাধান দেখো</summary>

`match` একটা expression, তাই function-এর শেষ লাইনে বসালেই value return হয়।

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn cents(c: Coin) -> u32 {
    match c {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {
    let total = cents(Coin::Dime) + cents(Coin::Quarter);
    println!("total = {total}");
}
```

```text
total = 35
```

</details>

## মনে রাখো

- `enum` মানে "এই কয়েকটার যেকোনো একটা", আর variant ডেটা বহন করতে পারে।
- `match` সব variant সামলাতে বাধ্য করে, নইলে compile হয় না।
- বাকি সবের জন্য `_`, একটার জন্য `if let`, হ্যাঁ/না-র জন্য `matches!`।
- enum-এও `impl` দিয়ে method লেখা যায়।
