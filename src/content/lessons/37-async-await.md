---
title: "async/await: অপেক্ষা না করে কাজ"
short: "Async"
part: 9
order: 37
summary: "async fn একটা Future ফেরত দেয়, যেটা lazy। কেউ poll না করলে কিছুই চলে না। এই কাজ করে executor।"
icon: "⏳"
minutes: 10
---

## কেন শিখবো?

ধরো একটা web server-এ ১০,০০০ জন একসাথে connect করেছে। প্রতিজনের জন্য একটা করে OS thread খুললে অনেক memory লাগে, আর বেশিরভাগ সময় thread শুধু network-এর উত্তরের অপেক্ষায় বসে থাকে।
**async** দিয়ে একটা thread-ই হাজার হাজার কাজ সামলাতে পারে: একটা কাজ অপেক্ষায় থাকলে thread অন্য কাজে চলে যায়।

Rust-এর async-এর একটা অদ্ভুত দিক আছে: standard library-তে শুধু `Future` trait আর `async`/`.await` সিনট্যাক্স আছে, কিন্তু কাজগুলো **চালানোর** জিনিস (executor) নেই। সেটা আসে crate থেকে, যেমন `tokio`।
আমরা এই পাঠে নিজেরাই একটা ছোট executor বানিয়ে দেখবো ভেতরে কী হয়, তারপর বুঝবো tokio কেন লাগে।

## async fn একটা lazy Future

`async fn` ডাকলে ভেতরের কোড চলে না। বদলে একটা **Future** পাওয়া যায়, যা মানে "পরে চালানোর কাজের বিবরণ"। Future-কে `poll` না করা পর্যন্ত কিছুই ঘটে না।
নিচে ছোট একটা `block_on` লিখেছি, যা একটা future-কে শেষ হওয়া পর্যন্ত poll করতে থাকে। (`Waker::noop()` এমন একটা waker, যা কিছুই করে না।)

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

দেখো, `"add is running"` এসেছে `block_on`-এর পরে। `add(2, 3)` ডাকার সময় কিছুই হয়নি। এটাই **lazy**: iterator-এর মতোই, চালালে তবেই কাজ।

## Future trait আর poll

আসলে `Future` trait-টা ছোট:

```rust ignore
trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`poll` দুটোর একটা ফেরত দেয়: `Poll::Ready(value)` (কাজ শেষ) অথবা `Poll::Pending` (এখনো তৈরি নয়, পরে আবার চেষ্টা করো)।
`Pending` ফেরত দেওয়ার আগে future `cx.waker()` কে মনে রাখে। পরে তৈরি হলে সেই **waker** executor-কে বলে "আমাকে আবার poll করো"। নিচের future তিনবার `Pending` দেয়:

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct Countdown(u32);

impl Future for Countdown {
    type Output = &'static str;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if self.0 == 0 {
            Poll::Ready("liftoff")
        } else {
            println!("poll: {} left", self.0);
            self.0 -= 1;
            cx.waker().wake_by_ref(); // ask the executor to poll again
            Poll::Pending
        }
    }
}

fn block_on<F: Future>(fut: F) -> F::Output {
    let mut fut = std::pin::pin!(fut);
    let mut cx = Context::from_waker(std::task::Waker::noop());
    loop {
        if let Poll::Ready(value) = fut.as_mut().poll(&mut cx) {
            return value;
        }
    }
}

fn main() {
    let msg = block_on(Countdown(3));
    println!("{msg}");
}
```

```text
poll: 3 left
poll: 2 left
poll: 1 left
liftoff
```

`async fn`-এর ভেতরের প্রতিটা `.await` আসলে এরকম একটা `Pending`-এর সম্ভাব্য জায়গা। compiler পুরো `async fn`-কে একটা state machine বানিয়ে দেয়, যার `poll` আমরা হাতে লিখতাম না।

## এক thread, অনেক task

async-এর আসল জাদু এখানেই: একটা thread-এ অনেকগুলো task একসাথে এগোতে পারে। নিচে `YieldNow` নামের future নিজে একবার `Pending` দিয়ে অন্যদের সুযোগ দেয়। আমাদের মিনি executor task-গুলোকে পালা করে (round-robin) poll করে।

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll, Waker};

struct YieldNow(bool);

