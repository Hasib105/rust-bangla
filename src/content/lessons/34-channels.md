---
title: "Channels: thread-এর মধ্যে চিঠি পাঠানো"
short: "Channels"
part: 9
order: 34
summary: "`mpsc::channel` দিয়ে এক thread থেকে আরেক thread-এ message পাঠানো যায়। কোনো ডেটা share করতে হয় না।"
icon: "📬"
minutes: 5
---

## কেন শিখবো?

thread-গুলোকে প্রায়ই কথা বলতে হয়। **channel** দিয়ে এক thread চিঠি **পাঠায়**, আরেকটা **পায়**। মালিকানাও চলে যায়, তাই data race নেই।

## tx আর rx

`mpsc::channel()` দেয় `tx` (পাঠানোর মুখ) আর `rx` (পাওয়ার মুখ)। `mpsc` = অনেক producer, একজন consumer। `send` পাঠায়, `recv()` message আসা পর্যন্ত অপেক্ষা করে।

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        tx.send(String::from("hello from worker")).unwrap();
    });

    let msg = rx.recv().unwrap(); // blocks until a message arrives
    println!("got: {msg}");
}
```

```text
got: hello from worker
```

## rx দিয়ে loop

`for value in rx` সব `tx` drop হলে নিজে থামে। এখানে thread শেষ হলে `tx` drop হয়।

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        for i in 1..=3 {
            tx.send(i * 10).unwrap();
        }
    }); // tx dropped here

    for value in rx {
        println!("received {value}");
    }
    println!("channel closed");
}
```

```text
received 10
received 20
received 30
channel closed
```

## অনেক producer

প্রতিটা thread-এর জন্য `tx.clone()` নাও। **আসল `tx`-ও `drop` করো**, নয়তো `rx` অপেক্ষা করতেই থাকে। message-এর ক্রম ঠিক নেই, তাই `sort` করা হয়েছে।

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for id in 1..=3 {
        let tx = tx.clone();
        thread::spawn(move || {
            tx.send((id, id * 100)).unwrap();
        });
    }
    drop(tx); // close the original sender

    let mut results: Vec<(i32, i32)> = rx.iter().collect();
    results.sort();
    println!("{results:?}");
}
```

```text
[(1, 100), (2, 200), (3, 300)]
```

## সাধারণ ভুল

```rust compile_fail
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    let s = String::from("hi");
    tx.send(s).unwrap();
    println!("{s}"); // error[E0382]: borrow of moved value: `s`
    let _ = rx.recv();
}
```

`send` মালিকানা নিয়ে নেয়। পরেও লাগলে `s.clone()` পাঠাও।

## নিজে করো

তিনটা thread বানাও। thread `i` channel-এ `"worker i"` String পাঠাবে। main সব জমিয়ে sort করে print করবে।

<details>
<summary>সমাধান দেখো</summary>

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for i in 1..=3 {
        let tx = tx.clone();
        thread::spawn(move || {
            tx.send(format!("worker {i}")).unwrap();
        });
    }
    drop(tx);

    let mut msgs: Vec<String> = rx.iter().collect();
    msgs.sort();
    for m in msgs {
        println!("{m}");
    }
}
```

```text
worker 1
worker 2
worker 3
```

</details>

## মনে রাখো

- `send` পাঠায়, `recv` অপেক্ষা করে পায়; পাঠালে মালিকানা চলে যায়।
- অনেক producer-এর জন্য `tx.clone()` করো, আসল `tx` drop করো।
- সব sender drop হলে `for v in rx` থামে।
- message-এর ক্রম ঠিক নেই; লাগলে sort করো।
