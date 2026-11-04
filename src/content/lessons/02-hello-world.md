---
title: "Hello, World আর println!"
short: "Hello World"
part: 1
order: 2
summary: "fn main হলো শুরু, println! একটা macro। {} দিয়ে value বসানো আর output সাজানো শেখো।"
icon: "👋"
minutes: 5
video: "HT3Xj6s_Pus"
---

## কেন শিখবো?

program কী করছে দেখার সহজ উপায় হলো print করা। Rust-এ format করার নিজস্ব নিয়ম আছে, একবার শিখলে সংখ্যা, লেখা সবই সুন্দর করে দেখানো যায়।

## fn main আর println!

প্রতিটা Rust program `main` function থেকে শুরু হয়। `println!`-এর `!` মানে এটা সাধারণ function নয়, একটা **macro**। প্রতিটা statement শেষ হয় `;` দিয়ে।

```rust
fn main() {
    println!("Hello, Rust!");
}
```

```text
Hello, Rust!
```

## {} দিয়ে value বসানো

`{}` একটা ফাঁকা জায়গা, সেখানে argument ক্রমানুযায়ী বসে। variable-এর নাম সরাসরি `{name}` লিখলেও হয়। আসল `{` print করতে `{{` লেখো।

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

## {:?}: debug দেখা

tuple বা vector-এর মতো জিনিস দেখতে `{:?}` (debug format) লাগে। লেখা quote সহ দেখায়।

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

## সাজিয়ে দেখানো

`:`-এর পরে লিখে চেহারা ঠিক করা যায়: `.2` দশমিকের ২ ঘর, `>5` ডানে, `<5` বাঁয়ে, `^5` মাঝে, `05` শূন্য দিয়ে ভরা।

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

## print! আর comment

`print!` নতুন লাইনে যায় না, `println!` যায়। `//` দিয়ে comment লেখা হয়, `/* */` একাধিক লাইনের জন্য।

```rust
fn main() {
    // a comment
    print!("Loading");
    print!(".");
    println!(" done");
}
```

```text
Loading. done
```

## সাধারণ ভুল

`{}` যতগুলো, argument তার চেয়ে কম:

```rust compile_fail
fn main() {
    println!("{} and {}", 1); // error: 2 positional arguments, but there is 1 argument
}
```

macro compile-এর সময়ই গুনে দেখে। argument-এর সংখ্যা `{}`-এর সমান করলেই ঠিক।

## নিজে করো

`city = "Dhaka"` আর `temp = 31.456` নিয়ে এক লাইনে print করো: `Dhaka: 31.46 C`।

<details>
<summary>সমাধান দেখো</summary>

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

- `fn main()` program-এর শুরু, `println!`-এর `!` মানে macro।
- `{}` সাধারণ, `{name}` নাম সহ, `{:?}` debug।
- `{:.2}` দশমিক, `{:>5}` / `{:<5}` / `{:^5}` অবস্থান, `{:05}` শূন্য ভরা।
- `print!` নতুন লাইন দেয় না।
