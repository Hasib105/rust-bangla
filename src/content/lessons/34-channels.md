---
title: "Channels: thread-এর মধ্যে চিঠি পাঠানো"
short: "Channels"
part: 9
order: 34
summary: "`mpsc::channel` দিয়ে এক thread থেকে আরেক thread-এ message পাঠানো যায়। কোনো ডেটা share করতে হয় না।"
icon: "📬"
minutes: 9
---

## কেন শিখবো?

thread-গুলোকে প্রায়ই একে অপরের সাথে কথা বলতে হয়: worker কাজ শেষ করে ফল জানাবে, main তা নিয়ে print করবে।
একই memory-তে সবাই হাত দিলে ঝামেলা হয়। Go ভাষার একটা বিখ্যাত কথা আছে: "memory share করে কথা বলো না, কথা বলে memory share করো।" Rust-এর **channel** ঠিক সেই কাজই করে।
এক thread চিঠি **পাঠায়**, আরেক thread সেটা **পায়**। চিঠি পাঠালে তার মালিকানাও চলে যায়, তাই data race-এর সুযোগ নেই।

## channel: tx আর rx

`mpsc::channel()` একজোড়া মুখ দেয়: `tx` (transmitter, পাঠানোর দিক) আর `rx` (receiver, পাওয়ার দিক)।
`mpsc` মানে **m**ultiple **p**roducer, **s**ingle **c**onsumer: অনেকে পাঠাতে পারে, কিন্তু পাওয়ার লোক একজন।

`tx.send(value)` পাঠায়। `rx.recv()` একটা message আসা পর্যন্ত অপেক্ষা করে আর `Ok(value)` দেয়।

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

`send` করার পর value-টা আর পাঠানোর thread-এর কাছে থাকে না, মালিকানা receiver-এর কাছে চলে যায়।

## rx দিয়ে loop

অনেকগুলো message এলে `rx`-কেই `for` loop-এ ব্যবহার করা যায়। সব `tx` drop হয়ে গেলে channel বন্ধ হয় আর loop নিজে থেকে থামে।
এখানে worker thread-এর ভেতরে `tx` থাকে, thread শেষ হলে সেটা drop হয়ে যায়।

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

`tx.clone()` করলে আরেকটা পাঠানোর মুখ পাওয়া যায়, যা একই `rx`-এ message ঢালে। প্রতিটা thread নিজের একটা clone নেয়।
**গুরুত্বপূর্ণ:** original `tx`-ও `drop` করতে হবে, নয়তো `rx` ভাবে এখনো কেউ পাঠাতে পারে, আর loop কখনো থামে না।

thread-গুলোর message কোন ক্রমে আসবে ঠিক নেই। তাই আগে সব জমিয়ে `sort` করে তারপর print করছি।

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

## Worker ফল পাঠায়

বাস্তব উদাহরণ: কয়েকজন worker ভারী হিসাব করে ফল channel-এ পাঠায়, main সব জমিয়ে মোট বের করে।
এখানে প্রতিটা worker `1` থেকে নিজের সংখ্যা পর্যন্ত যোগফল বের করছে।

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    let jobs = [10u32, 20, 30, 40];

    for n in jobs {
        let tx = tx.clone();
        thread::spawn(move || {
            let sum: u32 = (1..=n).sum();
            tx.send((n, sum)).unwrap();
        });
    }
    drop(tx);

    let mut done: Vec<(u32, u32)> = rx.into_iter().collect();
    done.sort();
    for (n, sum) in &done {
        println!("sum(1..={n}) = {sum}");
    }
    let total: u32 = done.iter().map(|(_, s)| s).sum();
    println!("total = {total}");
}
```

```text
sum(1..=10) = 55
sum(1..=20) = 210
sum(1..=30) = 465
sum(1..=40) = 820
total = 1550
```

## সাধারণ ভুল

পাঠানোর পর value আবার ব্যবহার করা:

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

`send(s)` মালিকানা channel-এর ভেতরে পাঠিয়ে দিয়েছে। পাঠানোর পরেও লাগলে আগে `s.clone()` পাঠাও।
আরেকটা ভুল হলো আসল `tx` drop না করা, যার ফলে `for value in rx` আর থামে না।

## নিজে করো

তিনটা thread বানাও। thread `i` (১, ২, ৩) channel-এ `"worker i"` লিখে একটা `String` পাঠাবে। main সব message জমিয়ে sort করে এক লাইনে করে print করবে।

<details>
<summary>সমাধান দেখো</summary>

প্রতিটা thread-এর জন্য `tx.clone()`, আর শেষে original `tx` drop, এই দুটো মনে রাখলেই হয়।

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

- `let (tx, rx) = mpsc::channel();` একজোড়া sender/receiver দেয়। `send` পাঠায়, `recv` অপেক্ষা করে পায়।
- পাঠালে value-র মালিকানা receiver-এর কাছে যায়। তাই data race হয় না।
- `for v in rx` সব sender drop হলে নিজে থামে। অনেক producer-এর জন্য `tx.clone()` করো, আর আসল `tx` drop করো।
- thread-এর message-এর ক্রম ঠিক নয়। ক্রম লাগলে জমিয়ে sort করো।
- `mpsc` = অনেক producer, একজন consumer।
