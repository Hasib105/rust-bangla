---
title: "Pattern: ডেটা ভেঙে দেখার ভাষা"
short: "Patterns"
part: 8
order: 29
summary: "pattern দিয়ে struct, tuple, enum, slice ভেঙে ভেতরের অংশ সরাসরি variable-এ নেওয়া যায়, শর্ত আর range-সহ।"
icon: "🧩"
minutes: 9
---

## কেন শিখবো?

অন্য ভাষায় একটা object-এর ভেতরের অংশ পেতে লিখতে হয় `p.x`, `p.y`, `arr[0]`, `arr[len-1]`, আর তার আগে আলাদা `if` দিয়ে দেখতে হয় এটা কোন ধরনের ডেটা।
Rust-এ **pattern** একসঙ্গে দুটো কাজ করে: ডেটার আকার মিলিয়ে দেখে, আর মিললে ভেতরের অংশগুলো variable-এ তুলে আনে। `match` তুমি আগেই দেখেছো। এখানে দেখবো pattern নিজে কতটা শক্তিশালী।

## Destructuring: ভেঙে নেওয়া

pattern শুধু `match`-এ নয়, `let`-এও চলে। tuple আর struct এভাবে ভাঙা যায়। struct-এ field-এর নামে variable বানানো হয়, আর `..` দিয়ে বাকিগুলো বাদ দেওয়া হয়।

```rust
struct Point {
    x: i32,
    y: i32,
    z: i32,
}

fn main() {
    let (a, b) = (1, "two");
    println!("{a} {b}");

    let p = Point { x: 3, y: -4, z: 9 };
    let Point { x, y, .. } = p; // ignore z
    println!("x = {x}, y = {y}");
}
```

```text
1 two
x = 3, y = -4
```

## enum-এর ভেতরের ডেটা আর guard

enum-এর variant-এর ভেতরের ডেটা pattern দিয়ে তুলে আনা যায়। `if` যোগ করলে এটাকে বলে **match guard**: pattern মিললেও শর্ত মিলতে হবে। আর `x @ pattern` দিয়ে মিলে যাওয়া মানটাকে একটা নাম দেওয়া যায়।

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
    println!("{}", describe(&Shape::Circle(2.5)));
    println!("{}", describe(&Shape::Rect { w: 4.0, h: 4.0 }));
    println!("{}", describe(&Shape::Rect { w: 2.0, h: 3.0 }));
}
```

```text
big circle 12
circle 2.5
square 4
rect 2x3
```

## Range আর `@`

সংখ্যা বা char-এর জন্য `1..=5` লেখা যায় (শেষ সংখ্যা সহ)। `|` দিয়ে একাধিক pattern জোড়া যায়। `@` দিয়ে range-এর মধ্যে মিললে সেই মানটা নামে পাওয়া যায়।

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
    println!("{}", classify(0));
    println!("{}", classify(7));
    println!("{}", classify(20));
    println!("{}", classify(99));
}
```

```text
zero
small 7
round
other
```

## Slice pattern

array বা slice-এর শুরু আর শেষ একসঙ্গে ধরা যায়। `..` মাঝের সব বাদ দেয়, আর `rest @ ..` মাঝেরগুলোকে একটা slice হিসেবে নামে ধরে।

```rust
fn show(v: &[i32]) {
    match v {
        [] => println!("empty"),
        [one] => println!("one: {one}"),
        [first, .., last] => println!("first {first}, last {last}"),
    }
}

fn main() {
    show(&[]);
    show(&[5]);
    show(&[1, 2, 3, 4]);

    if let [head, rest @ ..] = [10, 20, 30].as_slice() {
        println!("head {head}, rest {rest:?}");
    }
}
```

```text
empty
one: 5
first 1, last 4
head 10, rest [20, 30]
```

## `let else`: না মিললে বেরিয়ে যাও

`if let` মিললে একটা block চালায়। কিন্তু অনেক সময় "মিললে এগোও, না মিললে সঙ্গে সঙ্গে return করো" চাই। `let ... else` ঠিক এটাই করে, আর variable-টা পরের সব লাইনে পাওয়া যায়, নিচের দিকে একটা বাড়তি indentation ছাড়াই। `else` block-কে অবশ্যই বেরিয়ে যেতে হবে (`return`, `break`, `panic!`)।

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

সব সম্ভাবনা না ঢেকে `match` লেখা। compiler বলে দেয় কোনটা বাদ পড়েছে:

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

শেষে `_ => ...` যোগ করলেই বাকি সব ধরা পড়ে:

```rust
fn main() {
    let n: u8 = 7;
    let s = match n {
        0 => "zero",
        1..=9 => "small",
        _ => "big",
    };
    println!("{s}");
}
```

```text
small
```

## নিজে করো

একটা function `kind(t: (i32, i32)) -> &'static str` লেখো। tuple-এর দুই মান `(x, y)` হলে: দুটোই `0` হলে `"origin"`, শুধু `y` শূন্য হলে `"on x axis"`, শুধু `x` শূন্য হলে `"on y axis"`, বাকি সব হলে `"elsewhere"`। `(0, 0)`, `(3, 0)`, `(0, 5)`, `(1, 1)` দিয়ে পরীক্ষা করো।

<details>
<summary>সমাধান দেখো</summary>

`match` একটা tuple-কে সরাসরি ভেঙে দেখতে পারে। `0` literal pattern, আর `_` যেকোনো মান।

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

- pattern ডেটার আকার মেলায় আর ভেতরের অংশ variable-এ তোলে। `let`, `match`, `if let`, function parameter, সব জায়গায় চলে।
- `..` বাকি field বা element বাদ দেয়, `|` একাধিক pattern জোড়ে, `1..=5` range ধরে।
- guard (`if ...`) pattern-এর ওপর বাড়তি শর্ত বসায়, আর `name @ pattern` মান ধরে রাখে।
- slice pattern: `[first, .., last]`, `[head, rest @ ..]`।
- `let Some(x) = ... else { return ... };` মিললে এগোও, না মিললে বেরিয়ে যাও।
