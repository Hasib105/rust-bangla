---
title: "? অপারেটর আর নিজের Error"
short: "? আর Error"
part: 4
order: 17
summary: "? এক অক্ষরে বলে দেয়: ভুল হলে এখনই caller-কে ফেরত দাও। সাথে শিখবে নিজের error type বানানো আর Box<dyn Error>।"
minutes: 5
---

## কেন শিখবো?

প্রতিটা `Result`-এর জন্য `match` লিখলে আসল কাজ চাপা পড়ে যায়। Rust-এ তার জায়গায় আছে শুধু একটা **`?`**।

## ? কী করে

`expr?` মানে: `Ok(v)` হলে `v` বের করে নাও, আর `Err(e)` হলে **এখনই function থেকে** সেই `Err` ফেরত দিয়ে বের হও। `?` শুধু এমন function-এ চলে যার return type `Result` (বা `Option`)।

```rust
use std::num::ParseIntError;

fn add(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let x = a.parse::<i32>()?;
    let y = b.parse::<i32>()?;
    Ok(x + y)
}

fn main() {
    println!("{:?}", add("2", "3"));
    println!("{:?}", add("2", "x"));
}
```

```text
Ok(5)
Err(ParseIntError { kind: InvalidDigit })
```

## নিজের error আর Display

কয়েক ধরনের ভুল একটা `enum`-এ রাখো। `{}` দিয়ে সুন্দর বার্তা দেখাতে `impl fmt::Display` লাগে (`trait` পরের লেসনে, এখন ছকটা মনে রাখলেই চলবে)।

```rust
use std::fmt;

enum AppError {
    NotNumber,
    Negative(i32),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::NotNumber => write!(f, "not a number"),
            AppError::Negative(n) => write!(f, "{n} is negative"),
        }
    }
}

fn check(text: &str) -> Result<i32, AppError> {
    let n = text.parse::<i32>().map_err(|_| AppError::NotNumber)?;
    if n < 0 {
        return Err(AppError::Negative(n));
    }
    Ok(n)
}

fn main() {
    for t in ["10", "abc", "-4"] {
        match check(t) {
            Ok(n) => println!("ok {n}"),
            Err(e) => println!("error: {e}"),
        }
    }
}
```

```text
ok 10
error: not a number
error: -4 is negative
```

## From: ? নিজেই ভুল বদলে দেয়

`impl From<ParseIntError> for AppError` লিখে দিলে `map_err` ছাড়াই `?` নিজে `ParseIntError`-কে `AppError`-এ বদলে নেয়।

```rust
use std::num::ParseIntError;

enum AppError {
    Parse(ParseIntError),
}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> AppError {
        AppError::Parse(e)
    }
}

fn parse(text: &str) -> Result<i32, AppError> {
    let n: i32 = text.parse()?; // ParseIntError -> AppError via From
    Ok(n)
}

fn main() {
    match parse("five") {
        Ok(n) => println!("ok {n}"),
        Err(AppError::Parse(e)) => println!("parse error: {e}"),
    }
}
```

```text
parse error: invalid digit found in string
```

## Box<dyn Error>: যেকোনো error

ছোট প্রোগ্রামে return type লেখো `Result<T, Box<dyn Error>>`। এর মানে "যেকোনো error", আর `?` যেকোনো std error এতে ভরে দেয়। `"message".into()` দিয়ে লেখা থেকেও error বানানো যায়। `main` নিজেও `Result` ফেরত দিতে পারে, আর `Err` হলে ভুল print করে বের হয়ে যায়।

```rust
use std::error::Error;

fn run(a: &str, b: &str) -> Result<i32, Box<dyn Error>> {
    let x: i32 = a.parse()?;
    let y: i32 = b.parse()?;
    if y == 0 {
        return Err("cannot divide by zero".into());
    }
    Ok(x / y)
}

fn main() -> Result<(), Box<dyn Error>> {
    println!("{}", run("10", "2")?);
    match run("1", "0") {
        Ok(v) => println!("{v}"),
        Err(e) => println!("handled: {e}"),
    }
    Ok(())
}
```

```text
5
handled: cannot divide by zero
```

## সাধারণ ভুল

যে function `Result` ফেরত দেয় না, তার ভেতরে `?` ব্যবহার করা। `main` ডিফল্টে `()` ফেরত দেয়:

```rust compile_fail
fn main() {
    let n: i32 = "5".parse()?; // error[E0277]: the `?` operator can only be used in a function that returns `Result` or `Option`
    println!("{n}");
}
```

ঠিক করো `fn main() -> Result<(), Box<dyn std::error::Error>>` লিখে (শেষে `Ok(())` ভুলো না)।

## নিজে করো

`double(text: &str) -> Result<i32, ParseIntError>` লেখো, যা text-কে সংখ্যায় বদলে দ্বিগুণ ফেরত দেবে, আর `?` ব্যবহার করবে। `main`-এ `double("21")` আর `double("x")` `{:?}` দিয়ে print করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
use std::num::ParseIntError;

fn double(text: &str) -> Result<i32, ParseIntError> {
    let n = text.parse::<i32>()?;
    Ok(n * 2)
}

fn main() {
    println!("{:?}", double("21"));
    println!("{:?}", double("x"));
}
```

```text
Ok(42)
Err(ParseIntError { kind: InvalidDigit })
```

</details>

## মনে রাখো

- `expr?`: `Ok` হলে মান বের করে, `Err` হলে সাথে সাথে সেই `Err` ফেরত দেয়।
- `?` শুধু `Result` (বা `Option`) ফেরত দেওয়া function-এ চলে।
- নিজের error-এ `impl Display` দিলে `{}` চলে, আর `impl From<A>` দিলে `?` নিজেই `A`-কে বদলে নেয়।
- ছোট প্রোগ্রামে `Box<dyn Error>` সবচেয়ে সহজ।
