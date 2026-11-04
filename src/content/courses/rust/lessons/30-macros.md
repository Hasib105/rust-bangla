---
title: "Macro: কোড যে কোড লেখে"
short: "Macros"
part: 8
order: 30
summary: "macro_rules! দিয়ে এমন কোড লেখা যায় যা compile-এর আগে অন্য কোডে বদলে যায়, যেমন vec! আর println!।"
minutes: 5
---

## কেন শিখবো?

`println!`, `vec![]`, `assert_eq!` সবই **macro**: তারা যত খুশি argument নেয়, যা function পারে না। macro compile-এর সময় ছোট syntax-কে লম্বা Rust কোডে বদলে দেয়। বেশিরভাগ সময় function-ই যথেষ্ট।

## প্রথম macro

`macro_rules!`-এর ভেতরে থাকে নিয়ম `(pattern) => { কোড }`। `$x:expr` মানে "এখানে একটা expression আসবে"। `expr` পুরো expression ধরে, তাই `square!(2 + 3)` হয় `(2 + 3) * (2 + 3)`।

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

## Designator: `expr` আর `ident`

`expr` যেকোনো expression ধরে। `ident` একটা নাম ধরে, তাই macro নতুন function বা struct-এর নাম বানাতে পারে, যা function দিয়ে অসম্ভব।

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

## Repetition

`$( ... ),*` মানে কমা দিয়ে আলাদা শূন্য বা বেশি বার। ভেতরের কোডেও `$( ... )*` লিখলে প্রতিটার জন্য কোড বসে।

```rust
macro_rules! my_vec {
    ($($x:expr),*) => {
        {
            let mut v = Vec::new();
            $( v.push($x); )*
            v
        }
    };
}

fn main() {
    let v = my_vec![1, 2, 3];
    println!("{v:?}");
}
```

```text
[1, 2, 3]
```

## Function নাকি macro, আর derive

argument নির্দিষ্ট হলে **function** নাও, এর error পরিষ্কার। argument সংখ্যা বদলালে বা নতুন নাম বানাতে হলে **macro**। macro ব্যবহারের আগে লিখতে হয়।
`#[derive(Debug)]` হলো **procedural macro**: compile-এর সময় struct দেখে `impl` লিখে দেয়। এটা বানানো আলাদা বিষয়, আগে ব্যবহার করতে শেখো।

## সাধারণ ভুল

pattern-এর সঙ্গে না মেলা argument দেওয়া:

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

macro একটা expression চেয়েছিল। argument দিলেই ঠিক: `square!(6)`।

## নিজে করো

`print_all!` macro লেখো, যেটা যত খুশি expression (কমা দিয়ে) নিয়ে প্রতিটা আলাদা লাইনে `println!("{}", ...)` করবে। `print_all!(1, "two", 3.5)` ডাকো।

<details>
<summary>সমাধান দেখো</summary>

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

- `macro_rules! name { (pattern) => { code }; }` compile-এর সময় কোড বানায়।
- `$x:expr` expression ধরে, `$n:ident` নাম ধরে, `$( ... ),*` পুনরাবৃত্তি করে।
- argument সংখ্যা বদলালে বা নতুন নাম বানাতে macro, নইলে function।
- `#[derive(...)]` হলো procedural macro।
