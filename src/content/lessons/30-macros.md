---
title: "Macro: কোড যে কোড লেখে"
short: "Macros"
part: 8
order: 30
summary: "macro_rules! দিয়ে এমন কোড লেখা যায় যা compile-এর আগে অন্য কোডে বদলে যায়, যেমন vec! আর println!।"
icon: "✨"
minutes: 9
---

## কেন শিখবো?

`println!("{a} {b}")` লেখার সময় তুমি যত খুশি argument দিতে পারো। কিন্তু সাধারণ function-এর argument সংখ্যা ঠিক করা থাকে। `vec![1, 2, 3]`, `println!`, `assert_eq!`, সবই **macro**।
macro compile-এর সময় তোমার লেখা ছোট একটা syntax-কে লম্বা আসল Rust কোডে বদলে দেয়। বারবার একই ধরনের কোড লিখতে হলে, বা এমন কিছু দরকার যা function দিয়ে হয় না, তখন macro কাজে লাগে।
সত্যি বলতে, বেশিরভাগ সময় function-ই যথেষ্ট। macro কম লেখো, বেশি ব্যবহার করো।

## প্রথম macro

`macro_rules!` দিয়ে macro বানাতে হয়। ভেতরে থাকে এক বা একাধিক নিয়ম: `(pattern) => { কোড }`। pattern-এর `$x:expr` মানে "এখানে একটা expression আসবে, তার নাম `$x`"।

```rust
macro_rules! square {
    ($x:expr) => {
        $x * $x
    };
}

fn main() {
    println!("{}", square!(4));
    println!("{}", square!(2 + 3));
}
```

```text
16
25
```

লক্ষ্য করো, `square!(2 + 3)`-এর উত্তর `25`, `11` নয়। কারণ `expr` একটা পুরো expression হিসেবে ধরা হয়, তাই `(2 + 3) * (2 + 3)` হয়।

## Designator: কী ধরনের অংশ আসবে

`:expr` হলো **designator**, যা বলে দেয় কোন ধরনের syntax মিলবে। দুটো সবচেয়ে বেশি কাজে লাগে:

- `expr`: যেকোনো expression (`5`, `a + b`, `foo()`)।
- `ident`: একটা নাম (variable, function বা struct-এর নাম)।

`ident` দিয়ে macro নতুন নামও বানাতে পারে। এটা function দিয়ে কখনো সম্ভব নয়।

```rust
macro_rules! make_getter {
    ($name:ident, $value:expr) => {
        fn $name() -> i32 {
            $value
        }
    };
}

make_getter!(answer, 42);
make_getter!(ten, 5 * 2);

fn main() {
    println!("{} {}", answer(), ten());
}
```

```text
42 10
```

macro-টা `fn answer() -> i32 { 42 }` লিখে দিয়েছে।

## Repetition: যত খুশি argument

`$( ... ),*` মানে "কমা দিয়ে আলাদা করা শূন্য বা তার বেশি বার"। pattern-এ যেভাবে লেখা, ভেতরের কোডেও একই `$( ... )*` দিয়ে প্রতিটার জন্য কোড বানানো হয়।

```rust
macro_rules! my_max {
    ($x:expr) => { $x };
    ($x:expr, $($rest:expr),+) => {
        {
            let a = $x;
            let b = my_max!($($rest),+);
            if a > b { a } else { b }
        }
    };
}

fn main() {
    println!("{}", my_max!(7));
    println!("{}", my_max!(3, 9, 4));
}
```

```text
7
9
```

এখানে macro নিজেকেই ডাকছে (recursion)। এক argument হলে সেটাই উত্তর, নইলে প্রথমটার সঙ্গে বাকিগুলোর সেরাটা তুলনা করা হয়।

## একটা `hashmap!{}` বানাই

`vec![...]` আছে, কিন্তু `HashMap`-এর জন্য std-তে এরকম macro নেই। নিজেই বানিয়ে নিই। `$key => $value` জোড়াগুলো repetition দিয়ে ধরা হয়, আর শেষের কমা ঐচ্ছিক রাখতে `$(,)?` লাগে।

