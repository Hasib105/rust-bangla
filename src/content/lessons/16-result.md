---
title: "Result: ভুল হলে কী হবে"
short: "Result"
part: 4
order: 16
summary: "যে কাজ ব্যর্থ হতে পারে, Rust তার ফল রাখে Result-এ: Ok(মান) বা Err(কারণ)। ভুল সামলানো তখন compiler-এর চোখের সামনে থাকে।"
icon: "🛡️"
minutes: 9
video: "vha-Rf7YViU"
---

## কেন শিখবো?

file নেই, user সংখ্যার জায়গায় "abc" লিখেছে, network কেটে গেছে। ভুল হবেই।
C-তে function হয়তো `-1` ফেরত দেয়, আর কেউ সেটা চেক করতে ভুলে গেলে প্রোগ্রাম চুপচাপ ভুল পথে চলে। Java-তে exception ছোড়া হয়, কিন্তু function-এর signature দেখে বোঝা যায় না কোনটা কখন ছুঁড়বে।
Rust-এর পথ: ব্যর্থ হতে পারে এমন function সরাসরি লিখে দেয় সে `Result` ফেরত দেবে। ভুল সামলানো ছাড়া তুমি সফল মানটা হাতেই পাবে না।

## দুই ধরনের ভুল

- **অসামলানো ভুল** (bug): যেমন Vec-এর শেষ ছাড়িয়ে index করা। এর জন্য প্রোগ্রাম `panic!` করে থেমে যায়।
- **সামলানো যায় এমন ভুল**: যেমন file নেই বা input ভুল। এগুলোর জন্য `Result`, যাতে প্রোগ্রাম নিজে ঠিক করে নিতে পারে।

panic দেখতে এমন:

```rust ignore
fn main() {
    let v = vec![1, 2, 3];
    let i = 7;
    println!("{}", v[i]); // panics at runtime
}
```

```text
thread 'main' panicked at src/main.rs:4:21:
index out of bounds: the len is 3 but the index is 7
```

## Result<T, E>

`Result` আসলে একটা enum (লেসন ১১-র মতো), যার দুটো রূপ:

```rust ignore
enum Result<T, E> {
    Ok(T),  // success, carries the value
    Err(E), // failure, carries the reason
}
```

`T` হলো সফল মানের type, `E` হলো ভুলের type। সাধারণ ব্যবহার `match` দিয়ে দুই দিকই সামলানো:

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

## parse আর তার ভুল

`"42".parse::<i32>()` ফেরত দেয় `Result<i32, ParseIntError>`। text সংখ্যা না হলে `Err`। ভুলটা `{:?}` দিয়ে print করলে ধরন দেখা যায়, আর `{}` দিয়ে মানুষের পড়ার মতো বার্তা।

```rust
fn main() {
    println!("{:?}", "42".parse::<i32>());
    println!("{:?}", "".parse::<i32>());
    println!("{:?}", "99999999999".parse::<i32>());

    match "x1".parse::<i32>() {
        Ok(n) => println!("number {n}"),
        Err(e) => println!("bad input: {e}"),
    }
}
```

```text
Ok(42)
Err(ParseIntError { kind: Empty })
Err(ParseIntError { kind: PosOverflow })
bad input: invalid digit found in string
```

## unwrap, expect আর unwrap_or_else

প্রতিবার `match` লেখা বড় ব্যাপার। তাই shortcut আছে:

- `unwrap()`: `Ok` হলে মান দেয়, `Err` হলে **panic**। ছোট পরীক্ষার কোডে চলে, আসল প্রোগ্রামে সাবধান।
- `expect("বার্তা")`: `unwrap`-এর মতোই, কিন্তু panic-এ তোমার বার্তা দেখায়। কেন থামলো বুঝতে সুবিধা।
- `unwrap_or(default)`: `Err` হলে একটা ডিফল্ট মান দেয়।
- `unwrap_or_else(|e| ...)`: `Err` হলে একটা ছোট কোড চালিয়ে মান বানায়। `|e| ...` হলো closure (লেসন ২৫-এ বিস্তারিত), এখানে `e` হলো ভুলটা।

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

`unwrap` বা `expect` `Err`-এ পড়লে প্রোগ্রাম থেমে যায়:

```rust ignore
fn main() {
    let n: i32 = "abc".parse().expect("need a number");
    println!("{n}");
}
```

```text
thread 'main' panicked at src/main.rs:2:32:
need a number: ParseIntError { kind: InvalidDigit }
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

`n` একটা সংখ্যা নয়, সংখ্যা **থাকতেও পারে** এমন একটা মোড়ক। আগে `match`, `unwrap_or` বা `?` (পরের পাঠে) দিয়ে ভেতরের মান বের করো:

```rust
fn main() {
    let n = "5".parse::<i32>().unwrap_or(0);
    println!("{}", n + 1);
}
```

```text
6
```

## নিজে করো

`parse_age(text: &str) -> Result<u8, String>` লেখো। text trim করে `u8`-তে parse করবে। সংখ্যা না হলে `Err("not a number")`, সংখ্যা ১৫০-এর বেশি হলে `Err("too old")`, নইলে `Ok(age)`।
`main`-এ `"42"`, `"abc"`, `"200"` তিনটা দিয়ে চালাও আর `{:?}` দিয়ে print করো।

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

- bug হলে `panic!`, সামলানো যায় এমন ভুলের জন্য `Result<T, E>`।
- `Result` হলো enum: `Ok(মান)` অথবা `Err(কারণ)`। `match` দিয়ে দুটোই সামলাও।
- `parse::<T>()` text থেকে সংখ্যা বানায়, আর ব্যর্থ হলে `Err` দেয়।
- `unwrap`/`expect` ভুলে panic করে। `unwrap_or` ডিফল্ট দেয়, `unwrap_or_else` ডিফল্ট বানানোর কোড চালায়।
- `Result` সরাসরি সংখ্যার মতো ব্যবহার করা যায় না। আগে ভেতরের মান বের করতে হয়।
