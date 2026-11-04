---
title: "Threads: একসাথে অনেক কাজ"
short: "Threads"
part: 9
order: 33
summary: "`thread::spawn` দিয়ে কাজ আলাদা thread-এ পাঠাও, আর `join` দিয়ে শেষ হওয়ার অপেক্ষা করো।"
icon: "🧵"
minutes: 9
---

## কেন শিখবো?

তোমার computer-এ একাধিক CPU core আছে। একটা thread দিয়ে program চালালে বাকি core-গুলো বসে থাকে।
**thread** হলো program-এর ভেতরে আলাদা একটা কাজের ধারা, যা অন্য thread-এর সাথে একসাথে চলতে পারে।
C বা C++-এ thread ব্যবহারে data race-এর ভয় থাকে। Rust-এ ownership আর borrow-এর নিয়মই সেই ভুলগুলো **compile-এর সময়ই** আটকে দেয়। একে বলে "fearless concurrency"।

## spawn আর join

`thread::spawn` একটা closure নেয় আর নতুন thread-এ চালায়। এটা একটা `JoinHandle` return করে। `handle.join()` ডাকলে main thread ওই thread শেষ হওয়া পর্যন্ত অপেক্ষা করে।
`join` ভুলে গেলে main শেষ হওয়ার সাথে সাথে বাকি thread-গুলোও মরে যায়।

thread-গুলো কোন ক্রমে চলবে তা ঠিক থাকে না। তাই আমরা output-এর ক্রম ঠিক রাখতে `join` করে তারপর print করবো।

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        let mut sum = 0;
        for i in 1..=10 {
            sum += i;
        }
        println!("worker done");
        sum
    });

    let result = handle.join().unwrap(); // wait for the thread
    println!("sum = {result}");
}
```

```text
worker done
sum = 55
```

## move closure

নতুন thread কতক্ষণ চলবে compiler জানে না। তাই thread-এ কোনো variable ধার (borrow) দেওয়া যায় না, কারণ main আগে শেষ হয়ে গেলে ধার করা জিনিস মুছে যেতে পারে।
সমাধান হলো `move` closure, যা variable-এর **মালিকানা** thread-এর ভেতরে নিয়ে যায়।

```rust
use std::thread;

fn main() {
    let words = vec!["alpha", "beta", "gamma"];

    let handle = thread::spawn(move || {
        // words is owned by this thread now
        words.len()
    });

    println!("count = {}", handle.join().unwrap());
}
```

```text
count = 3
```

`move`-এর পর `words` আর main-এ ব্যবহার করা যায় না, কারণ এটা move হয়ে গেছে।

## অনেক thread আর return value

একটা loop-এ অনেক thread বানিয়ে handle-গুলো `Vec`-এ রাখো। তারপর ক্রমানুসারে `join` করলে ফল সবসময় একই ক্রমে পাবে।
`join()` একটা `Result` দেয়: thread panic করলে `Err`, নয়তো `Ok(thread-এর return value)`।

```rust
use std::thread;

fn main() {
    let mut handles = Vec::new();
    for id in 1..=4 {
        handles.push(thread::spawn(move || id * id));
    }

    let squares: Vec<i32> = handles.into_iter().map(|h| h.join().unwrap()).collect();
    println!("{squares:?}");
}
```

```text
[1, 4, 9, 16]
```

## thread::scope

`move` লাগে কারণ spawn করা thread বাইরে বেঁচে থাকতে পারে। কিন্তু `thread::scope`-এ বানানো thread-গুলো scope শেষ হওয়ার আগেই **নিশ্চিতভাবে join** হয়ে যায়।
তাই এখানে `move` ছাড়াই local variable **borrow** করা যায়। বড় ডেটা ভাগ করে কাজ করানোর জন্য এটা দারুণ।

```rust
use std::thread;

fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6];
    let (left, right) = numbers.split_at(3);

    let (a, b) = thread::scope(|s| {
        let h1 = s.spawn(|| left.iter().sum::<i32>());
        let h2 = s.spawn(|| right.iter().sum::<i32>());
        (h1.join().unwrap(), h2.join().unwrap())
    });

    println!("left = {a}, right = {b}, total = {}", a + b);
    println!("numbers still ours: {}", numbers.len());
}
```

```text
left = 6, right = 15, total = 21
numbers still ours: 6
```

## সাধারণ ভুল

`move` ছাড়া `thread::spawn`-এ variable ব্যবহার করা:

```rust compile_fail
use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    let handle = thread::spawn(|| {
        println!("{v:?}"); // error[E0373]: closure may outlive the current function
    });
    handle.join().unwrap();
}
```

compiler বলে `closure may outlive the current function, but it borrows v`। ঠিক করতে `thread::spawn(move || { ... })` লেখো, অথবা `thread::scope` ব্যবহার করো।

## নিজে করো

১ থেকে ৫ পর্যন্ত প্রতিটা সংখ্যার জন্য একটা করে thread বানাও, যে নিজের সংখ্যার factorial (`n!`) return করবে। সব `join` করে ফলগুলো একটা `Vec<u64>`-এ জমিয়ে print করো।

<details>
<summary>সমাধান দেখো</summary>

`(1..=n).product()` দিয়ে factorial হয়। handle-গুলো ক্রমে join করছি বলে output সবসময় একই থাকে।

```rust
use std::thread;

fn main() {
    let handles: Vec<_> = (1..=5u64)
        .map(|n| thread::spawn(move || (1..=n).product::<u64>()))
        .collect();

    let results: Vec<u64> = handles.into_iter().map(|h| h.join().unwrap()).collect();
    println!("{results:?}");
}
```

```text
[1, 2, 6, 24, 120]
```

</details>

## মনে রাখো

- `thread::spawn(closure)` নতুন thread চালায় আর `JoinHandle` দেয়। `join()` অপেক্ষা করে আর return value দেয়।
- thread-এর চলার ক্রম ঠিক থাকে না। ক্রম লাগলে ফল জমিয়ে `join` করে তারপর print করো।
- `spawn`-এ বাইরের variable লাগলে `move` closure দরকার, কারণ thread বাইরের scope-এর চেয়ে বেশি বাঁচতে পারে।
- `thread::scope`-এ thread আগেই join হয়, তাই `move` ছাড়া borrow করা যায়।
- thread panic করলে `join()` থেকে `Err` আসে, বাকি program চলতে থাকে।
