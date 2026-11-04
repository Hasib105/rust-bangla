---
title: "Option: null-এর বদলে নিরাপদ পথ"
short: "Option"
part: 3
order: 12
summary: "Rust-এ null নেই। value থাকতেও পারে, নাও পারে, এটা `Option<T>` দিয়ে type-এ লেখা হয়।"
minutes: 6
---

## কেন শিখবো?

`null` নিয়ে Java-র `NullPointerException` বা JS-এর `undefined` crash সবাই চেনে। Rust-এ null নেই। value না থাকার সম্ভাবনা type-এই লেখা থাকে (`Option<T>`), আর compiler সেটা সামলাতে বাধ্য করে।

## `Option<T>`: Some অথবা None

`Option` একটা সাধারণ enum: `Some(value)` মানে আছে, `None` মানে নেই। যে function ব্যর্থ হতে পারে, সে `Option` ফেরত দেয়। `Option<i32>` আর `i32` আলাদা type।

```rust
fn divide(a: i32, b: i32) -> Option<i32> {
    if b == 0 {
        None
    } else {
        Some(a / b)
    }
}

fn main() {
    println!("{:?}", divide(10, 2));
    println!("{:?}", divide(10, 0));
    match divide(9, 3) {
        Some(v) => println!("result = {v}"),
        None => println!("cannot divide"),
    }
}
```

```text
Some(5)
None
result = 3
```

## `unwrap_or` আর `map`

`unwrap_or(default)` `None` হলে default দেয়। `map(f)` `Some`-এর ভেতরে `f` চালায়, `None` থাকলে `None`-ই থাকে। `|n| n * 2` মানে "n নাও, n * 2 দাও" (closure, পরে আসছে)। `.get(i)` বাইরের index-এ panic না করে `None` দেয়।

```rust
fn main() {
    let nums = [10, 20, 30];
    println!("{}", nums.get(1).unwrap_or(&0));
    println!("{}", nums.get(9).unwrap_or(&0));
    println!("{:?}", nums.get(1).map(|n| n * 2));
    println!("{:?}", nums.get(9).map(|n| n * 2));
}
```

```text
20
0
Some(40)
None
```

## `and_then`: চেইন

একটা ধাপ নিজেই `Option` দিলে `and_then` লাগে। কোনো ধাপে `None` এলে বাকি ধাপ বাদ যায়।

```rust
fn half(n: i32) -> Option<i32> {
    if n % 2 == 0 { Some(n / 2) } else { None }
}

fn main() {
    println!("{:?}", Some(8).and_then(half).and_then(half));
    println!("{:?}", Some(6).and_then(half).and_then(half));
}
```

```text
Some(2)
None
```

## `let else` আর `?`

`let Some(n) = v else { ... }`: মিললে `n` পাওয়া যায়, না মিললে `else` ব্লককে `return` করতে হয়। আর `Option` ফেরত দেওয়া function-এ `?` লিখলে `Some` হলে value খুলে আসে, `None` হলে function সেখানেই `None` ফেরত দেয়।

```rust
fn show(v: Option<i32>) {
    let Some(n) = v else {
        println!("nothing to show");
        return;
    };
    println!("got {n}");
}

fn initial_upper(name: &str) -> Option<char> {
    let c = name.chars().next()?; // empty text: return None here
    Some(c.to_ascii_uppercase())
}

fn main() {
    show(Some(7));
    show(None);
    println!("{:?}", initial_upper("rust"));
    println!("{:?}", initial_upper(""));
}
```

```text
got 7
nothing to show
Some('R')
None
```

## সাধারণ ভুল

`Option<i32>`-কে সরাসরি `i32`-এর মতো ব্যবহার করা:

```rust compile_fail
fn main() {
    let x: Option<i32> = Some(5);
    let y = x + 1; // error[E0369]: cannot add `{integer}` to `Option<i32>`
    println!("{y}");
}
```

আগে ভেতরের value বের করো, যেমন `x.unwrap_or(0) + 1`। `.unwrap()` `None`-এ **panic** করে, তাই এড়িয়ে চলো।

## নিজে করো

`find_even(nums: &[i32]) -> Option<i32>` লেখো, যা প্রথম জোড় সংখ্যা `Some`-এ দেয়, না পেলে `None`। `[3, 5, 8, 9]` আর `[1, 3]` দিয়ে চালাও।

<details>
<summary>সমাধান দেখো</summary>

জোড় সংখ্যা পেলেই `return Some(n)`, loop শেষ হলে `None`।

```rust
fn find_even(nums: &[i32]) -> Option<i32> {
    for &n in nums {
        if n % 2 == 0 {
            return Some(n);
        }
    }
    None
}

fn main() {
    if let Some(n) = find_even(&[3, 5, 8, 9]) {
        println!("found {n}");
    }
    println!("{}", find_even(&[1, 3]).unwrap_or(-1));
}
```

```text
found 8
-1
```

</details>

## মনে রাখো

- Rust-এ null নেই। value থাকতে বা না থাকতে পারলে type `Option<T>`: `Some(v)` বা `None`।
- `Option<T>` আর `T` আলাদা type, তাই `None` ভুলে যাওয়ার উপায় নেই।
- ছোট কাজে `unwrap_or`, `map`, `and_then`। না পেলে বের হতে `let else`।
- `?` `None`-কে সঙ্গে সঙ্গে ফেরত দেয়। `unwrap()` `None`-এ panic করে।
