---
title: "Result: ভুল হলে কী হবে"
short: "Result"
part: 4
order: 16
summary: "যে কাজ ব্যর্থ হতে পারে, Rust তার ফল রাখে Result-এ: Ok(মান) বা Err(কারণ)। ভুল সামলানো তখন compiler-এর চোখের সামনে থাকে।"
minutes: 6
---

## কেন শিখবো?

file নেই, input ভুল, network কেটে গেছে, ভুল হবেই। Rust-এ ব্যর্থ হতে পারে এমন function signature-এই বলে দেয় সে `Result` ফেরত দেবে, আর ভুল সামলানো ছাড়া সফল মান হাতে পাওয়া যায় না।

## `panic!` বনাম `Result`

bug হলে (যেমন Vec-এর বাইরে index) প্রোগ্রাম `panic!` করে থামে। সামলানো যায় এমন ভুলের (file নেই, input ভুল) জন্য `Result<T, E>`, একটা enum: `Ok(মান)` অথবা `Err(কারণ)`।

```rust
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("cannot divide by zero"))
    } else {
        Ok(a / b)
    }
}

fn main() {
    for (a, b) in [(10, 2), (1, 0)] {
        match divide(a, b) {
            Ok(q) => println!("{a} / {b} = {q}"),
            Err(msg) => println!("error: {msg}"),
        }
    }
}
```

```text
10 / 2 = 5
error: cannot divide by zero
```

## `parse` আর তার ভুল

`"42".parse::<i32>()` দেয় `Result<i32, ParseIntError>`। text সংখ্যা না হলে `Err`। `{:?}` ভুলের ধরন দেখায়, `{}` মানুষের পড়ার বার্তা।

```rust
fn main() {
    println!("{:?}", "42".parse::<i32>());
    println!("{:?}", "".parse::<i32>());

    match "x1".parse::<i32>() {
        Ok(n) => println!("number {n}"),
        Err(e) => println!("bad input: {e}"),
    }
}
```

```text
Ok(42)
Err(ParseIntError { kind: Empty })
bad input: invalid digit found in string
```

## `unwrap`, `expect`, `unwrap_or`

`unwrap()` আর `expect("বার্তা")` `Err`-এ **panic** করে, তাই আসল প্রোগ্রামে সাবধান। `unwrap_or(default)` `Err`-এ ডিফল্ট দেয়। `unwrap_or_else(|e| ...)` ডিফল্ট বানানোর কোড চালায় (closure, পরে আসছে)।

```rust
fn main() {
    let a: i32 = "7".parse().unwrap();
    let b: i32 = "oops".parse().unwrap_or(0);
    let c: i32 = "nope".parse().unwrap_or_else(|e| {
        println!("fallback because: {e}");
        -1
    });
    println!("{a} {b} {c}");
}
```

```text
fallback because: invalid digit found in string
7 0 -1
```

## সাধারণ ভুল

`Result`-কে সরাসরি সংখ্যার মতো ব্যবহার করা:

```rust compile_fail
fn main() {
    let n = "5".parse::<i32>();
    let m = n + 1; // error[E0369]: cannot add `{integer}` to `Result<i32, ParseIntError>`
    println!("{m}");
}
```

`n` সংখ্যা নয়, একটা মোড়ক। আগে `match` বা `unwrap_or` দিয়ে মান বের করো: `"5".parse::<i32>().unwrap_or(0) + 1`।

## নিজে করো

`parse_age(text: &str) -> Result<u8, String>` লেখো: trim করে `u8`-তে parse করবে। সংখ্যা না হলে `Err("not a number")`, ১৫০-এর বেশি হলে `Err("too old")`, নইলে `Ok(age)`। `"42"`, `"abc"`, `"200"` দিয়ে চালাও।

<details>
<summary>সমাধান দেখো</summary>

```rust
fn parse_age(text: &str) -> Result<u8, String> {
    match text.trim().parse::<u8>() {
        Ok(age) => {
            if age <= 150 {
                Ok(age)
            } else {
                Err(String::from("too old"))
            }
        }
        Err(_) => Err(String::from("not a number")),
    }
}

fn main() {
    for t in ["42", "abc", "200"] {
        println!("{:?}", parse_age(t));
    }
}
```

```text
Ok(42)
Err("not a number")
Err("too old")
```

</details>

## মনে রাখো

- bug হলে `panic!`, সামলানো যায় এমন ভুলে `Result<T, E>`: `Ok(মান)` বা `Err(কারণ)`।
- `parse::<T>()` ব্যর্থ হলে `Err` দেয়।
- `unwrap`/`expect` `Err`-এ panic করে। `unwrap_or` ডিফল্ট দেয়।
- `Result` সরাসরি সংখ্যার মতো চলে না, আগে মান বের করতে হয়।