```rust
macro_rules! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {
        {
            let mut map = std::collections::HashMap::new();
            $( map.insert($key, $value); )*
            map
        }
    };
}

fn main() {
    let ages = hashmap! {
        "Rina" => 30,
        "Karim" => 25,
    };
    let mut names: Vec<_> = ages.keys().collect();
    names.sort();
    for n in names {
        println!("{n} = {}", ages[n]);
    }
}
```

```text
Karim = 25
Rina = 30
```

## Function নাকি macro?

- **function** বেছে নাও যখন argument-এর সংখ্যা আর type নির্দিষ্ট। এর error message পরিষ্কার, debug করা সহজ।
- **macro** বেছে নাও যখন argument সংখ্যা বদলায় (`println!`), যখন নতুন নাম বা কোড-কাঠামো বানাতে হবে, বা একই ধরনের কোড বারবার লিখতে হবে।

macro-র দাম আছে: পড়া কঠিন, আর error message কখনো কখনো বোঝা মুশকিল। macro অবশ্যই ব্যবহারের **আগে** লিখতে হয়।

## Derive আর procedural macro (ধারণা)

`#[derive(Debug, Clone)]` দেখেছো? ওটাও একধরনের macro, যার নাম **procedural macro**। এটা `macro_rules!`-এর মতো pattern মেলায় না। এটা আসলে একটা আলাদা Rust প্রোগ্রাম, যা compile-এর সময় তোমার struct-এর কোড পড়ে নতুন কোড লিখে দেয়। তাই `derive` লিখলে `Debug` trait-এর পুরো impl নিজে নিজে তৈরি হয়ে যায়।
procedural macro বানানো আলাদা crate আর অনেক বেশি জ্ঞান চায়, তাই এখানে শুধু ধারণাটা জেনে রাখো। বাস্তবে তুমি আগে ব্যবহারকারী হবে, যেমন `serde`-এর `#[derive(Serialize)]`।

## সাধারণ ভুল

macro-র pattern-এর সঙ্গে না মেলে এমন argument দেওয়া:

```rust compile_fail
macro_rules! square {
    ($x:expr) => {
        $x * $x
    };
}

fn main() {
    println!("{}", square!()); // error: unexpected end of macro invocation
}
```

compiler বলে `missing tokens in macro arguments`, মানে macro একটা expression আশা করেছিল। argument দিলেই ঠিক হয়ে যায়:

```rust
macro_rules! square {
    ($x:expr) => {
        $x * $x
    };
}

fn main() {
    println!("{}", square!(6));
}
```

```text
36
```

## নিজে করো

`print_all!` নামে একটা macro লেখো, যেটা যত খুশি expression নেবে (কমা দিয়ে আলাদা) আর প্রতিটা আলাদা লাইনে `println!("{}", ...)` দিয়ে print করবে। `print_all!(1, "two", 3.5)` ডাকো।

<details>
<summary>সমাধান দেখো</summary>

repetition `$( ... ),*` pattern-এ প্রতিটা expression ধরে, আর ভেতরের কোডে `$( ... )*` দিয়ে প্রতিটার জন্য একটা `println!` বসে। `{}` সব type-এর জন্য চলে যেগুলোর `Display` আছে।

```rust
macro_rules! print_all {
    ($($x:expr),*) => {
        $( println!("{}", $x); )*
    };
}

fn main() {
    print_all!(1, "two", 3.5);
}
```

```text
1
two
3.5
```

</details>

## মনে রাখো

- `macro_rules! name { (pattern) => { code }; }` compile-এর সময় কোড বানায়। ব্যবহারের আগে লিখতে হয়।
- `$x:expr` যেকোনো expression ধরে, `$n:ident` একটা নাম ধরে। `$( ... ),*` যত খুশি বার পুনরাবৃত্তি করে।
- argument সংখ্যা বদলালে বা নতুন নাম বানাতে হলে macro। না হলে সাধারণ function ভালো।
- `#[derive(...)]` হলো procedural macro, যা compile-এর সময় struct দেখে impl লিখে দেয়। বানানো আলাদা বিষয়, ব্যবহার করা সহজ।
