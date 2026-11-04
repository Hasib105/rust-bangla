---
title: "Control flow: if, loop, while, for"
short: "Control flow"
part: 1
order: 6
summary: "if একটা expression, loop থেকে মান বের করা যায়, আর for দিয়ে range ও array ঘোরানো যায়।"
icon: "🔀"
minutes: 8
video: "YbH6hqgsGss"
---

## কেন শিখবো?

program শুধু ওপর থেকে নিচে চললে কোনো কাজেরই হতো না। সিদ্ধান্ত নিতে হয় (`if`), আর কাজ বারবার করতে হয় (loop)।
Rust-এ এগুলোর কিছু আলাদা বৈশিষ্ট্য আছে: `if` একটা মান দিতে পারে, আর `loop` থেকে মান বের করে আনা যায়। তাই কোড ছোট আর পরিষ্কার হয়।

## if / else if / else

condition অবশ্যই `bool` হতে হবে, আর ব্র্যাকেট `( )` লাগে না।

```rust
fn main() {
    let marks = 72;
    if marks >= 80 {
        println!("A");
    } else if marks >= 60 {
        println!("B");
    } else {
        println!("C");
    }
}
```

```text
B
```

## if একটা expression

`if` একটা মান তৈরি করতে পারে, তাই `let`-এর ডানে বসানো যায়। এতে অন্য language-এর `? :` (ternary) লাগে না। শর্ত: সব branch-এর type এক হতে হবে।

```rust
fn main() {
    let n = 7;
    let kind = if n % 2 == 0 { "even" } else { "odd" };
    println!("{n} is {kind}");
}
```

```text
7 is odd
```

branch-গুলোর শেষে `;` নেই, কারণ ওগুলোই মান।

## loop আর break

`loop` চিরকাল চলে, `break` দিলে থামে। মজার ব্যাপার, `break`-এর সঙ্গে একটা মান দিলে সেটাই পুরো `loop`-এর মান হয়।

```rust
fn main() {
    let mut count = 0;
    let result = loop {
        count += 1;
        if count == 5 {
            break count * 10;
        }
    };
    println!("result = {result}");
}
```

```text
result = 50
```

## while

শর্ত সত্য থাকা পর্যন্ত `while` চলে। কতবার চলবে আগে থেকে জানা না থাকলে এটা ভালো।

```rust
fn main() {
    let mut n = 3;
    while n > 0 {
        println!("{n}...");
        n -= 1;
    }
    println!("liftoff!");
}
```

```text
3...
2...
1...
liftoff!
```

## for: range আর array

`for` সবচেয়ে বেশি ব্যবহৃত loop। `1..4` মানে ১, ২, ৩ (শেষটা বাদ), আর `1..=4` মানে ১ থেকে ৪ (শেষটাসহ)। `.rev()` উল্টো দিক থেকে চালায়।

```rust
fn main() {
    for i in 1..4 {
        print!("{i} ");
    }
    println!();
    for i in 1..=4 {
        print!("{i} ");
    }
    println!();
    for i in (1..=3).rev() {
        print!("{i} ");
    }
    println!();

    let fruits = ["mango", "jackfruit", "lychee"];
    for f in fruits {
        println!("I like {f}");
    }
}
```

```text
1 2 3 
1 2 3 4 
3 2 1 
I like mango
I like jackfruit
I like lychee
```

array সরাসরি `for`-এ দিলে এক এক করে element পাওয়া যায়, index সামলাতে হয় না। তাই `while` দিয়ে index বাড়ানোর চেয়ে `for` নিরাপদ, ভুল হওয়ার সুযোগ কম।

## Labeled break

loop-এর ভেতরে loop থাকলে সাধারণ `break` শুধু ভেতরেরটা থামায়। বাইরেরটা থামাতে loop-কে একটা label (`'name:`) দিতে হয়।

```rust
fn main() {
    'outer: for i in 1..=3 {
        for j in 1..=3 {
            if i * j == 4 {
                println!("found {i} x {j}");
                break 'outer;
            }
        }
    }
    println!("done");
}
```

```text
found 2 x 2
done
```

## সাধারণ ভুল

condition-এ `bool`-এর বদলে সংখ্যা দেওয়া (C বা Python-এর অভ্যাস):

```rust compile_fail
fn main() {
    let x = 1;
    if x { // error[E0308]: mismatched types, expected `bool`, found integer
        println!("yes");
    }
}
```

Rust নিজে থেকে সংখ্যাকে true/false ধরে না। ঠিক করে লেখো `if x == 1` বা `if x != 0`।

## নিজে করো

১ থেকে ১০ পর্যন্ত সংখ্যা ঘুরে শুধু জোড় সংখ্যাগুলোর যোগফল বের করো আর print করো।

<details>
<summary>সমাধান দেখো</summary>

`1..=10` শেষ সংখ্যা ১০ সহ ধরে। `mut` variable-এ যোগফল জমানো হয়েছে।

```rust
fn main() {
    let mut sum = 0;
    for n in 1..=10 {
        if n % 2 == 0 {
            sum += n;
        }
    }
    println!("sum = {sum}");
}
```

```text
sum = 30
```

</details>

## মনে রাখো

- `if`-এর condition অবশ্যই `bool`, আর `if` নিজেও একটা মান দিতে পারে।
- `loop` অসীম, `break value` দিয়ে মান বের হয়। `while` শর্ত থাকা পর্যন্ত চলে।
- `for i in a..b` শেষটা বাদ দেয়, `a..=b` শেষটাসহ। উল্টো দিকে যেতে `.rev()`।
- ভেতরের loop থেকে বাইরেরটা থামাতে label (`'outer:`) আর `break 'outer`।
