---
title: "async/await: অপেক্ষা না করে কাজ"
short: "Async"
part: 9
order: 37
summary: "async fn একটা Future ফেরত দেয়, যেটা lazy। কেউ poll না করলে কিছুই চলে না। এই কাজ করে executor।"
minutes: 6
---

## কেন শিখবো?

১০,০০০ connection-এর জন্য ১০,০০০ thread অনেক ভারী। **async**-এ একটা thread হাজার কাজ সামলায়: একটা অপেক্ষায় থাকলে thread অন্য কাজে যায়।
Rust-এর standard library-তে শুধু `Future` আর `async`/`.await` আছে, কাজ **চালানোর** executor আসে crate থেকে (যেমন `tokio`)।

## async fn একটা lazy Future

`async fn` ডাকলে কোড চলে না, একটা **Future** পাওয়া যায়। `poll` না করা পর্যন্ত কিছু ঘটে না। নিচের `block_on` future-কে শেষ পর্যন্ত poll করে।

```rust
use std::future::Future;
use std::pin::pin;
use std::task::{Context, Poll, Waker};

fn block_on<F: Future>(fut: F) -> F::Output {
    let mut fut = pin!(fut);
    let mut cx = Context::from_waker(Waker::noop());
    loop {
        if let Poll::Ready(value) = fut.as_mut().poll(&mut cx) {
            return value;
        }
    }
}

async fn add(a: i32, b: i32) -> i32 {
    println!("add is running");
    a + b
}

fn main() {
    let fut = add(2, 3);
    println!("future created, nothing ran yet");
    let result = block_on(fut);
    println!("result = {result}");
}
```

```text
future created, nothing ran yet
add is running
result = 5
```

## poll, Pending আর waker

`poll` ফেরত দেয় `Poll::Ready(value)` (শেষ) অথবা `Poll::Pending` (এখনো নয়)। `Pending` দেওয়ার আগে future **waker** মনে রাখে। কাজ তৈরি হলে waker executor-কে বলে "আবার poll করো"।

```rust ignore
trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

compiler `async fn`-কে একটা state machine বানায়; প্রতিটা `.await` একটা সম্ভাব্য `Pending`।

## tokio কেন লাগে?

আসল network/timer-এর অপেক্ষা, multi-core scheduler, `spawn`, `sleep` আমাদের `block_on` দেয় না। `tokio` এসব দেয়।

```rust ignore
use std::time::Duration;

#[tokio::main]
async fn main() {
    let a = tokio::spawn(async {
        tokio::time::sleep(Duration::from_millis(200)).await;
        "first"
    });
    let b = tokio::spawn(async {
        tokio::time::sleep(Duration::from_millis(100)).await;
        "second"
    });
    // both sleep at the same time: total ~200 ms, not 300 ms
    println!("{} {}", a.await.unwrap(), b.await.unwrap());
}
```

দুটো task একসাথে ঘুমায়, তাই মোট সময় প্রায় ২০০ ms।

## সাধারণ ভুল

```rust compile_fail
async fn hello() {
    println!("hello");
}

fn main() {
    let result: () = hello(); // error[E0308]: mismatched types, expected `()`, found future
}
```

`hello()` একটা future দেয়, কিছুই print হয়নি। executor-এ চালাও। সাধারণ `fn main`-এ `.await`-ও চলে না।

## নিজে করো

`async fn double(x: i32) -> i32` আর `sum_of_doubles(a, b)` লেখো, যেটা দুটো `double` `.await` করে যোগ করে। `block_on` দিয়ে `sum_of_doubles(3, 4)` চালাও।

<details>
<summary>সমাধান দেখো</summary>

```rust
use std::future::Future;
use std::pin::pin;
use std::task::{Context, Poll, Waker};

fn block_on<F: Future>(fut: F) -> F::Output {
    let mut fut = pin!(fut);
    let mut cx = Context::from_waker(Waker::noop());
    loop {
        if let Poll::Ready(value) = fut.as_mut().poll(&mut cx) {
            return value;
        }
    }
}

async fn double(x: i32) -> i32 {
    x * 2
}

async fn sum_of_doubles(a: i32, b: i32) -> i32 {
    let x = double(a).await;
    let y = double(b).await;
    x + y
}

fn main() {
    println!("{}", block_on(sum_of_doubles(3, 4)));
}
```

```text
14
```

</details>

## মনে রাখো

- `async fn` **lazy** Future দেয়: poll না করলে কিছু চলে না।
- `poll` দেয় `Ready(value)` বা `Pending`; waker জানায় কখন আবার poll করতে হবে।
- `.await` শুধু `async`-এর ভেতরে চলে।
- std-তে executor নেই, তাই `tokio` লাগে।
