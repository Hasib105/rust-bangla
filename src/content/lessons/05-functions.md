---
title: "Function: কোড ভাগ করে লেখা"
short: "Functions"
part: 1
order: 5
summary: "parameter-এর type লিখতে হয়, -> দিয়ে return type বলতে হয়। শেষে semicolon না দিলে সেটাই return value।"
icon: "🧩"
minutes: 8
video: "HQGSZ3TW6zI"
---

## কেন শিখবো?

একই কাজ বারবার লিখলে কোড বড় হয় আর ভুল বাড়ে। কাজটাকে একটা নাম দিয়ে function বানিয়ে নিলে যতবার দরকার ডাকা যায়।
Rust-এর function-এ একটা মজার নিয়ম আছে: `return` না লিখেও মান ফেরত দেওয়া যায়, শুধু শেষ লাইনে `;` বাদ দিলেই হয়। এটা বুঝলে Rust-এর অনেক কোড পড়া সহজ হবে।

## Function আর parameter

`fn` দিয়ে function বানাতে হয়। নাম `snake_case`। parameter-এর **type লিখতেই হবে**, compiler আন্দাজ করে না।

```rust
fn greet(name: &str, times: u32) {
    for _ in 0..times {
        println!("Hello, {name}!");
    }
}

fn main() {
    greet("Rahim", 2);
}
```

```text
Hello, Rahim!
Hello, Rahim!
```

`&str` হলো লেখার type। এটা নিয়ে পরে বিস্তারিত পাঠ আছে, এখন শুধু জেনে রাখো string literal এই type-এর। function `main`-এর আগে বা পরে, যেখানে খুশি লেখা যায়।

## Return value: ->

function কিছু ফেরত দিলে `->`-এর পরে তার type লিখতে হয়। আর শেষ লাইনে **`;` ছাড়া** একটা expression লিখলেই সেটা return হয়ে যায়।

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

এটাই এই পাঠের মূল ধারণা:

- **statement** কাজ করে, কিন্তু কোনো মান দেয় না। যেমন `let x = 5;`।
- **expression** একটা মান তৈরি করে। যেমন `5 + 1`, বা `add(3, 4)`।

শেষে `;` বসালে expression statement হয়ে যায়, তার মান ফেলে দেওয়া হয়। এমনকি `{ }` block-ও একটা expression, যার মান হলো শেষ expression।

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

ভেতরের block-এর শেষ লাইন `a * 2`-তে `;` নেই, তাই block-এর মান ৬, আর সেটা `y`-তে গেল।

## Early return

মাঝপথেই ফেরত দিতে চাইলে `return` লেখো। এটা সাধারণত কোনো শর্তে তাড়াতাড়ি বেরিয়ে যেতে কাজে লাগে।

```rust
fn safe_div(a: i32, b: i32) -> i32 {
    if b == 0 {
        return 0;
    }
    a / b
}

fn main() {
    println!("{}", safe_div(10, 2));
    println!("{}", safe_div(10, 0));
}
```

```text
5
0
```

এখানে `0` return করা শুধু উদাহরণ। ভুল ঘটলে আসল পথ কী, সেটা Result-এর পাঠে দেখবো। আর শেষ লাইনের `a / b`-তে `;` নেই, তাই সেটাই স্বাভাবিক return।

## সাধারণ ভুল

শেষ লাইনে ভুলে `;` দিয়ে ফেলা:

```rust compile_fail
fn add(a: i32, b: i32) -> i32 {
    a + b; // error[E0308]: mismatched types
}

fn main() {
    println!("{}", add(1, 2));
}
```

`;` দেওয়ায় function-টা কিছুই return করছে না (খালি `()`), কিন্তু `-> i32` বলেছে একটা সংখ্যা আসবে। compiler বলে `expected i32, found ()` আর `;` মুছে দিতে বলে। ঠিক করতে `;` তুলে দাও।

## নিজে করো

`square` নামে একটা function লেখো যা একটা `i32` নিয়ে তার বর্গ return করে। আর `is_even` নামে আরেকটা function লেখো যা `bool` return করে। `main`-এ `square(7)` আর `is_even(10)` print করো।

<details>
<summary>সমাধান দেখো</summary>

দুটো function-এরই শেষ লাইনে `;` নেই, তাই ওগুলোই return value। `%` দিয়ে ভাগশেষ বের করা হয়েছে।

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

- parameter-এর type সবসময় লিখতে হয়, return type লেখা হয় `->` দিয়ে।
- শেষ লাইনে `;` না থাকলে সেই expression-ই return value।
- statement মান দেয় না, expression মান দেয়। `{ }` block-ও একটা expression।
- মাঝপথে বের হতে `return` ব্যবহার করো।
- যে function কিছু return করে না, সে আসলে খালি `()` return করে।
