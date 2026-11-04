---
title: "Pattern: ডেটা ভেঙে দেখার ভাষা"
short: "Patterns"
part: 8
order: 29
summary: "pattern দিয়ে struct, tuple, enum, slice ভেঙে ভেতরের অংশ সরাসরি variable-এ নেওয়া যায়, শর্ত আর range-সহ।"
icon: "🧩"
minutes: 5
---

## কেন শিখবো?

অন্য ভাষায় ভেতরের অংশ পেতে `p.x`, `arr[0]` লিখে আলাদা `if` দিয়ে ধরন দেখতে হয়। Rust-এর **pattern** একসঙ্গে আকার মেলায় আর ভেতরের অংশ variable-এ তোলে।

## Destructuring আর slice

`let`-এও pattern চলে। `..` বাকি অংশ বাদ দেয়। slice-এ `[first, .., last]` শুরু-শেষ ধরে, আর `rest @ ..` মাঝেরগুলো একটা slice হিসেবে নেয়।

```rust
struct Point {
    x: i32,
    y: i32,
    z: i32,
}

fn main() {
    let (a, b) = (1, "two");
    let Point { x, y, .. } = Point { x: 3, y: -4, z: 9 };
    println!("{a} {b} {x} {y}");

    if let [head, rest @ ..] = [10, 20, 30].as_slice() {
        println!("head {head}, rest {rest:?}");
    }
    let [first, .., last] = [1, 2, 3, 4];
    println!("{first} {last}");
}
```

```text
1 two 3 -4
head 10, rest [20, 30]
1 4
```

## enum আর guard

enum-এর ভেতরের ডেটা pattern দিয়ে তোলা যায়। `if` যোগ করলে **match guard**: pattern মিললেও শর্ত মিলতে হবে।

```rust
enum Shape {
    Circle(f64),
    Rect { w: f64, h: f64 },
}

fn describe(s: &Shape) -> String {
    match s {
        Shape::Circle(r) if *r > 10.0 => format!("big circle {r}"),
        Shape::Circle(r) => format!("circle {r}"),
        Shape::Rect { w, h } if w == h => format!("square {w}"),
        Shape::Rect { w, h } => format!("rect {w}x{h}"),
    }
}

fn main() {
    println!("{}", describe(&Shape::Circle(12.0)));
    println!("{}", describe(&Shape::Rect { w: 4.0, h: 4.0 }));
    println!("{}", describe(&Shape::Rect { w: 2.0, h: 3.0 }));
}
```

```text
big circle 12
square 4
rect 2x3
```

## Range, `|` আর `@`

`1..=9` শেষ সংখ্যা সহ range। `|` একাধিক pattern জোড়ে। `small @ 1..=9` মিলে যাওয়া মানটা নাম দেয়।

```rust
fn classify(n: u32) -> String {
    match n {
        0 => String::from("zero"),
        small @ 1..=9 => format!("small {small}"),
        10 | 20 | 30 => String::from("round"),
        _ => String::from("other"),
    }
}

fn main() {
    println!("{}", classify(7));
    println!("{}", classify(20));
    println!("{}", classify(99));
}
```

```text
small 7
round
other
```

## `let else`

"মিললে এগোও, না মিললে বেরিয়ে যাও" হলে `let ... else`। `else` block-কে অবশ্যই বেরোতে হয় (`return`, `break`, `panic!`)। variable পরের সব লাইনে পাওয়া যায়।

```rust
fn double_first(words: &[&str]) -> i32 {
    let Some(first) = words.first() else {
        return -1;
    };
    let Ok(n) = first.parse::<i32>() else {
        return -2;
    };
    n * 2
}

fn main() {
    println!("{}", double_first(&["21", "x"]));
    println!("{}", double_first(&["abc"]));
    println!("{}", double_first(&[]));
}
```

```text
42
-2
-1
```

## সাধারণ ভুল

সব সম্ভাবনা না ঢেকে `match` লেখা:

```rust compile_fail
fn main() {
    let n: u8 = 7;
    let s = match n {
        0 => "zero",
        1..=9 => "small",
    }; // error[E0004]: non-exhaustive patterns: `10_u8..=u8::MAX` not covered
    println!("{s}");
}
```

শেষে `_ => "big"` যোগ করলেই ঠিক।

## নিজে করো

`kind(t: (i32, i32)) -> &'static str` লেখো: দুটোই `0` হলে `"origin"`, শুধু `y` শূন্য হলে `"on x axis"`, শুধু `x` শূন্য হলে `"on y axis"`, নাহলে `"elsewhere"`। `(0, 0)`, `(3, 0)`, `(0, 5)`, `(1, 1)` দিয়ে পরীক্ষা করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
fn kind(t: (i32, i32)) -> &'static str {
    match t {
        (0, 0) => "origin",
        (_, 0) => "on x axis",
        (0, _) => "on y axis",
        _ => "elsewhere",
    }
}

fn main() {
    println!("{}", kind((0, 0)));
    println!("{}", kind((3, 0)));
    println!("{}", kind((0, 5)));
    println!("{}", kind((1, 1)));
}
```

```text
origin
on x axis
on y axis
elsewhere
```

</details>

## মনে রাখো

- pattern আকার মেলায় আর অংশ variable-এ তোলে: `let`, `match`, `if let` সব জায়গায়।
- `..` বাদ দেয়, `|` জোড়ে, `1..=5` range, `n @ pattern` মান ধরে, guard (`if`) বাড়তি শর্ত দেয়।
- slice pattern: `[first, .., last]`, `[head, rest @ ..]`।
- `let Some(x) = ... else { return ... };` মিললে এগোও, নাহলে বেরোও।
