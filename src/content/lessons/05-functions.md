---
title: "Function: কোড ভাগ করে লেখা"
short: "Functions"
part: 1
order: 5
summary: "parameter-এর type লিখতে হয়, -> দিয়ে return type বলতে হয়। শেষে semicolon না দিলে সেটাই return value।"
icon: "🧩"
minutes: 4
video: "HQGSZ3TW6zI"
---

## কেন শিখবো?

একই কাজ বারবার না লিখে নাম দিয়ে function বানাও। Rust-এ `return` ছাড়াই মান ফেরত দেওয়া যায়: শেষ লাইনে `;` বাদ দিলেই হয়।

## Function আর return value

`fn` দিয়ে function বানাও। parameter-এর **type লিখতেই হবে**। কিছু ফেরত দিলে `->`-এর পরে type লেখো। শেষ লাইনে **`;` ছাড়া** expression-ই return value।

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    let sum = add(3, 4);
    println!("3 + 4 = {sum}");
}
```

```text
3 + 4 = 7
```

## Statement আর expression

**statement** কাজ করে, মান দেয় না (`let x = 5;`)। **expression** মান তৈরি করে (`5 + 1`)। `{ }` block-ও একটা expression, তার মান শেষ expression।

```rust
fn main() {
    let y = {
        let a = 3;
        a * 2
    };
    println!("y = {y}");
}
```

```text
y = 6
```

## Early return

মাঝপথে বের হতে `return` লেখো। যে function কিছু return করে না, সে আসলে খালি `()` return করে।

```rust
fn sign(n: i32) -> i32 {
    if n < 0 {
        return -1;
    }
    1
}

fn main() {
    println!("{} {}", sign(-5), sign(5));
}
```

```text
-1 1
```

## সাধারণ ভুল

শেষ লাইনে ভুলে `;` দেওয়া:

```rust compile_fail
fn add(a: i32, b: i32) -> i32 {
    a + b; // error[E0308]: expected i32, found ()
}

fn main() {
    println!("{}", add(1, 2));
}
```

`;` দিলে function `()` return করে, কিন্তু `-> i32` বলেছে সংখ্যা আসবে। `;` তুলে দাও।

## নিজে করো

`square(n: i32) -> i32` আর `is_even(n: i32) -> bool` লেখো। `main`-এ `square(7)` আর `is_even(10)` print করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
fn square(n: i32) -> i32 {
    n * n
}

fn is_even(n: i32) -> bool {
    n % 2 == 0
}

fn main() {
    println!("{}", square(7));
    println!("{}", is_even(10));
}
```

```text
49
true
```

</details>

## মনে রাখো

- parameter-এর type লিখতে হয়, return type `->` দিয়ে।
- শেষ লাইনে `;` না থাকলে সেটাই return value।
- statement মান দেয় না, expression দেয়।
- কিছু return না করলে function `()` return করে।
