---
title: "Standard trait: derive, Display, From, Add"
short: "Std Traits"
part: 5
order: 21
summary: "std-এর জনপ্রিয় trait-গুলো, মানে Debug, Clone, PartialEq, Display, From আর Add, নিজের type-এ কীভাবে লাগাবে।"
icon: "🧰"
minutes: 6
video: "TGcK37erIvA"
---

## কেন শিখবো?

নিজের `struct`-এ `{:?}` চলে না, `==` চলে না, কপিও হয় না, কারণ এগুলো সবই std-এর **trait**। বেশিরভাগ trait এক লাইনে পাওয়া যায়, আর `+`, `{}` বা `.into()` চালাতে একটা trait implement করলেই হয়।

## `derive`: এক লাইনে trait

`#[derive(...)]` লিখলে compiler নিজেই impl লিখে দেয়, তবে সব field-এও সেই trait থাকতে হবে।

- `Debug`: `{:?}` print। `Clone`: `.clone()`। `PartialEq`: `==`। `Default`: সব field-এর ডিফল্ট মান।
- `PartialOrd`/`Ord`: `<` আর `sort()`। struct-এর তুলনা field-এর ক্রমে হয়। `Hash`: `HashMap`-এর key হওয়া।

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

## `Display`: `{}` দিয়ে সুন্দর print

`Debug` programmer-এর জন্য, `Display` user-এর জন্য। এটা derive হয় না, নিজে লিখতে হয়। লিখলে `.to_string()` ফ্রি পাওয়া যায়।

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
}
```

```text
price: 250 BDT
```

## `From` আর `Into`

`impl From<A> for B` লিখলে `B::from(a)` চলে, আর `a.into()`-ও ফ্রি। `into()`-তে ফলাফলের type `let` লাইনে লিখে দিতে হয়।

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

`a + b` আসলে `a.add(b)`। `std::ops::Add` implement করলে নিজের type-এ `+` চলে। `type Output` হলো `+`-এর ফলাফলের type।

```rust
use std::ops::Add;

#[derive(Debug, Clone, Copy)]
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

struct-এর ওপরে `#[derive(Debug)]` যোগ করলেই ঠিক।

## নিজে করো

`Temp(i32)` tuple struct বানাও, `Debug`, `Clone`, `Copy`, `PartialEq`, `PartialOrd` derive করো। `Display` implement করো যাতে `Temp(25)` print হলে `25C` দেখায়। `Temp(25)` আর `Temp(30)` তুলনা করো।

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

- `#[derive(Debug, Clone, PartialEq, ...)]` এক লাইনে trait দেয়, সব field-এও trait থাকতে হবে।
- `Debug` হলো `{:?}`, `Display` হলো `{}` আর সেটা নিজে লিখতে হয়।
- `impl From<A> for B` লিখলে `.into()` ফ্রি।
- `impl Add` লিখলে নিজের type-এ `+` চলে।
