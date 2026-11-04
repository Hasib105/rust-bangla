---
title: "Trait: একই আচরণ, আলাদা type"
short: "Traits"
part: 5
order: 20
summary: "Trait হলো একটা চুক্তি: যে type এটা মানে, তার কী কী কাজ করতে পারা চাই সেটা আগে থেকেই ঠিক করা থাকে।"
minutes: 5
---

## কেন শিখবো?

`Dog` আর `Cat` দুটোই ডাকতে পারে, তাহলে "ডাকতে পারে" এমন যেকোনো কিছু নেওয়া function চাই। Java-তে `interface`, Rust-এ **trait**। trait বলে দেয় "এই type-এর কী কী method থাকতে হবে"।

## Trait বানানো আর implement করা

`trait`-এ method-এর signature লিখি, ভেতরটা না। তারপর প্রতিটা type-এর জন্য `impl Trait for Type` লিখে ভরি।

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

trait কোনো method-এর ডিফল্ট body দিতে পারে। type চাইলে সেটা বদলায় (override), না চাইলে ডিফল্টই চলে।

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

## Trait bound

trait দিয়ে generic-কে সীমা দেওয়া যায়: function যেকোনো type নেয়, যতক্ষণ সে trait-টা মানে। `fn f(x: &impl Speak)` আর `fn f<T: Speak>(x: &T)` প্রায় একই মানে। bound বেশি হলে `where` দিয়ে সাজিয়ে লেখা যায়।

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

ঠিক করতে `impl Speak for Rock` লেখো।

## নিজে করো

`Area` trait বানাও (`area(&self) -> f64`)। `Square { side: f64 }` আর `Rect { w: f64, h: f64 }`-এর জন্য implement করো। `print_area<T: Area>(shape: &T)` লিখে দুটোকেই দাও।

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

- `trait` চুক্তি লেখে, `impl Trait for Type` সেটা পূরণ করে।
- trait-এ default method থাকতে পারে, type চাইলে override করে।
- `T: Trait` বা `&impl Trait` মানে "যে type এই trait মানে, শুধু সেটাই চলবে"। বেশি bound হলে `where`।
