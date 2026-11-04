---
title: "Enum আর match"
short: "Enum"
part: 3
order: 11
summary: "একটা value কয়েকটা রূপের যেকোনো একটা হতে পারে, আর `match` প্রতিটা রূপ সামলাতে বাধ্য করে।"
icon: "🔀"
minutes: 9
video: "wVJ2_mt22mg"
---

## কেন শিখবো?

struct বলে "এটাও আছে **এবং** ওটাও আছে"। কিন্তু অনেক সময় ডেটা হয় "এটা **অথবা** ওটা": একটা আকার হয় বৃত্ত, নয়তো আয়তক্ষেত্র। একটা network সংযোগ হয় connected, নয়তো failed।
C-তে এটা সংখ্যা (`0`, `1`, `2`) দিয়ে সামলাতে হয়, আর কোনো case ভুলে গেলে কেউ ধরে না। Rust-এর **enum** আর **match** দিয়ে compiler নিজেই দেখে নেয় তুমি সব case সামলেছো কি না।

## Enum আর `match`

`enum` এর প্রতিটা সম্ভাব্য রূপকে variant বলে। `match` দিয়ে প্রতিটা variant-এর জন্য আলাদা কাজ লেখা হয়। `match` নিজেও একটা expression, তাই value ফেরত দেয়।

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

## ডেটাসহ variant

Rust-এর enum-এর বড় শক্তি হলো, প্রতিটা variant নিজের মতো ডেটা বহন করতে পারে। `match`-এর ভেতরে সেই ডেটা নামে বের করে আনা যায়।

```rust
enum Shape {
    Circle(f64),
    Rect { w: f64, h: f64 },
}

fn main() {
    let shapes = [Shape::Circle(2.0), Shape::Rect { w: 3.0, h: 4.0 }];
    for s in &shapes {
        match s {
            Shape::Circle(r) => println!("circle, radius {r}"),
            Shape::Rect { w, h } => println!("rect {w} x {h}"),
        }
    }
}
```

```text
circle, radius 2
rect 3 x 4
```

## Enum-এর method

struct-এর মতোই enum-এও `impl` দেওয়া যায়। `self`-এর উপর `match` করলে প্রতিটা রূপের জন্য আলাদা হিসাব করা যায়।

```rust
enum Shape {
    Circle(f64),
    Square(f64),
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(r) => 3.14 * r * r,
            Shape::Square(side) => side * side,
        }
    }
}

fn main() {
    println!("{:.2}", Shape::Circle(2.0).area());
    println!("{:.2}", Shape::Square(3.0).area());
}
```

```text
12.56
9.00
```

## `_`, `if let` আর `matches!`

সব variant আলাদা করে লিখতে না চাইলে `_` দিয়ে "বাকি সব" বোঝানো যায়। আর শুধু একটা variant-এ আগ্রহ থাকলে পুরো `match` লেখা ঝামেলা, তখন `if let` বা `matches!` ব্যবহার করো।

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

    let l2 = Light::Yellow;
    if let Light::Yellow = l2 {
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

`matches!` একটা `bool` দেয়, আর `|` দিয়ে একাধিক রূপ মেলানো যায়। `if let` দিয়ে ডেটাও বের করা যায়, যেমন `if let Shape::Circle(r) = s { ... }`।
তবে `_` দিলে compiler আর বলবে না যে নতুন variant যোগ হয়েছে। তাই সম্ভব হলে সব variant লেখাই নিরাপদ।

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

`match`-কে সব রূপ সামলাতে হয় (exhaustive)। compiler ঠিক বলে দেয় কোনটা বাদ পড়েছে। এটাই enum-এর সবচেয়ে বড় সুবিধা: পরে নতুন variant যোগ করলে যেসব `match` আপডেট করতে হবে, compiler সবগুলো দেখিয়ে দেবে।

## নিজে করো

`Coin` নামে একটা enum বানাও যার variant `Penny`, `Nickel`, `Dime`, `Quarter`। একটা function `cents(c: Coin) -> u32` লেখো যা যথাক্রমে `1`, `5`, `10`, `25` ফেরত দেবে।
`main`-এ `Dime` আর `Quarter`-এর মান যোগ করে print করো।

<details>
<summary>সমাধান দেখো</summary>

`match` একটা expression, তাই সরাসরি function-এর শেষ লাইনে বসিয়ে দিলেই value return হয়ে যায়।

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

- `enum` মানে "এই কয়েকটার যেকোনো একটা"। প্রতিটা variant নিজের ডেটা বহন করতে পারে।
- `match` সব variant সামলাতে বাধ্য করে। কিছু বাদ গেলে compile হয় না।
- বাকি সবের জন্য `_`। একটা variant-এ আগ্রহ থাকলে `if let`, আর হ্যাঁ/না জানতে `matches!`।
- struct-এর মতোই enum-এ `impl` দিয়ে method লেখা যায়।
