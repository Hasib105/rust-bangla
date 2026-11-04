---
title: "Iterator: একটা একটা করে এগোনো"
short: "Iterators"
part: 6
order: 26
summary: "iterator হলো এমন জিনিস যে একটা একটা করে item দেয়। map, filter, collect জুড়ে জুড়ে ডেটা বদলানো যায়, আর কাজ শুরু হয় শেষ মুহূর্তে।"
icon: "🔁"
minutes: 10
---

## কেন শিখবো?

C-style `for (i = 0; i < n; i++)` লুপে index ভুল হলে bug হয়, বা array-র বাইরে চলে যাওয়া যায়। Rust-এ বেশিরভাগ সময় index-ই লাগে না। collection-কে **iterator** বানাও, তারপর `map`, `filter`, `sum`-এর মতো ছোট ছোট ধাপ জুড়ে দাও।
কোড ছোট হয়, পড়তেও সহজ, আর দ্রুত চলে। compiler এগুলোকে হাতে লেখা লুপের মতোই দ্রুত machine code বানায়।

## Iterator আসলে কী

`Iterator` trait-এর মূল কাজ একটাই: `next()`। প্রতিবার ডাকলে `Some(item)` দেয়, আর item শেষ হলে `None`। `for` লুপ ভেতরে ভেতরে এই `next()`-ই ডাকে।

```rust
fn main() {
    let v = vec![10, 20];
    let mut it = v.iter();
    println!("{:?}", it.next());
    println!("{:?}", it.next());
    println!("{:?}", it.next());
}
```

```text
Some(10)
Some(20)
None
```

`it`-কে `mut` করতে হয়েছে, কারণ `next()` iterator-এর ভেতরের "এখন কোথায় আছি" অবস্থা বদলায়।

## তিন রকম: `iter`, `iter_mut`, `into_iter`

Vec থেকে iterator বানানোর তিনটা উপায় আছে, আর পার্থক্যটা ownership-এর:

- `iter()`: প্রতিটা item-এর `&T` দেয়। শুধু পড়া যায়।
- `iter_mut()`: প্রতিটা item-এর `&mut T` দেয়। জায়গায় বদলানো যায়।
- `into_iter()`: item-এর মালিকানাই দিয়ে দেয়। এরপর Vec আর থাকে না।

```rust
fn main() {
    let mut nums = vec![1, 2, 3];

    for n in nums.iter_mut() {
        *n *= 10; // change each item in place
    }
    for n in nums.iter() {
        print!("{n} ");
    }
    println!();

    let total: i32 = nums.into_iter().sum(); // nums is consumed
    println!("total = {total}");
}
```

```text
10 20 30 
total = 60
```

## Adapter জোড়া লাগানো

`map`, `filter`, `enumerate`, `zip`, `take`, `skip` হলো **adapter**। এরা একটা iterator নিয়ে আরেকটা iterator বানায়। শেষে `sum`, `fold` বা `collect` দিয়ে ফলাফল নেওয়া হয়।

```rust
fn main() {
    let nums = [1, 2, 3, 4, 5, 6];

    let even_squares: Vec<i32> = nums
        .iter()
        .filter(|&&n| n % 2 == 0)
        .map(|&n| n * n)
        .collect();
    println!("{even_squares:?}");

    let sum = nums.iter().fold(0, |acc, &n| acc + n);
    println!("sum = {sum}");

    let names = ["a", "b", "c"];
    for (i, name) in names.iter().enumerate().skip(1) {
        println!("{i}: {name}");
    }

    let pairs: Vec<(i32, char)> = nums.iter().copied().zip("xyz".chars()).collect();
    println!("{pairs:?}");
    let first_two: Vec<_> = nums.iter().take(2).collect();
    println!("{first_two:?}");
}
```

```text
[4, 16, 36]
sum = 21
1: b
2: c
[(1, 'x'), (2, 'y'), (3, 'z')]
[1, 2]
```

