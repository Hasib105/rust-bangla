---
title: "Trait object: runtime-এ বেছে নেওয়া"
short: "dyn Trait"
part: 5
order: 23
summary: "dyn Trait দিয়ে আলাদা আলাদা type একটাই Vec-এ রাখা যায়, আর কোন method চলবে তা runtime-এ ঠিক হয়।"
icon: "🎭"
minutes: 9
---

## কেন শিখবো?

Generics (`T: Shape`) দিয়ে একটা function সব type-এর জন্য লেখা যায়। কিন্তু একটা সমস্যা থেকে যায়: `Vec<T>`-তে সব element-এর type একই হতে হয়। তাহলে `Circle` আর `Square` একই Vec-এ রাখবো কীভাবে? GUI-র সব widget, game-এর সব enemy, এসব এক list-এ রাখতে চাইলে এই সমস্যাই আসে।
উত্তর হলো **trait object**: `dyn Trait`। এটা বলে "যেকোনো type, যে এই trait মানে, আসল type এখন জানি না।"

## `Box<dyn Shape>` দিয়ে এক Vec-এ আলাদা type

আগের পাঠের মতো trait বানাও। তারপর Vec-এর element-এর type লেখো `Box<dyn Shape>`। `Box` লাগে কারণ `Circle` আর `Square`-এর size আলাদা, আর Vec-এর সব element-এর size সমান হওয়া চাই। `Box` সবাইকে একই মাপের pointer বানিয়ে দেয় (`Box`-এর বিস্তারিত ২৭ নম্বর পাঠে)।

```rust
trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> String;
}

struct Circle {
    r: f64,
}

struct Square {
    side: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        3.0 * self.r * self.r
    }
    fn name(&self) -> String {
        String::from("circle")
    }
}

impl Shape for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }
    fn name(&self) -> String {
        String::from("square")
    }
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { r: 2.0 }),
        Box::new(Square { side: 3.0 }),
        Box::new(Circle { r: 1.0 }),
    ];
    for s in &shapes {
        println!("{} has area {}", s.name(), s.area());
    }
    let total: f64 = shapes.iter().map(|s| s.area()).sum();
    println!("total = {total}");
}
```

```text
circle has area 12
square has area 9
circle has area 3
total = 24
```

(এখানে `3.0` দিয়ে pi-এর মোটামুটি মান ধরা হয়েছে, যাতে output ছোট থাকে।)

loop-এ `s.area()` ডাকলে প্রতিটা element-এর নিজস্ব `area` চলে। এটা কীভাবে সম্ভব, সেটা পরের অংশে।

## Static dispatch বনাম dynamic dispatch

generic function `fn f<T: Shape>(x: &T)` compile time-এ প্রতিটা type-এর জন্য আলাদা কপি হয় (monomorphization)। কোন method ডাকা হবে, তা আগেই জানা থাকে। এটাকে বলে **static dispatch**। এটা দ্রুত, আর compiler inline-ও করতে পারে।

`dyn Shape` হলে কোন method ডাকতে হবে তা compile time-এ জানা যায় না। তাই প্রতিটা trait object-এ একটা বাড়তি pointer থাকে, যা একটা **vtable**-এর (method-এর ঠিকানার তালিকা) দিকে তাকায়। runtime-এ সেই তালিকা দেখে method খুঁজে চালানো হয়। এটাকে বলে **dynamic dispatch**। খরচ খুব সামান্য, কিন্তু inline করা যায় না।

```rust
trait Speak {
    fn speak(&self) -> String;
}

struct Dog;
struct Cat;

impl Speak for Dog {
    fn speak(&self) -> String {
        String::from("Woof")
    }
}

impl Speak for Cat {
    fn speak(&self) -> String {
        String::from("Meow")
    }
}

fn static_call<T: Speak>(x: &T) -> String {
    x.speak() // type known at compile time
}

fn dynamic_call(x: &dyn Speak) -> String {
    x.speak() // looked up in the vtable at run time
}

fn main() {
    println!("{}", static_call(&Dog));
    println!("{}", dynamic_call(&Cat));
}
```

```text
Woof
Meow
```

## কখন কোনটা?

- সব element একই type, আর গতি সবচেয়ে বেশি দরকার? **generics** (static)।
- এক collection-এ আলাদা আলাদা type মেশাতে হবে, বা type কী হবে তা runtime-এ ঠিক হয়? **`dyn Trait`**।
- type-এর তালিকা আগে থেকেই জানা আর ছোট? `enum` ও ভালো বিকল্প।

আর একটা নিয়ম: সব trait দিয়ে `dyn` বানানো যায় না। trait-কে **object safe** হতে হয়, মোটামুটি মানে method-এ generic parameter থাকবে না আর `Self` type ফেরত দেবে না।

## সাধারণ ভুল

`dyn Trait`-কে `Box` বা `&` ছাড়া সরাসরি ব্যবহার করা। compiler জানে না এর size কত।

```rust compile_fail
trait Shape {
    fn area(&self) -> f64;
}

struct Square {
    side: f64,
}

impl Shape for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }
}

fn main() {
    let shapes: Vec<dyn Shape> = Vec::new(); // error[E0277]: the size for values of type `dyn Shape` cannot be known
    println!("{}", shapes.len());
}
```

ঠিক করতে `Vec<Box<dyn Shape>>` লেখো। `Box` পিছনের জিনিসটাকে heap-এ রাখে, আর Vec শুধু নির্দিষ্ট মাপের pointer রাখে।

## নিজে করো

`Animal` trait বানাও (`fn sound(&self) -> String`)। `Cow` আর `Duck` দুটো struct তৈরি করে implement করো (`"Moo"` আর `"Quack"`)। এরপর `Vec<Box<dyn Animal>>`-এ দুটোই রেখে loop চালিয়ে সব sound print করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
trait Animal {
    fn sound(&self) -> String;
}

struct Cow;
struct Duck;

impl Animal for Cow {
    fn sound(&self) -> String {
        String::from("Moo")
    }
}

impl Animal for Duck {
    fn sound(&self) -> String {
        String::from("Quack")
    }
}

fn main() {
    let farm: Vec<Box<dyn Animal>> = vec![Box::new(Cow), Box::new(Duck)];
    for a in &farm {
        println!("{}", a.sound());
    }
}
```

```text
Moo
Quack
```

</details>

## মনে রাখো

- `Box<dyn Trait>` দিয়ে এক collection-এ আলাদা আলাদা type রাখা যায়।
- generics হলো static dispatch: compile time-এ ঠিক, দ্রুত। `dyn` হলো dynamic dispatch: vtable দেখে runtime-এ ঠিক, একটু বেশি নমনীয়।
- `dyn Trait`-এর size অজানা, তাই সবসময় `Box<dyn T>` বা `&dyn T` আকারে ব্যবহার করতে হয়।
- সব trait দিয়ে trait object হয় না: trait-কে object safe হতে হয়।
