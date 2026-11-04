---
title: "Struct: নিজের type বানাও"
short: "Struct"
part: 3
order: 10
summary: "কয়েকটা নামওয়ালা field জুড়ে নিজের type বানাও, আর `impl` দিয়ে তার method লেখো।"
minutes: 5
---

## কেন শিখবো?

নাম, বয়স আর email আলাদা তিনটা variable-এ রাখলে সামলানো ঝামেলা। **struct** সব এক জায়গায় রেখে নিজেই একটা নতুন type হয়ে যায়।

## Struct বানানো

প্রতিটা field-এর নাম আর type দিতে হয়, পড়তে হয় `.` দিয়ে। variable আর field-এর নাম এক হলে একবার লিখলেই চলে (shorthand), আর `..a` লিখলে বাকি field `a` থেকে আসে (update syntax)।

```rust
struct User {
    name: String,
    age: u32,
    active: bool,
}

fn main() {
    let name = String::from("Rahim");
    let age = 22;
    let a = User { name, age, active: true }; // shorthand
    let b = User {
        name: String::from("Karim"),
        ..a // age and active come from a
    };
    println!("{} {} {}", b.name, b.age, b.active);
}
```

```text
Karim 22 true
```

## `impl`: struct-এর method

`impl` block-এর function হয় ওই type-এর method। `&self` শুধু পড়ে, `&mut self` field বদলায়। `self` ছাড়া function (যেমন `new`) ডাকতে হয় `Type::new()` দিয়ে, আর `Self` মানে type নিজে।

```rust
struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn new(w: u32, h: u32) -> Self {
        Self { w, h }
    }

    fn area(&self) -> u32 {
        self.w * self.h
    }

    fn grow(&mut self, by: u32) {
        self.w += by;
        self.h += by;
    }
}

fn main() {
    let mut r = Rect::new(3, 4);
    println!("area = {}", r.area());
    r.grow(1);
    println!("area = {}", r.area());
}
```

```text
area = 12
area = 20
```

## Tuple struct আর `Debug`

field-এর নাম না থাকলে tuple struct, পড়তে হয় `.0` দিয়ে। নিজের struct `{}` দিয়ে print হয় না। `#[derive(Debug)]` দিলে `{:?}` চলে, আর সুন্দর করে দেখতে `{:#?}`।

```rust
#[derive(Debug)]
struct Meters(f64);

fn main() {
    let d = Meters(5.5);
    println!("{} m", d.0);
    println!("{:?}", d);
}
```

```text
5.5 m
Meters(5.5)
```

## সাধারণ ভুল

struct-এর একটা field আলাদা `mut` হয় না, পুরো variable `mut` হতে হয়:

```rust compile_fail
struct Counter {
    n: u32,
}

fn main() {
    let c = Counter { n: 0 };
    c.n += 1; // error[E0594]: cannot assign to `c.n`
    println!("{}", c.n);
}
```

ঠিক করতে `let mut c = ...` লেখো।

## নিজে করো

`Counter` struct বানাও (`count: u32`) আর তিনটা method লেখো: `new()`, `increment(&mut self)`, `get(&self) -> u32`। `increment` দুবার ডেকে `get` print করো।

<details>
<summary>সমাধান দেখো</summary>

`new`-এ `self` নেই, `increment` মান বদলায় তাই `&mut self`, `get` শুধু পড়ে তাই `&self`।

```rust
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Self {
        Self { count: 0 }
    }

    fn increment(&mut self) {
        self.count += 1;
    }

    fn get(&self) -> u32 {
        self.count
    }
}

fn main() {
    let mut c = Counter::new();
    c.increment();
    c.increment();
    println!("count = {}", c.get());
}
```

```text
count = 2
```

</details>

## মনে রাখো

- `struct` নামওয়ালা field জুড়ে নতুন type বানায়। বদলাতে চাইলে পুরো variable `mut`।
- `&self` পড়ে, `&mut self` বদলায়, `self` ছাড়া function হলো `Type::new()`।
- shorthand `User { name, age }` আর update syntax `..other`।
- tuple struct-এ `.0`, আর `{:?}`-এর জন্য `#[derive(Debug)]`।
