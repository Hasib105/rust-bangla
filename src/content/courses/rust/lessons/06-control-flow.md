---
title: "Control flow: if, loop, while, for"
short: "Control flow"
part: 1
order: 6
summary: "if একটা expression, loop থেকে মান বের করা যায়, আর for দিয়ে range ও array ঘোরানো যায়।"
minutes: 5
---

## কেন শিখবো?

সিদ্ধান্ত নিতে `if`, কাজ বারবার করতে loop লাগে। Rust-এ `if` একটা মান দিতে পারে, আর `loop` থেকে মান বের করা যায়।

## if আর else

condition অবশ্যই `bool`, ব্র্যাকেট লাগে না। `if` একটা expression, তাই `let`-এর ডানে বসানো যায় (ternary লাগে না)। সব branch-এর type এক হতে হবে।

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

## loop আর while

`loop` চিরকাল চলে, `break value` দিলে থামে আর সেই মান `loop`-এর মান হয়। `while` শর্ত সত্য থাকা পর্যন্ত চলে।

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

    let mut n = 2;
    while n > 0 {
        println!("{n}...");
        n -= 1;
    }
}
```

```text
result = 50
2...
1...
```

## for আর range

`1..4` মানে ১, ২, ৩ (শেষটা বাদ), `1..=4` মানে ১ থেকে ৪। `.rev()` উল্টো দিকে চালায়। array সরাসরি `for`-এ দেওয়া যায়।

```rust
fn main() {
    for i in 1..4 {
        print!("{i} ");
    }
    println!();
    for i in (1..=3).rev() {
        print!("{i} ");
    }
    println!();
    for f in ["mango", "lychee"] {
        println!("I like {f}");
    }
}
```

```text
1 2 3 
3 2 1 
I like mango
I like lychee
```

## Labeled break

ভেতরের loop থেকে বাইরেরটা থামাতে loop-কে label (`'name:`) দাও।

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

condition-এ `bool`-এর বদলে সংখ্যা:

```rust compile_fail
fn main() {
    let x = 1;
    if x { // error[E0308]: expected `bool`, found integer
        println!("yes");
    }
}
```

Rust সংখ্যাকে true/false ধরে না। লেখো `if x == 1`।

## নিজে করো

১ থেকে ১০-এর জোড় সংখ্যাগুলোর যোগফল print করো।

<details>
<summary>সমাধান দেখো</summary>

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

- `if`-এর condition `bool` হতে হবে, আর `if` মান দিতে পারে।
- `loop` অসীম, `break value` দিয়ে মান বের হয়। `while` শর্ত থাকা পর্যন্ত।
- `a..b` শেষটা বাদ, `a..=b` শেষটাসহ, `.rev()` উল্টো।
- বাইরের loop থামাতে `'outer:` আর `break 'outer`।
