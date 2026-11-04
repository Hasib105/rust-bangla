---
title: "Iterator: একটা একটা করে এগোনো"
short: "Iterators"
part: 6
order: 26
summary: "iterator হলো এমন জিনিস যে একটা একটা করে item দেয়। map, filter, collect জুড়ে জুড়ে ডেটা বদলানো যায়, আর কাজ শুরু হয় শেষ মুহূর্তে।"
icon: "🔁"
minutes: 5
---

## কেন শিখবো?

index দিয়ে লুপ চালালে ভুল হয়, array-র বাইরে চলে যাওয়া যায়। Rust-এ collection-কে **iterator** বানিয়ে `map`, `filter`, `sum` জুড়ে দাও। কোড ছোট হয়, আর হাতে লেখা লুপের মতোই দ্রুত চলে।

## Iterator আসলে কী

`Iterator`-এর মূল কাজ `next()`। প্রতিবার `Some(item)` দেয়, শেষে `None`। `for` লুপ ভেতরে এটাই ডাকে। `next()` ভেতরের অবস্থা বদলায়, তাই `it` হয় `mut`।

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

## `iter`, `iter_mut`, `into_iter`

- `iter()`: `&T`, শুধু পড়া।
- `iter_mut()`: `&mut T`, জায়গায় বদলানো।
- `into_iter()`: মালিকানা দিয়ে দেয়, এরপর Vec থাকে না।

```rust
fn main() {
    let mut nums = vec![1, 2, 3];
    for n in nums.iter_mut() {
        *n *= 10;
    }
    let total: i32 = nums.into_iter().sum();
    println!("total = {total}");
}
```

```text
total = 60
```

## Adapter আর lazy

`map`, `filter`, `zip` হলো **adapter**: iterator নিয়ে আরেকটা iterator বানায়। এরা **lazy**, `collect`, `sum`, `fold` বা `for` চালালে তবেই কাজ হয়। `collect()`-এ কী বানাবে তা লিখে দিতে হয়। `zip` ছোটটা শেষ হলেই থামে।

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

    let pairs = [1, 2, 3].iter().zip(['x', 'y'].iter()).count();
    println!("pairs = {pairs}");
}
```

```text
nothing printed yet
mapping 1
mapping 2
mapping 3
[2, 4, 6]
pairs = 2
```

## নিজের Iterator

শুধু `next` লিখলেই `map`, `filter`, `sum` সব পাওয়া যায়। `Item` হলো যে type দেবে।

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
    let v: Vec<u32> = Countdown { n: 3 }.collect();
    println!("{v:?}");
}
```

```text
[3, 2, 1]
```

## সাধারণ ভুল

`collect()`-এ type না বলা:

```rust compile_fail
fn main() {
    let v = vec![1, 2, 3];
    let doubled = v.iter().map(|n| n * 2).collect(); // error[E0283]: type annotations needed
    println!("{doubled:?}");
}
```

ঠিক করতে `let doubled: Vec<i32> = ...` অথবা `collect::<Vec<i32>>()` লেখো।

## নিজে করো

`1` থেকে `10`-এর **বিজোড়** সংখ্যাগুলোর ঘন (`n * n * n`) করে সবগুলোর যোগফল print করো।

<details>
<summary>সমাধান দেখো</summary>

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

- iterator মানে `next()` ডাকলে `Some(item)`, শেষে `None`।
- `iter()` পড়ার, `iter_mut()` বদলানোর, `into_iter()` মালিকানা নিয়ে।
- adapter lazy: `collect`, `sum`, `fold` বা `for` চালালে তবেই কাজ হয়।
- `collect()`-এ target type দিতে হয়। নিজের struct-এ `next` লিখলেই সব adapter পাও।
