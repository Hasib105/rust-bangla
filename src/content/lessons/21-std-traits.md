---
title: "Standard trait: derive, Display, From, Add"
short: "Std Traits"
part: 5
order: 21
summary: "std-এর জনপ্রিয় trait-গুলো, মানে Debug, Clone, PartialEq, Display, From আর Add, নিজের type-এ কীভাবে লাগাবে।"
icon: "🧰"
minutes: 10
video: "TGcK37erIvA"
---

## কেন শিখবো?

নিজের `struct` বানালে প্রথমে `println!("{:?}", p)` চলে না, `==` চলে না, কপিও করা যায় না। কারণ এই কাজগুলো সবই std-এর **trait**, আর তুমি এখনো কোনোটা implement করোনি।
সুখবর হলো বেশিরভাগ trait এক লাইনে পাওয়া যায়। আর `+`, `println!("{}")` বা `.into()` নিজের type-এ চালাতে চাইলে একটা trait implement করলেই হয়।

## `derive`: এক লাইনে trait

struct-এর ওপরে `#[derive(...)]` লিখলে compiler নিজেই impl লিখে দেয়। শর্ত হলো, struct-এর সব field-এও সেই trait থাকতে হবে।

```rust
#[derive(Debug, Clone, PartialEq, Default)]
struct User {
    name: String,
    age: u32,
}

fn main() {
    let a = User { name: String::from("Rina"), age: 21 };
    let b = a.clone();
    println!("{:?}", a);
    println!("equal: {}", a == b);
    println!("{:?}", User::default());
}
```

```text
User { name: "Rina", age: 21 }
equal: true
User { name: "", age: 0 }
```

- `Debug`: `{:?}` দিয়ে print করা যায়।
- `Clone`: `.clone()` দিয়ে কপি।
- `PartialEq`: `==` আর `!=`।
- `Default`: `User::default()` দিলে সব field-এর ডিফল্ট মান (শূন্য, ফাঁকা string)।

## Ord, Eq আর Hash

`PartialOrd` দিলে `<` `>` চলে, `Ord` দিলে `sort()` আর `max()` চলে। `Eq` মানে "পুরোপুরি সমান হওয়ার নিয়ম আছে" (float-এ `NaN` থাকে বলে `f64` শুধু `PartialEq`)। `Hash` দিলে type `HashMap`-এর key হতে পারে।
struct-এর তুলনা field-এর ক্রমে হয়, মানে আগে `score`, সমান হলে তারপর `name`।

```rust
use std::collections::HashSet;

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone)]
struct Player {
    score: u32,
    name: String,
}

fn main() {
    let mut team = vec![
        Player { score: 50, name: String::from("Zed") },
        Player { score: 90, name: String::from("Amy") },
        Player { score: 50, name: String::from("Bob") },
    ];
    team.sort();
    for p in &team {
        println!("{} {}", p.score, p.name);
    }
    let set: HashSet<Player> = team.iter().cloned().collect();
    println!("unique: {}", set.len());
}
```

```text
50 Bob
50 Zed
90 Amy
unique: 3
```

## `Display`: `{}` দিয়ে সুন্দর print

`Debug` programmer-এর জন্য, আর `Display` user-এর জন্য। এটা derive হয় না, নিজে লিখতে হয়, কারণ সুন্দর চেহারা কেমন হবে সেটা শুধু তুমিই জানো।

```rust
use std::fmt;

struct Money {
    taka: u32,
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} BDT", self.taka)
    }
}

fn main() {
    let m = Money { taka: 250 };
    println!("price: {}", m);
    let text = m.to_string();
    println!("len: {}", text.len());
}
```

```text
price: 250 BDT
len: 7
```

`Display` implement করলে `.to_string()` ফ্রি পাওয়া যায়।

## `From` আর `Into`: type বদলানো

`impl From<A> for B` লিখলে `B::from(a)` চলে, আর বিনা খরচে `a.into()`-ও চলে। `into()`-এর ক্ষেত্রে compiler-কে বলে দিতে হয় ফলাফল কোন type, তাই `let` লাইনে type লিখে দিতে হয়।

```rust
struct Celsius(f64);
struct Fahrenheit(f64);

impl From<Celsius> for Fahrenheit {
    fn from(c: Celsius) -> Self {
        Fahrenheit(c.0 * 9.0 / 5.0 + 32.0)
    }
}

fn main() {
    let f = Fahrenheit::from(Celsius(100.0));
    println!("{}", f.0);
    let g: Fahrenheit = Celsius(0.0).into();
    println!("{}", g.0);
}
```

```text
212
32
```

## `Add`: নিজের type-এ `+`

`a + b` আসলে `a.add(b)`-এর সংক্ষিপ্ত রূপ। `std::ops::Add` implement করলে নিজের type-এও `+` চলে। `Sub`, `Mul`, `Neg` একইভাবে।

```rust
use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq)]
struct Vec2 {
    x: i32,
    y: i32,
}

impl Add for Vec2 {
    type Output = Vec2;

    fn add(self, other: Vec2) -> Vec2 {
        Vec2 { x: self.x + other.x, y: self.y + other.y }
    }
}

fn main() {
    let a = Vec2 { x: 1, y: 2 };
    let b = Vec2 { x: 10, y: 20 };
    println!("{:?}", a + b);
}
```

```text
Vec2 { x: 11, y: 22 }
```

`type Output` লাইনটা কী, তা আগামী কয়েক পাঠের মধ্যে (associated type) পরিষ্কার হবে। আপাতত বুঝে নাও, এটা `+`-এর ফলাফলের type।

## সাধারণ ভুল

`derive` ছাড়া `{:?}` ব্যবহার করা:

```rust compile_fail
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 1, y: 2 };
    println!("{:?}", p); // error[E0277]: `Point` doesn't implement `Debug`
}
```

compiler নিজেই উপায় বলে দেয়: `add #[derive(Debug)] to Point`। struct-এর ওপরে এক লাইন যোগ করলেই ঠিক।

## নিজে করো

`Temp(i32)` নামে একটা tuple struct বানাও। এতে `Debug`, `Clone`, `Copy`, `PartialEq`, `PartialOrd` derive করো। `Display` implement করো যাতে `Temp(25)` print হলে `25C` দেখায়। তারপর `Temp(25)` আর `Temp(30)` তুলনা করে দেখো কোনটা বড়।

<details>
<summary>সমাধান দেখো</summary>

```rust
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
struct Temp(i32);

impl fmt::Display for Temp {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}C", self.0)
    }
}

fn main() {
    let a = Temp(25);
    let b = Temp(30);
    println!("{} {}", a, b);
    println!("{}", a < b);
}
```

```text
25C 30C
true
```

</details>

## মনে রাখো

- `#[derive(Debug, Clone, PartialEq, ...)]` এক লাইনে trait দেয়, তবে সব field-এও সেই trait থাকতে হবে।
- `Debug` হলো `{:?}`, programmer-এর জন্য। `Display` হলো `{}`, user-এর জন্য, আর সেটা নিজে লিখতে হয়।
- `impl From<A> for B` লিখলে `.into()` ফ্রি পাওয়া যায়।
- `impl Add` (বা `Sub`, `Mul`) লিখলে নিজের type-এ operator চলে।
