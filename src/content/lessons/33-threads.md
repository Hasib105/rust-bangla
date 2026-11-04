---
title: "Threads: একসাথে অনেক কাজ"
short: "Threads"
part: 9
order: 33
summary: "`thread::spawn` দিয়ে কাজ আলাদা thread-এ পাঠাও, আর `join` দিয়ে শেষ হওয়ার অপেক্ষা করো।"
icon: "🧵"
minutes: 5
---

## কেন শিখবো?

তোমার computer-এ অনেক CPU core, কিন্তু একটা thread-এ বাকিগুলো বসে থাকে।
Rust-এ ownership-এর নিয়মই thread-এর data race **compile-এর সময়ই** আটকে দেয়।

## spawn আর join

`thread::spawn` closure-কে নতুন thread-এ চালায় আর `JoinHandle` দেয়। `join()` thread শেষ হওয়া পর্যন্ত অপেক্ষা করে আর return value দেয়। `join` না করলে main শেষ হলেই thread মরে যায়।

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

thread কতক্ষণ বাঁচবে compiler জানে না, তাই বাইরের variable ধার নেওয়া যায় না। `move` closure variable-এর **মালিকানা** thread-এ নিয়ে যায়।

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

## অনেক thread

handle-গুলো `Vec`-এ রেখে ক্রমে `join` করলে ফল সবসময় একই ক্রমে আসে। thread panic করলে `join()` `Err` দেয়।

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

`thread::scope`-এর thread scope শেষের আগেই **join** হয়। তাই `move` ছাড়াই local variable **borrow** করা যায়।

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

ঠিক করতে `move ||` লেখো, অথবা `thread::scope` ব্যবহার করো।

## নিজে করো

১ থেকে ৫ পর্যন্ত প্রতিটা সংখ্যার জন্য একটা thread বানাও, যে factorial return করবে। ফলগুলো `Vec<u64>`-এ জমিয়ে print করো।

<details>
<summary>সমাধান দেখো</summary>

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

- `spawn` thread চালায়, `join()` অপেক্ষা করে আর ফল দেয়।
- thread-এর চলার ক্রম ঠিক নেই; ক্রম লাগলে ক্রমে `join` করো।
- বাইরের variable লাগলে `move` closure, নয়তো `thread::scope`।
- thread panic করলে `join()` থেকে `Err` আসে।
