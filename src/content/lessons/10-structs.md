---
title: "Struct: নিজের type বানাও"
short: "Struct"
part: 3
order: 10
summary: "কয়েকটা নামওয়ালা field জুড়ে নিজের type বানাও, আর `impl` দিয়ে তার method লেখো।"
icon: "🧱"
minutes: 9
video: "tMkhIASGnxQ"
---

## কেন শিখবো?

একজন user-এর নাম, বয়স আর email আলাদা তিনটা variable-এ রাখলে function-এ পাঠানো আর সামলানো ঝামেলা। তিনটা আলাদা জিনিস যে একজনের, তা শুধু তুমিই জানো, compiler জানে না।
**struct** দিয়ে সব এক জায়গায় রাখা যায়, আর সেটা নিজেই একটা নতুন type হয়ে যায়। Python-এর class বা C-র struct-এর সাথে মিল আছে, তবে Rust-এ ডেটা (struct) আর আচরণ (`impl`) আলাদা করে লেখা হয়।

## Struct বানানো

`struct`-এর ভেতরে প্রতিটা field-এর নাম আর type দিতে হয়। value বানাতে সব field-এর মান দিতে হয়, আর পড়তে হয় `.` দিয়ে।

```rust
struct User {
    name: String,
    age: u32,
}

fn main() {
    let u = User {
        name: String::from("Rahim"),
        age: 22,
    };
    println!("{} is {}", u.name, u.age);
}
```

```text
Rahim is 22
```

variable-এর নাম আর field-এর নাম এক হলে শুধু একবার লিখলেই চলে (**field init shorthand**)। আর অন্য একটা value থেকে বাকি field নিতে চাইলে `..` লিখো (**update syntax**)।

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

`..a` সব বাকি field `a` থেকে নেয়। কোনো `String`-এর মতো non-Copy field নিলে সেটা move হয়ে যায়। এখানে `name` আমরা নিজে দিয়েছি, তাই `a` আর বাকি Copy field কোনো সমস্যা করে না।

## `impl`: struct-এর method

`impl` block-এর ভেতরে function লিখলে সেগুলো ওই type-এর method হয়। প্রথম parameter `self` এর ধরন ঠিক করে method কী করতে পারবে:

- `&self`: শুধু পড়বে (ধার নেয়)।
- `&mut self`: field বদলাবে।
- `self` ছাড়া function (যেমন `new`): `Type::new(...)` দিয়ে ডাকা হয়। এটা অন্য ভাষার constructor-এর মতো। `Self` মানে এই type নিজে।

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

`r.area()` আসলে `Rect::area(&r)`-এর সংক্ষিপ্ত রূপ। `grow` ডাকতে হয়েছে বলে `r`-কে `mut` করতে হয়েছে।

## Tuple struct

field-এর নাম না থাকলে সেটা tuple struct। দুটো আলাদা অর্থের জিনিস যাতে গুলিয়ে না যায়, সেজন্য এটা কাজের।
`Meters(5.0)` আর `Seconds(5.0)` ভেতরে একই `f64`, কিন্তু compiler এদের আলাদা type মনে করে।

```rust
struct Meters(f64);

fn main() {
    let d = Meters(5.5);
    println!("{} m", d.0); // fields are numbered
}
```

```text
5.5 m
```

## `#[derive(Debug)]`: print করা

নিজের struct সরাসরি `{}` দিয়ে print হয় না, কারণ Rust জানে না সেটা দেখতে কেমন হবে। `#[derive(Debug)]` লিখলে compiler নিজেই debug রূপ বানিয়ে দেয়, তখন `{:?}` চলে। সুন্দর করে ভেঙে দেখতে `{:#?}`।

```rust
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 1, y: -2 };
    println!("{:?}", p);
    println!("{:#?}", p);
}
```

```text
Point { x: 1, y: -2 }
Point {
    x: 1,
    y: -2,
}
```

## সাধারণ ভুল

`mut` ছাড়া struct-এর field বদলানো। struct-এর কোনো field আলাদা করে `mut` হয় না, পুরো variable-টাই `mut` হতে হয়:

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

compiler বলে `c` immutable। ঠিক করতে `let mut c = ...` লেখো। আরেকটা সাধারণ ভুল হলো `derive(Debug)` না দিয়ে `{:?}` ব্যবহার করা, তখন E0277 আসে।

## নিজে করো

`Counter` নামে একটা struct বানাও, যার একটা field `count: u32`। তিনটা method লেখো: `new()` (শুরুতে `0`), `increment(&mut self)`, আর `get(&self) -> u32`।
`main`-এ `increment` দুবার ডেকে `get` print করো।

<details>
<summary>সমাধান দেখো</summary>

`new` কোনো `self` নেয় না, তাই `Counter::new()` লিখে ডাকি। `increment` মান বদলায় তাই `&mut self`, আর `get` শুধু পড়ে তাই `&self`।

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

- `struct` কয়েকটা নামওয়ালা field জুড়ে একটা নতুন type বানায়। বদলাতে চাইলে পুরো variable `mut` হতে হয়।
- `impl` block-এ method লেখা হয়: `&self` পড়ে, `&mut self` বদলায়, `self` ছাড়া function হলো `Type::new()`-এর মতো।
- field shorthand (`User { name, age }`) আর update syntax (`..other`) লেখা ছোট করে।
- tuple struct-এ field-এর নাম নেই (`.0`)। `#[derive(Debug)]` দিলে `{:?}` দিয়ে print করা যায়।
