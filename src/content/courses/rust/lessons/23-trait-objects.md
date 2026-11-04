---
title: "Trait object: runtime-এ বেছে নেওয়া"
short: "dyn Trait"
part: 5
order: 23
summary: "dyn Trait দিয়ে আলাদা আলাদা type একটাই Vec-এ রাখা যায়, আর কোন method চলবে তা runtime-এ ঠিক হয়।"
minutes: 5
---

## কেন শিখবো?

generics-এ `Vec<T>`-এর সব element একই type-এর হয়। তাহলে `Circle` আর `Square` এক Vec-এ রাখবো কীভাবে? উত্তর **trait object**: `dyn Trait`, মানে "যেকোনো type যে এই trait মানে, আসল type এখন জানি না"।

## `Box<dyn Shape>` দিয়ে এক Vec-এ আলাদা type

Vec-এর element-এর type লেখো `Box<dyn Shape>`। `Box` লাগে কারণ `Circle` আর `Square`-এর size আলাদা, আর `Box` সবাইকে একই মাপের pointer বানায়।

```rust
trait Shape {
    fn area(&self) -> f64;
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
}

impl Shape for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { r: 2.0 }),
        Box::new(Square { side: 3.0 }),
    ];
    for s in &shapes {
        println!("area {}", s.area());
    }
}
```

```text
area 12
area 9
```

## Static বনাম dynamic dispatch

generic `fn f<T: Shape>(x: &T)` compile time-এ প্রতিটা type-এর জন্য আলাদা কপি হয় (monomorphization), তাই কোন method চলবে আগেই জানা। এটা **static dispatch**, দ্রুত।
`dyn Shape`-এ প্রতিটা object-এ একটা বাড়তি pointer থাকে, যা **vtable**-এর (method-এর ঠিকানার তালিকা) দিকে তাকায়। runtime-এ সেই তালিকা দেখে method চলে। এটা **dynamic dispatch**।

- সব element একই type আর গতি দরকার? generics।
- এক collection-এ আলাদা type মেশাতে হবে? `dyn Trait`।

সব trait দিয়ে `dyn` হয় না: trait-কে **object safe** হতে হয়।

## সাধারণ ভুল

`dyn Trait`-কে `Box` বা `&` ছাড়া ব্যবহার করা, কারণ এর size অজানা:

```rust compile_fail
trait Shape {
    fn area(&self) -> f64;
}

fn main() {
    let shapes: Vec<dyn Shape> = Vec::new(); // error[E0277]: the size for values of type `dyn Shape` cannot be known
    println!("{}", shapes.len());
}
```

ঠিক করতে `Vec<Box<dyn Shape>>` লেখো।

## নিজে করো

`Animal` trait বানাও (`fn sound(&self) -> String`)। `Cow` আর `Duck` implement করো (`"Moo"`, `"Quack"`)। `Vec<Box<dyn Animal>>`-এ দুটোই রেখে loop-এ sound print করো।

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

- `Box<dyn Trait>` দিয়ে এক collection-এ আলাদা type রাখা যায়।
- generics হলো static dispatch (compile time, দ্রুত)। `dyn` হলো dynamic dispatch (vtable, runtime)।
- `dyn Trait`-এর size অজানা, তাই `Box<dyn T>` বা `&dyn T` লাগে।
- সব trait object safe নয়।
