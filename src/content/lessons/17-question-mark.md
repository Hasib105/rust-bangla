---
title: "? অপারেটর আর নিজের Error"
short: "? আর Error"
part: 4
order: 17
summary: "? এক অক্ষরে বলে দেয়: ভুল হলে এখনই caller-কে ফেরত দাও। সাথে শিখবে নিজের error type বানানো আর Box<dyn Error>।"
icon: "❓"
minutes: 10
video: "MSutitfIUOI"
---

## কেন শিখবো?

গত পাঠে দেখলে প্রতিটা `Result`-এর জন্য `match` লিখতে হয়। তিনটা কাজ পরপর করলে তিনটা `match` বসে যায়, আর আসল কাজ চাপা পড়ে।
Go-তে এই জন্য `if err != nil { return err }` বারবার লিখতে হয়। Rust-এ তার জায়গায় আছে শুধু একটা **`?`**।
আর অনেক ধরনের ভুল এক function-এ আসলে কী করবে? তার জন্য নিজের error type বানানো শিখবো।

## ? কী করে

`expr?` মানে: `Ok(v)` হলে `v` বের করে নাও, আর `Err(e)` হলে **এখনই function থেকে** সেই `Err` ফেরত দিয়ে চলে যাও।
নিচের দুটো function হুবহু একই কাজ করে:

```rust
use std::num::ParseIntError;

fn add_long(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let x = match a.parse::<i32>() {
        Ok(v) => v,
        Err(e) => return Err(e),
    };
    let y = match b.parse::<i32>() {
        Ok(v) => v,
        Err(e) => return Err(e),
    };
    Ok(x + y)
}

fn add_short(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let x = a.parse::<i32>()?;
    let y = b.parse::<i32>()?;
    Ok(x + y)
}

fn main() {
    println!("{:?} {:?}", add_long("2", "3"), add_short("2", "3"));
    println!("{:?}", add_short("2", "x"));
}
```

```text
Ok(5) Ok(5)
Err(ParseIntError { kind: InvalidDigit })
```

`?` শুধু এমন function-এ চলে যার নিজের return type-ও `Result` (বা `Option`)।

## নিজের error enum আর Display

`ParseIntError` একটা নির্দিষ্ট ভুল। কিন্তু তোমার function-এ হয়তো কয়েক ধরনের ভুল আসে: খালি input, সংখ্যা নয়, ঋণাত্মক। সেগুলো একটা `enum`-এ রাখো, তাহলে `match` করে প্রতিটা আলাদা সামলানো যায়।
user-কে সুন্দর বার্তা দেখাতে `Display` লাগে। `impl fmt::Display for ...` লিখলে `{}` দিয়ে print করা যায়। (`trait` আর `impl ... for` লেসন ২০-তে বিস্তারিত। এখন ছকটা মুখস্থ রাখলেই চলবে।)

```rust
use std::fmt;

enum AppError {
    Empty,
    NotNumber,
    Negative(i32),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Empty => write!(f, "input is empty"),
            AppError::NotNumber => write!(f, "not a number"),
            AppError::Negative(n) => write!(f, "{n} is negative"),
        }
    }
}

fn check(text: &str) -> Result<i32, AppError> {
    if text.is_empty() {
        return Err(AppError::Empty);
    }
    let n = text.parse::<i32>().map_err(|_| AppError::NotNumber)?;
    if n < 0 {
        return Err(AppError::Negative(n));
    }
    Ok(n)
}

fn main() {
    for t in ["10", "", "abc", "-4"] {
        match check(t) {
            Ok(n) => println!("ok {n}"),
            Err(e) => println!("error: {e}"),
        }
    }
}
```

```text
ok 10
error: input is empty
error: not a number
error: -4 is negative
```

এখানে `map_err(|_| ...)` ভুলের ধরন বদলে দেয়: `ParseIntError` থেকে আমাদের `AppError::NotNumber`।

## From: ? নিজেই ভুল বদলে দেয়

`map_err` প্রতিবার লেখা বিরক্তিকর। `impl From<ParseIntError> for AppError` লিখে দিলে `?` নিজেই `ParseIntError`-কে `AppError`-এ বদলে নেয়।

