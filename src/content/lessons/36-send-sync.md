---
title: "Send আর Sync: data race-এর বিরুদ্ধে compiler"
short: "Send/Sync"
part: 9
order: 36
summary: "Send মানে value অন্য thread-এ পাঠানো যায়, Sync মানে reference শেয়ার করা যায়। এই দুটো trait দিয়েই compiler data race আটকায়।"
icon: "🛂"
minutes: 9
---

## কেন শিখবো?

C++ বা Java-তে একটা non-thread-safe জিনিস ভুল করে দুই thread-এ শেয়ার করলে program চলে, কিন্তু মাঝে মাঝে অদ্ভুত ভুল ফল দেয়। এই ধরনের bug খুঁজে বের করা সবচেয়ে কঠিন।
Rust-এ সেই সুযোগই নেই। প্রতিটা type-এর গায়ে compiler দুটো লেবেল লাগায়: **Send** আর **Sync**। `thread::spawn` শুধু সেই জিনিসই নেয় যেগুলোর লেবেল ঠিক আছে।
এই পাঠে দেখবো লেবেল দুটোর মানে কী, আর শেষে এগুলো কাজে লাগিয়ে একটা ছোট worker pool বানাবো।

## Send আর Sync

- **`Send`**: এই type-এর value-এর মালিকানা অন্য thread-এ পাঠানো (move করা) নিরাপদ।
- **`Sync`**: এই type-এর `&T` একসাথে অনেক thread-এ শেয়ার করা নিরাপদ। অর্থাৎ `T: Sync` মানে `&T: Send`।

দুটোই **marker trait**: এদের কোনো method নেই। compiler নিজেই ঠিক করে দেয়, কারণ একটা struct-এর সব field `Send` হলে struct-ও `Send`। তোমাকে `impl` লিখতে হয় না।
`i32`, `String`, `Vec<T>` সবই `Send`, আর `Arc<Mutex<T>>` তো আমরা আগের পাঠেই thread-এ পাঠিয়েছি।

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let total = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();
    for i in 1..=4 {
        let total = Arc::clone(&total);
        handles.push(thread::spawn(move || {
            *total.lock().unwrap() += i;
        }));
    }
    for h in handles {
        h.join().unwrap();
    }
    println!("total = {}", total.lock().unwrap());
}
```

```text
total = 10
```

কোনো type `Send` বা `Sync` কি না, তা compile সময়েই যাচাই করা যায়। নিচের ছোট function দুটো শুধু bound চেক করে। bound না মিললে compile-ই হতো না।

```rust
use std::cell::Cell;
use std::sync::{Arc, Mutex};

fn needs_send<T: Send>() {}
fn needs_sync<T: Sync>() {}

fn main() {
    needs_send::<i32>();
    needs_send::<String>();
    needs_send::<Arc<Mutex<Vec<i32>>>>();
    needs_send::<Cell<i32>>(); // Send, but not Sync
    needs_sync::<Mutex<i32>>();
    needs_sync::<Arc<i32>>();
    println!("all checks passed at compile time");
}
```

```text
all checks passed at compile time
```

`Cell<i32>` একটা মজার উদাহরণ: এটা `Send`, কারণ পুরো মালিকানা অন্য thread-এ গেলে সেখানে একাই ব্যবহার হবে। কিন্তু `Sync` নয়, কারণ দুই thread একসাথে `&Cell` দিয়ে মান বদলালে data race হবে।

## Rc কেন Send নয়

`Rc`-এর reference count সাধারণ সংখ্যা, atomic না। দুই thread একসাথে `clone` করলে count ভুল হয়ে যাবে, আর পরে একই memory দুবার free হতে পারে।
তাই Rust `Rc`-কে `Send` হতে দেয় না:

```rust compile_fail
use std::rc::Rc;

fn needs_send<T: Send>() {}

fn main() {
    needs_send::<Rc<i32>>(); // error[E0277]: `Rc<i32>` cannot be sent between threads safely
}
```

ঠিক জিনিসটা হলো `Arc`, যার count atomic। সংক্ষেপে নিয়মটা এরকম:

| type | Send | Sync |
|---|---|---|
| `i32`, `String`, `Vec<T>` | হ্যাঁ | হ্যাঁ |
| `Rc<T>` | না | না |
| `Cell<T>`, `RefCell<T>` | হ্যাঁ | না |
| `Mutex<T>` | হ্যাঁ | হ্যাঁ |
| `Arc<T>` | `T: Send + Sync` হলে | `T: Send + Sync` হলে |

খেয়াল করো, `Arc<T>` নিজে নিরাপদ হলেও ভেতরের `T` যদি `Sync` না হয়, তাহলে `Arc<T>`-ও `Send` হয় না।

## একটা ছোট worker pool

এবার সব মিলিয়ে একটা thread pool। কয়েকটা worker thread একটা channel থেকে কাজ (job) তুলে নেয়। channel-এর `Receiver` একটাই, তাই সেটাকে `Arc<Mutex<_>>`-এ মুড়ে সবাইকে দিতে হয়।
job হলো `Box<dyn FnOnce() -> u64 + Send + 'static>`: এখানে `Send` লেখা বাধ্যতামূলক, নাহলে job অন্য thread-এ পাঠানো যেত না।
output নির্ধারিত রাখতে ফলাফল job-এর নম্বর ধরে sort করা হয়েছে, কারণ কোন worker আগে শেষ করবে তা ঠিক নেই।