impl Future for YieldNow {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        if self.0 {
            Poll::Ready(())
        } else {
            self.0 = true;
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}

async fn task(name: &'static str, steps: u32) {
    for i in 1..=steps {
        println!("{name} step {i}");
        YieldNow(false).await; // let the others run
    }
    println!("{name} done");
}

fn main() {
    let mut tasks: Vec<Pin<Box<dyn Future<Output = ()>>>> = vec![
        Box::pin(task("A", 2)),
        Box::pin(task("B", 3)),
    ];
    let mut cx = Context::from_waker(Waker::noop());
    while !tasks.is_empty() {
        let mut i = 0;
        while i < tasks.len() {
            if tasks[i].as_mut().poll(&mut cx).is_ready() {
                tasks.remove(i);
            } else {
                i += 1;
            }
        }
    }
    println!("all tasks finished");
}
```

```text
A step 1
B step 1
A step 2
B step 2
A done
B step 3
B done
all tasks finished
```

A আর B মিলেমিশে এগিয়েছে, অথচ কোনো নতুন thread খোলা হয়নি। এটাই **concurrency without threads**।

## তাহলে tokio কেন লাগে?

আমাদের executor খেলনা। সত্যিকারের কাজে এমন জিনিস লাগে যা আমরা বানাইনি:

- network, file আর timer-এর সত্যিকারের অপেক্ষা: OS-কে বলে রাখা যে ডেটা এলে জাগিয়ো, তারপর thread ঘুমিয়ে থাকা (আমরা শুধু ঘুরে ঘুরে poll করছি)।
- অনেক CPU core-এ task ছড়িয়ে দেওয়া (multi-thread scheduler)।
- `spawn`, `sleep`, `select!`, async TCP, channel, ইত্যাদি তৈরি টুল।

`tokio` এর সবচেয়ে জনপ্রিয় runtime। এর কোড এরকম দেখায় (crate লাগে, তাই এখানে চালানো যাবে না):

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

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

`#[tokio::main]` আমাদের `block_on`-এর কাজই করে, শুধু অনেক বেশি শক্তিশালী runtime দিয়ে। এই কোডে দুটো task একসাথে ঘুমায়, তাই মোট সময় ২০০ ms, ৩০০ ms নয়।

## সাধারণ ভুল

`async fn` ডেকে `.await` বা executor ছাড়াই ভেবে নেওয়া যে কাজ হয়ে গেছে। আর `main` সরাসরি `async` করাও যায় না:

```rust compile_fail
async fn hello() {
    println!("hello");
}

fn main() {
    let result: () = hello(); // error[E0308]: mismatched types, expected `()`, found future
}
```

compiler বলে `hello()` একটা future ফেরত দিয়েছে, `()` নয়। কিছুই print হয়নি! সমাধান: executor-এ চালাও (`block_on(hello())` বা `#[tokio::main]` ও `.await`)।
সাধারণ `fn main`-এর ভেতরে `.await` লিখলেও error আসে, কারণ `.await` শুধু `async` context-এ চলে।

## নিজে করো

`async fn double(x: i32) -> i32` আর `async fn sum_of_doubles(a: i32, b: i32) -> i32` লেখো, যেটা দুটো `double` কে `.await` করে যোগফল ফেরত দেয়। `main`-এ আগের `block_on` দিয়ে `sum_of_doubles(3, 4)` চালিয়ে ফল print করো।

<details>
<summary>সমাধান দেখো</summary>

`.await` শুধু `async fn`-এর ভেতরে লেখা যায়। `main` সাধারণ function, তাই সেখানে `block_on` লাগে।

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

- `async fn` একটা `Future` ফেরত দেয়। Future **lazy**: poll না করলে কিছুই চলে না।
- `poll` ফেরত দেয় `Ready(value)` বা `Pending`। `Pending` হলে waker জানায় কখন আবার poll করতে হবে।
- `.await` শুধু `async` ভেতরে চলে। compiler `async fn`-কে একটা state machine বানায়।
- standard library-তে executor নেই। সত্যিকারের কাজে `tokio` (বা অন্য runtime) লাগে।
- async I/O-র জন্য ভালো, অনেক connection সামলাতে। শুধু CPU-র ভারী কাজে সাধারণ thread-ই যথেষ্ট।