কয়েকটা কথা:
- `filter`-এ closure `&&i32` পায়, তাই `|&&n|`। একটু বিরক্তিকর, কিন্তু অভ্যাস হয়ে যায়।
- `fold(শুরু, |acc, item| ...)` সবকিছুকে একটা মানে গুটিয়ে আনে।
- `zip` দুটোর মধ্যে ছোটটা শেষ হলেই থামে। এখানে `"xyz"`-এ ৩টা, তাই ৩ জোড়া।
- `collect()` কী বানাবে তা বলে দিতে হয়, এখানে `Vec<...>` type লিখে।

## Iterator lazy

adapter লিখলেই কাজ হয় না। `map` শুধু একটা "পরিকল্পনা" বানায়। কেউ `next()` ডাকলে (যেমন `collect` বা `for` লুপ) তখনই আসল কাজ শুরু হয়।

```rust
fn main() {
    let v = vec![1, 2, 3];
    let lazy = v.iter().map(|n| {
        println!("mapping {n}");
        n * 2
    });
    println!("nothing printed yet");
    let out: Vec<i32> = lazy.collect();
    println!("{out:?}");
}
```

```text
nothing printed yet
mapping 1
mapping 2
mapping 3
[2, 4, 6]
```

এই laziness-এর কারণেই অসীম iterator নিয়েও কাজ করা যায়, যেমন `(1..).take(5)`।

## নিজের Iterator বানানো

শুধু `next` লিখলেই `map`, `filter`, `sum` সব বিনামূল্যে পাওয়া যায়। এখানে `Item` হলো যে type-এর value দেবে (associated type, আগের পাঠে দেখেছো)।

```rust
struct Countdown {
    n: u32,
}

impl Iterator for Countdown {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.n == 0 {
            None
        } else {
            let current = self.n;
            self.n -= 1;
            Some(current)
        }
    }
}

fn main() {
    let c = Countdown { n: 3 };
    let v: Vec<u32> = c.collect();
    println!("{v:?}");

    let total: u32 = Countdown { n: 4 }.map(|x| x * x).sum();
    println!("{total}");
}
```

```text
[3, 2, 1]
30
```

## সাধারণ ভুল

`collect()`-এ type না বলা, কারণ compiler জানে না কী বানাতে হবে:

```rust compile_fail
fn main() {
    let v = vec![1, 2, 3];
    let doubled = v.iter().map(|n| n * 2).collect(); // error[E0283]: type annotations needed
    println!("{doubled:?}");
}
```

ঠিক করতে type লিখে দাও: `let doubled: Vec<i32> = ...`, অথবা turbofish `collect::<Vec<i32>>()`।

```rust
fn main() {
    let v = vec![1, 2, 3];
    let doubled = v.iter().map(|n| n * 2).collect::<Vec<i32>>();
    println!("{doubled:?}");
}
```

```text
[2, 4, 6]
```

## নিজে করো

`1` থেকে `10` পর্যন্ত সংখ্যা থেকে শুধু **বিজোড়** সংখ্যাগুলো নাও, প্রতিটার ঘন (`n * n * n`) করো, আর সবগুলোর যোগফল print করো।

<details>
<summary>সমাধান দেখো</summary>

range `1..=10` নিজেই একটা iterator, তাই আলাদা Vec লাগে না। বিজোড় সংখ্যা: 1, 3, 5, 7, 9।

```rust
fn main() {
    let total: u32 = (1..=10)
        .filter(|n| n % 2 == 1)
        .map(|n| n * n * n)
        .sum();
    println!("{total}");
}
```

```text
1225
```

</details>

## মনে রাখো

- iterator মানে `next()` ডাকলে একটা করে `Some(item)`, শেষে `None`।
- `iter()` পড়ার জন্য `&T`, `iter_mut()` বদলানোর জন্য `&mut T`, `into_iter()` মালিকানা নিয়ে।
- `map`, `filter`, `zip` ইত্যাদি adapter lazy। `collect`, `sum`, `fold` বা `for` চালালে তবেই কাজ হয়।
- `collect()`-এর সময় target type লিখে দিতে হয়।
- নিজের struct-এ `next` লিখলেই সব adapter পেয়ে যাও।
