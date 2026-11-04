---
title: "Generics: একবার লেখো, সব type-এ চালাও"
short: "Generics"
part: 5
order: 19
summary: "Generic দিয়ে একই code বহু type-এর জন্য লেখা যায়, আর তাতে runtime-এ কোনো বাড়তি খরচ নেই।"
icon: "🧬"
minutes: 9
video: "iJdt33CrGR8"
---

## কেন শিখবো?

ধরো `i32` list-এর সবচেয়ে বড় সংখ্যা বের করার function লিখলে। এবার `f64` বা `char`-এর জন্য লাগবে? আবার কপি-পেস্ট করতে হবে, আর একটায় bug থাকলে বাকিগুলোয়ও থাকবে।
Python-এ type দেখা হয় না, তাই একটাই function সব চালায়, কিন্তু ভুল type দিলে সেটা runtime-এ ধরা পড়ে। Rust-এর **generics** দুটোই দেয়: একটা code, আর compile time-এই type-এর হিসাব।

## Generic function

`<T>` মানে "যেকোনো একটা type, আপাতত তার নাম T"। শুধু `<T>` লিখলে `T` দিয়ে কিছুই করা যায় না, কারণ compiler জানে না `T` কী পারে। তাই `T: PartialOrd + Copy` লিখে বলে দিই, `T`-কে তুলনা করা আর কপি করা যেতে হবে। একে বলে **trait bound**।

```rust
fn largest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut max = items[0];
    for &item in items {
        if item > max {
            max = item;
        }
    }
    max
}

fn main() {
    println!("{}", largest(&[3, 9, 4]));
    println!("{}", largest(&[1.5, 0.2, 7.25]));
    println!("{}", largest(&['x', 'b', 'q']));
}
```

```text
9
7.25
x
```

একই function তিন রকম type-এ চলছে। Rust নিজেই `T` কী, তা argument দেখে বুঝে নেয়।

## Generic struct

struct-এর field-ও generic হতে পারে। `Point<T>` মানে `x` আর `y` দুটোই একই type `T`-র।

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let a = Point { x: 3, y: 4 };
    let b = Point { x: 1.5, y: 2.5 };
    println!("a = ({}, {})", a.x, a.y);
    println!("b = ({}, {})", b.x, b.y);
}
```

```text
a = (3, 4)
b = (1.5, 2.5)
```

`Point { x: 3, y: 2.5 }` লিখলে error আসবে, কারণ দুটো field-এর type এক হতে হবে। আলাদা type চাইলে `Point<T, U>` লেখো।

## Generic impl

`impl<T>` লিখে generic struct-এর method বানাই। আবার চাইলে শুধু একটা নির্দিষ্ট type-এর জন্যও method দেওয়া যায়।

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

impl Point<f64> {
    fn dist_from_origin(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
}

fn main() {
    let p = Point { x: 3.0, y: 4.0 };
    println!("x = {}", p.x());
    println!("dist = {}", p.dist_from_origin());
}
```

```text
x = 3
dist = 5
```

`x()` সব `Point<T>`-তে পাওয়া যায়। `dist_from_origin()` শুধু `Point<f64>`-এ আছে, `Point<i32>`-এ ডাকলে compile error হবে।

## Generics কি ধীর? না

অনেকে ভাবে generic মানে runtime-এ বাড়তি কাজ। Rust-এ তা নয়। compile করার সময় compiler দেখে কোন কোন type-এ function ডাকা হয়েছে, আর প্রতিটার জন্য আলাদা একটা কপি বানিয়ে নেয়। এটাকে বলে **monomorphization**।
মানে `largest(&[3, 9, 4])` আর `largest(&[1.5, 0.2])` আসলে দুটো আলাদা, হাতে লেখা function-এর মতোই দ্রুত। এটাই "zero cost abstraction"। দামটা দিতে হয় compile time আর binary size দিয়ে, runtime দিয়ে নয়।

## সাধারণ ভুল

bound ছাড়া `T`-কে তুলনা করা:

```rust compile_fail
fn largest<T>(items: &[T]) -> &T {
    let mut max = &items[0];
    for item in items {
        if item > max { // error[E0369]: binary operation `>` cannot be applied to type `&T`
            max = item;
        }
    }
    max
}

fn main() {
    println!("{}", largest(&[1, 2, 3]));
}
```

compiler বলে `T` তুলনা করা যায় কি না জানা নেই, আর সাহায্যও করে: `consider restricting type parameter T with trait PartialOrd`। ঠিক করতে `<T: PartialOrd>` লেখো।

## নিজে করো

একটা generic function `smallest` লেখো, যা slice থেকে সবচেয়ে ছোট item return করবে। তারপর `[8, 3, 5]` আর `["pear", "apple", "fig"]` দুটোয় চালাও। (`&str`-ও `PartialOrd` আর `Copy`।)

<details>
<summary>সমাধান দেখো</summary>

শুধু `>` কে `<` করলেই হলো। `&str` তুলনা করলে অভিধানের ক্রমে হয়।

```rust
fn smallest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut min = items[0];
    for &item in items {
        if item < min {
            min = item;
        }
    }
    min
}

fn main() {
    println!("{}", smallest(&[8, 3, 5]));
    println!("{}", smallest(&["pear", "apple", "fig"]));
}
```

```text
3
apple
```

</details>

## মনে রাখো

- `<T>` মানে "যেকোনো type"। `T` দিয়ে কিছু করতে হলে trait bound লাগে, যেমন `T: PartialOrd + Copy`।
- struct আর `impl`-ও generic হয়: `Point<T>`, `impl<T> Point<T>`।
- `impl Point<f64>` লিখলে method শুধু সেই নির্দিষ্ট type-এর জন্য হয়।
- Monomorphization-এর কারণে generic code হাতে লেখা code-এর মতোই দ্রুত, runtime খরচ নেই।