```rust
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;

type Job = Box<dyn FnOnce() -> u64 + Send + 'static>;

struct Pool {
    workers: Vec<thread::JoinHandle<()>>,
    sender: Option<mpsc::Sender<(usize, Job)>>,
    results: mpsc::Receiver<(usize, u64)>,
}

impl Pool {
    fn new(size: usize) -> Pool {
        let (tx, rx) = mpsc::channel::<(usize, Job)>();
        let (res_tx, res_rx) = mpsc::channel();
        let rx = Arc::new(Mutex::new(rx));
        let mut workers = Vec::new();
        for _ in 0..size {
            let rx = Arc::clone(&rx);
            let res_tx = res_tx.clone();
            workers.push(thread::spawn(move || {
                loop {
                    let msg = rx.lock().unwrap().recv();
                    match msg {
                        Ok((id, job)) => res_tx.send((id, job())).unwrap(),
                        Err(_) => break, // channel closed
                    }
                }
            }));
        }
        Pool { workers, sender: Some(tx), results: res_rx }
    }

    fn submit(&self, id: usize, job: impl FnOnce() -> u64 + Send + 'static) {
        self.sender.as_ref().unwrap().send((id, Box::new(job))).unwrap();
    }

    fn finish(mut self) -> Vec<(usize, u64)> {
        drop(self.sender.take()); // close the job channel
        for w in self.workers.drain(..) {
            w.join().unwrap();
        }
        let mut out: Vec<(usize, u64)> = self.results.try_iter().collect();
        out.sort();
        out
    }
}

fn main() {
    let pool = Pool::new(3);
    for n in 1..=6u64 {
        pool.submit(n as usize, move || (1..=n).product());
    }
    for (id, value) in pool.finish() {
        println!("job {id}: {id}! = {value}");
    }
}
```

```text
job 1: 1! = 1
job 2: 2! = 2
job 3: 3! = 6
job 4: 4! = 24
job 5: 5! = 120
job 6: 6! = 720
```

কীভাবে বন্ধ হয়? `finish`-এ sender drop করলে channel বন্ধ হয়ে যায়। তখন প্রতিটা worker-এর `recv()` `Err` দেয়, loop থেকে বেরিয়ে thread শেষ হয়, আর `join` সেটার জন্য অপেক্ষা করে।
সত্যিকারের প্রজেক্টে এসব নিজে লিখতে হয় না। `rayon` বা `tokio`-র thread pool আছে, কিন্তু ভেতরের নীতি এটাই।

## সাধারণ ভুল

`Arc` লাগিয়েই ভাবা যে সব ঠিক। ভেতরে `RefCell` থাকলে `Arc<RefCell<T>>` thread-এ যায় না:

```rust compile_fail
use std::cell::RefCell;
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(RefCell::new(0));
    let c = Arc::clone(&counter);
    let h = thread::spawn(move || {
        *c.borrow_mut() += 1; // error[E0277]: `RefCell<i32>` cannot be shared between threads safely
    });
    h.join().unwrap();
}
```

compiler বলছে `RefCell<i32>` `Sync` নয়। সমাধান: `RefCell`-এর জায়গায় `Mutex` (বা `RwLock`) ব্যবহার করো, মানে `Arc<Mutex<i32>>`।

## নিজে করো

`needs_send` আর `needs_sync` function দুটো দিয়ে যাচাই করো `Mutex<String>` আর `Arc<Vec<i32>>` দুটোই `Send` ও `Sync` কি না। সব ঠিক থাকলে `ok` print করো।

<details>
<summary>সমাধান দেখো</summary>

দুটো type-ই `Send + Sync`, তাই কোনো error ছাড়াই compile হবে। কোনোটা না হলে compile error আসতো।

```rust
use std::sync::{Arc, Mutex};

fn needs_send<T: Send>() {}
fn needs_sync<T: Sync>() {}

fn main() {
    needs_send::<Mutex<String>>();
    needs_sync::<Mutex<String>>();
    needs_send::<Arc<Vec<i32>>>();
    needs_sync::<Arc<Vec<i32>>>();
    println!("ok");
}
```

```text
ok
```

</details>

## মনে রাখো

- `Send`: value অন্য thread-এ move করা যায়। `Sync`: `&T` অনেক thread-এ শেয়ার করা যায়।
- দুটোই marker trait, compiler নিজে ঠিক করে। `thread::spawn` শুধু `Send` closure নেয়।
- `Rc`, `RefCell` thread-এর জন্য নয়। তাদের বদলে `Arc`, `Mutex`, `RwLock` ব্যবহার করো।
- data race তাই runtime-এ ধরা পড়ে না, compile সময়েই আটকে যায়।