```rust
use std::fmt;
use std::num::ParseIntError;

enum AppError {
    Parse(ParseIntError),
    TooBig(i32),
}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> AppError {
        AppError::Parse(e)
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Parse(e) => write!(f, "parse error: {e}"),
            AppError::TooBig(n) => write!(f, "{n} is too big"),
        }
    }
}

fn limited(text: &str) -> Result<i32, AppError> {
    let n: i32 = text.parse()?; // ParseIntError -> AppError via From
    if n > 100 {
        return Err(AppError::TooBig(n));
    }
    Ok(n)
}

fn main() {
    for t in ["50", "500", "five"] {
        match limited(t) {
            Ok(n) => println!("ok {n}"),
            Err(e) => println!("{e}"),
        }
    }
}
```

```text
ok 50
500 is too big
parse error: invalid digit found in string
```

## Box<dyn Error>: যেকোনো error

ছোট প্রোগ্রামে নিজের enum বানানো বাড়াবাড়ি মনে হতে পারে। তখন return type লেখো `Result<T, Box<dyn Error>>`। এর মানে "যেকোনো ধরনের error", আর `?` যেকোনো std error-কে নিজে থেকে এতে ভরে দেয়। (`dyn` আর `Box` পরে বিস্তারিত আসবে।)
`"message".into()` দিয়ে সাধারণ লেখা থেকেও error বানানো যায়।

`main` নিজেও `Result` ফেরত দিতে পারে। `Ok(())` হলে প্রোগ্রাম স্বাভাবিকভাবে শেষ হয়, আর `Err` হলে ভুলটা print করে exit code 1 দিয়ে বের হয়।

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

`main`-এর ভেতরে `?` ব্যর্থ হলে `main` সেখানেই থেমে যায়। যেমন শেষে `println!("{}", run("ten", "2")?);` লিখলে stderr-এ আসে:

```text
Error: ParseIntError { kind: InvalidDigit }
```

> বড় প্রজেক্টে সবাই নিজে হাতে `Display` আর `From` লেখে না। library বানালে `thiserror` crate এই ছকগুলো derive করে দেয়, আর application বানালে `anyhow` crate `Box<dyn Error>`-এর আরামদায়ক রূপ দেয়। দুটোই পরে শিখলেই চলবে, আগে এই পাঠের ভিত্তিটা মজবুত করো।

## সাধারণ ভুল

যে function `Result` ফেরত দেয় না, তার ভেতরে `?` ব্যবহার করা। `main` ডিফল্টভাবে কিছুই ফেরত দেয় না (`()`), তাই:

```rust compile_fail
fn main() {
    let n: i32 = "5".parse()?; // error[E0277]: the `?` operator can only be used in a function that returns `Result` or `Option`
    println!("{n}");
}
```

`?` ভুল পেলে ফেরত দিতে চায়, কিন্তু ফেরত দেওয়ার জায়গা নেই। ঠিক করো `fn main() -> Result<(), Box<dyn std::error::Error>>` লিখে (শেষে `Ok(())` ভুলো না), অথবা `match`/`unwrap_or` দিয়ে সামলে নিয়ে।

## নিজে করো

`double(text: &str) -> Result<i32, ParseIntError>` লেখো। এটা text-কে সংখ্যায় বদলে দ্বিগুণ ফেরত দেবে, আর `?` ব্যবহার করবে।
`main`-এ `double("21")` আর `double("x")` চালিয়ে `{:?}` দিয়ে print করো।

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

- `expr?`: `Ok` হলে মান বের করে, `Err` হলে সাথে সাথে function থেকে সেই `Err` ফেরত দেয়।
- `?` শুধু এমন function-এ চলে যার return type `Result` (বা `Option`)।
- নিজের error enum-এ `impl Display` দিলে `{}` দিয়ে সুন্দর বার্তা দেখানো যায়।
- `impl From<A> for MyError` থাকলে `?` নিজেই `A` ভুলকে `MyError`-এ বদলে নেয়।
- ছোট প্রোগ্রামে `Box<dyn Error>` সবচেয়ে সহজ। `main` চাইলে `Result` ফেরত দিতে পারে।
