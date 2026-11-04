---
title: "Trait: একই আচরণ, আলাদা type"
short: "Traits"
part: 5
order: 20
summary: "Trait হলো একটা চুক্তি: যে type এটা মানে, তার কী কী কাজ করতে পারা চাই সেটা আগে থেকেই ঠিক করা থাকে।"
icon: "🤝"
minutes: 10
video: "WCuLCHdLpAg"
---

## কেন শিখবো?

`Dog` আর `Cat` দুটোই ডাকতে পারে। তাহলে এমন একটা function লিখতে চাই, যে "ডাকতে পারে" এমন যেকোনো কিছু নেবে। Java-তে এর নাম `interface`, Python-এ duck typing।
Rust-এ এর নাম **trait**। trait বলে দেয় "এই type-এর কী কী method থাকতে হবে", আর generics-এর সাথে মিলে compile time-এই সব যাচাই করে ফেলে।

## Trait বানানো আর implement করা

`trait` দিয়ে method-এর নাম আর signature লিখি, ভেতরটা লিখি না। তারপর প্রতিটা type-এর জন্য `impl Trait for Type` লিখে ভেতরটা ভরি।

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

fn main() {
    println!("{}", Dog.speak());
    println!("{}", Cat.speak());
}
```

```text
Woof
Meow
```

## Default method

trait নিজেই কোনো method-এর একটা ডিফল্ট body দিতে পারে। যে type চায় সে সেটা বদলায়, না চাইলে ডিফল্টই চলে।

```rust
trait Greet {
    fn name(&self) -> String;

    fn greet(&self) -> String {
        format!("Hello, {}!", self.name())
    }
}

struct Student;
struct Teacher;

impl Greet for Student {
    fn name(&self) -> String {
        String::from("Rahim")
    }
}

impl Greet for Teacher {
    fn name(&self) -> String {
        String::from("Sir")
    }

    fn greet(&self) -> String {
        String::from("Good morning, class.")
    }
}

fn main() {
    println!("{}", Student.greet());
    println!("{}", Teacher.greet());
}
```

```text
Hello, Rahim!
Good morning, class.
```

`Student` শুধু `name` লিখেছে, `greet` ফ্রি পেয়েছে। `Teacher` নিজের `greet` লিখে ডিফল্টটা বদলে দিয়েছে।

## Trait bound: trait দিয়ে generic-কে সীমা দেওয়া

গত পাঠে দেখেছো `T: PartialOrd`। একইভাবে নিজের trait-ও bound হিসেবে দেওয়া যায়। তখন function যেকোনো type নেয়, যতক্ষণ সে trait-টা মানে।

```rust
trait Speak {
    fn speak(&self) -> String;
}

struct Dog;
struct Robot;

impl Speak for Dog {
    fn speak(&self) -> String {
        String::from("Woof")
    }
}

impl Speak for Robot {
    fn speak(&self) -> String {
        String::from("Beep")
    }
}

fn announce<T: Speak>(who: &T) {
    println!("It says: {}", who.speak());
}

fn main() {
    announce(&Dog);
    announce(&Robot);
}
```

```text
It says: Woof
It says: Beep
```

`<T: Speak>` লেখার আরেকটা ছোট রূপ আছে: `impl Trait`। parameter-এ লিখলে মানে একই, শুধু লেখা কম। আর return type-এ লিখলে বলা যায় "আমি এমন একটা কিছু ফেরত দেবো যে এই trait মানে", আসল নামটা না বলেই।

```rust
trait Speak {
    fn speak(&self) -> String;
}

struct Dog;

impl Speak for Dog {
    fn speak(&self) -> String {
        String::from("Woof")
    }
}

fn announce(who: &impl Speak) {
    println!("It says: {}", who.speak());
}

fn make_speaker() -> impl Speak {
    Dog
}

fn main() {
    let s = make_speaker();
    announce(&s);
}
```

```text
It says: Woof
```

bound বেশি হলে `<T: A + B, U: C>` লম্বা হয়ে যায়। তখন `where` দিয়ে সাজিয়ে লেখা যায়। মানে একই, পড়তে সহজ।

```rust
use std::fmt::Debug;

fn show_both<T, U>(a: &T, b: &U) -> String
where
    T: Debug,
    U: Debug + Clone,
{
    format!("{:?} and {:?}", a, b.clone())
}

fn main() {
    println!("{}", show_both(&5, &"five"));
}
```

```text
5 and "five"
```

## সাধারণ ভুল

trait না মানা type দিয়ে function ডাকা:

```rust compile_fail
trait Speak {
    fn speak(&self) -> String;
}

struct Dog;
struct Rock;

impl Speak for Dog {
    fn speak(&self) -> String {
        String::from("Woof")
    }
}

fn announce<T: Speak>(who: &T) {
    println!("{}", who.speak());
}

fn main() {
    announce(&Dog);
    announce(&Rock); // error[E0277]: the trait bound `Rock: Speak` is not satisfied
}
```

`Rock` কখনো `Speak` implement করেনি। ঠিক করতে হলে `impl Speak for Rock` লেখো, নয়তো পাথরকে function-এ দিয়ো না।

## নিজে করো

`Area` নামে একটা trait বানাও, যার একটা method `area(&self) -> f64`। `Square { side: f64 }` আর `Rect { w: f64, h: f64 }` দুটোর জন্য implement করো। তারপর `print_area<T: Area>(shape: &T)` function লিখে দুটোকেই দিয়ে দেখো।

<details>
<summary>সমাধান দেখো</summary>

```rust
trait Area {
    fn area(&self) -> f64;
}

struct Square {
    side: f64,
}

struct Rect {
    w: f64,
    h: f64,
}

impl Area for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }
}

impl Area for Rect {
    fn area(&self) -> f64 {
        self.w * self.h
    }
}

fn print_area<T: Area>(shape: &T) {
    println!("area = {}", shape.area());
}

fn main() {
    print_area(&Square { side: 3.0 });
    print_area(&Rect { w: 2.0, h: 4.5 });
}
```

```text
area = 9
area = 9
```

</details>

## মনে রাখো

- `trait` method-এর চুক্তি লেখে, আর `impl Trait for Type` সেটা পূরণ করে।
- trait-এ default method থাকতে পারে, type চাইলে সেটা override করে।
- `fn f<T: Trait>(x: &T)` বা `fn f(x: &impl Trait)` দিয়ে বলা হয় "যে type এই trait মানে, শুধু সেটাই চলবে"।
- বেশি bound থাকলে `where` দিয়ে পড়তে সহজ করা যায়।
