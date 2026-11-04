---
title: "Generics: একবার লেখো, সব type-এ চালাও"
short: "Generics"
part: 5
order: 19
summary: "Generic দিয়ে একই code বহু type-এর জন্য লেখা যায়, আর তাতে runtime-এ কোনো বাড়তি খরচ নেই।"
icon: "🧬"
minutes: 5
video: "iJdt33CrGR8"
---

## কেন শিখবো?

`i32` list-এর সবচেয়ে বড় সংখ্যার function `f64`-এর জন্য আবার কপি-পেস্ট করতে হলে bug-ও কপি হয়। Rust-এর **generics**-এ একটা code লিখলেই সব type-এ চলে, আর type-এর হিসাব হয় compile time-এই।

## Generic function

`<T>` মানে "যেকোনো একটা type, আপাতত নাম T"। শুধু `<T>` দিয়ে কিছু করা যায় না, কারণ compiler জানে না `T` কী পারে। তাই `T: PartialOrd + Copy` লিখে বলি, `T`-কে তুলনা আর কপি করা যেতে হবে। একে বলে **trait bound**।

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
}
```

```text
9
7.25
```

## Generic struct আর impl

struct-এর field-ও generic হয়। `Point<T>`-এ `x` আর `y` একই type `T`-র, তাই `Point { x: 1, y: 2.5 }` error দেয়। আলাদা type চাইলে `Point<T, U>` লেখো। method বানাতে `impl<T> Point<T>` লিখি, আর `impl Point<f64>` লিখলে method শুধু সেই type-এর জন্য হয়।

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

## Generics কি ধীর? না

compile করার সময় compiler দেখে কোন কোন type-এ function ডাকা হয়েছে, আর প্রতিটার জন্য আলাদা কপি বানায়। এটাকে বলে **monomorphization**। তাই generic code হাতে লেখা code-এর মতোই দ্রুত (zero cost abstraction)। দাম দিতে হয় compile time আর binary size দিয়ে, runtime দিয়ে নয়।

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

ঠিক করতে `<T: PartialOrd>` লেখো।

## নিজে করো

generic function `smallest` লেখো, যা slice থেকে সবচেয়ে ছোট item ফেরত দেবে। `[8, 3, 5]` আর `["pear", "apple", "fig"]` দুটোয় চালাও।

<details>
<summary>সমাধান দেখো</summary>

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

- `<T>` মানে "যেকোনো type"। `T` দিয়ে কিছু করতে trait bound লাগে, যেমন `T: PartialOrd + Copy`।
- struct আর `impl`-ও generic হয়: `Point<T>`, `impl<T> Point<T>`। `impl Point<f64>` শুধু f64-এর জন্য।
- Monomorphization-এর কারণে generic code-এর runtime খরচ নেই।
