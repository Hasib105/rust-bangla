---
title: "Hello, World আর println!"
short: "Hello World"
part: 1
order: 2
summary: "fn main হলো শুরু, println! একটা macro। {} দিয়ে value বসানো আর output সাজানো শেখো।"
icon: "👋"
minutes: 7
video: "HT3Xj6s_Pus"
---

## কেন শিখবো?

কোনো program কী করছে দেখার সবচেয়ে সহজ উপায় হলো কিছু print করা। debug করার সময়ও তুমি সবচেয়ে বেশি এটাই ব্যবহার করবে।
Python-এ `print(f"...")` লিখলেই চলে, কিন্তু Rust-এ format করার নিজস্ব নিয়ম আছে। সেটা একবার শিখে নিলে সংখ্যা, লেখা, struct সবই সুন্দর করে দেখানো যায়।

## fn main: program-এর শুরু

প্রতিটা Rust program `main` function থেকে শুরু হয়। `{ }`-এর ভেতরের লাইনগুলো ওপর থেকে নিচে একটা একটা করে চলে।

```rust
fn main() {
    println!("Hello, Rust!");
}
```

```text
Hello, Rust!
```

লক্ষ্য করো, `println!`-এর শেষে একটা `!` আছে। এর মানে এটা সাধারণ function নয়, একটা **macro**। macro compile-এর সময় কোড বানিয়ে দেয়, তাই `{}`-এর মতো জিনিস আগেই ঠিক আছে কিনা যাচাই করতে পারে।
আর প্রতিটা statement শেষ হয় `;` দিয়ে।

## {} দিয়ে value বসানো

`{}` একটা ফাঁকা জায়গা। macro সেখানে পরের argument-গুলো ক্রমানুযায়ী বসায়। নতুন নিয়মে variable-এর নাম সরাসরি `{name}` লিখলেও হয়।

```rust
fn main() {
    let name = "Rahim";
    let age = 20;
    println!("Name: {}, Age: {}", name, age);
    println!("Name: {name}, Age: {age}");
}
```

```text
Name: Rahim, Age: 20
Name: Rahim, Age: 20
```

দ্বিতীয় লাইনটা ছোট আর পড়তে সহজ, তাই সাধারণত এটাই লেখা হয়।
আসল `{` বা `}` print করতে চাইলে দুবার লেখো: `{{` আর `}}`।

## {:?}: debug দেখা

`{}` শুধু সেই type-এর জন্য কাজ করে যাদের "সুন্দর করে দেখানোর" নিয়ম আছে, যেমন সংখ্যা আর লেখা। tuple বা vector-এর মতো জিনিস দেখতে চাইলে `{:?}` (debug format) লাগে।

```rust
fn main() {
    let point = (3, 4);
    let nums = vec![1, 2, 3];
    println!("{:?}", point);
    println!("{nums:?}");
    println!("{:?}", "hi");
}
```

```text
(3, 4)
[1, 2, 3]
"hi"
```

দেখো, লেখার ক্ষেত্রে `{:?}` quote সহ দেখায়। কোনো value-র ভেতরে কী আছে ঠিক জানতে এটা খুব কাজে লাগে।

## {:.2}, {:>5}: সাজিয়ে দেখানো

`:`-এর পরে লিখে output-এর চেহারা ঠিক করা যায়।

```rust
fn main() {
    let pi = 3.14159265;
    println!("{:.2}", pi);
    println!("[{:>5}]", 42);
    println!("[{:<5}]", 42);
    println!("[{:^5}]", 42);
    println!("[{:05}]", 42);
}
```

```text
3.14
[   42]
[42   ]
[ 42  ]
[00042]
```

- `{:.2}`: দশমিকের পরে ঠিক ২ ঘর।
- `{:>5}`: ৫ ঘর জায়গায় ডানে সরিয়ে।
- `{:<5}`: বাঁয়ে সরিয়ে।
- `{:^5}`: মাঝখানে।
- `{:05}`: ফাঁকা জায়গায় `0` বসিয়ে।

## print! আর comment

`print!` নতুন লাইনে যায় না, `println!` যায়। আর `//` দিয়ে লিখলে comment হয়, compiler সেটা পড়ে না।

```rust
fn main() {
    // a single-line comment
    print!("Loading");
    print!(".");
    print!(".");
    println!(" done");
    /* a block comment
       can span many lines */
    println!("{{}} prints braces");
}
```

```text
Loading.. done
{} prints braces
```

## সাধারণ ভুল

`{}` যতগুলো, argument তার চেয়ে কম দেওয়া:

```rust compile_fail
fn main() {
    println!("{} and {}", 1); // error: 2 positional arguments in format string, but there is 1 argument
}
```

macro compile-এর সময়ই গুনে দেখে, তাই ভুলটা program চালানোর আগেই ধরা পড়ে। argument-এর সংখ্যা `{}`-এর সংখ্যার সমান করলেই ঠিক।

## নিজে করো

`city` আর `temp` নামে দুটো variable বানাও: `city = "Dhaka"`, `temp = 31.456`। তারপর এক লাইনে print করো: `Dhaka: 31.46 C`। temp দুই দশমিক ঘরে দেখাতে হবে।

<details>
<summary>সমাধান দেখো</summary>

variable-এর নাম সরাসরি `{ }`-এর ভেতরে লেখা যায়, আর `:.2` পরে জুড়ে দিলেই দুই ঘর।

```rust
fn main() {
    let city = "Dhaka";
    let temp = 31.456;
    println!("{city}: {temp:.2} C");
}
```

```text
Dhaka: 31.46 C
```

</details>

## মনে রাখো

- `fn main()` হলো program-এর শুরু, আর `println!`-এর `!` মানে এটা macro।
- `{}` সাধারণ output, `{name}` variable-এর নাম সহ, `{:?}` debug।
- `{:.2}` দশমিক, `{:>5}` / `{:<5}` / `{:^5}` অবস্থান, `{:05}` শূন্য দিয়ে ভরা।
- `print!` নতুন লাইন দেয় না। comment লেখা হয় `//` বা `/* */` দিয়ে।
