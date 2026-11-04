---
title: "Mutex আর Arc: share করা ডেটা"
short: "Mutex & Arc"
part: 9
order: 35
summary: "অনেক thread একই ডেটা বদলাতে চাইলে `Arc<Mutex<T>>` ব্যবহার করো। lock নিলে তবেই ডেটায় হাত দেওয়া যায়।"
icon: "🔒"
minutes: 10
---

## কেন শিখবো?

channel-এ ডেটা এক হাত থেকে আরেক হাতে যায়। কিন্তু কখনো কখনো সবাইকে **একই counter** বা একই list বদলাতে হয়।
lock ছাড়া দুই thread একসাথে `count += 1` করলে একটার কাজ হারিয়ে যায়, একে বলে **data race**।
`Mutex` (mutual exclusion) একটা তালার মতো: একবারে একজনই ডেটা ধরতে পারে। Rust-এর বিশেষত্ব হলো, তালা না খুলে ডেটা ধরাই **যায় না**, কারণ ডেটাটা `Mutex`-এর ভেতরেই থাকে।

## Mutex আর lock guard

`mutex.lock()` ডাকলে তালা নেওয়া হয় আর একটা **guard** (`MutexGuard`) পাওয়া যায়। guard-এর মাধ্যমে ডেটা পড়া বা বদলানো যায়।
guard scope থেকে বের হলে (drop হলে) তালা **নিজে নিজে খুলে যায়**, আলাদা `unlock` লাগে না।
`lock()` একটা `Result` দেয় (অন্য thread তালা ধরে panic করলে `Err`), তাই এখানে `unwrap()` করি।

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut guard = m.lock().unwrap(); // take the lock
        *guard += 1; // guard acts like &mut i32
    } // guard dropped here: lock released

    println!("m = {:?}", m.lock().unwrap());
}
```

```text
m = 6
```

## Arc<Mutex<T>>: অনেক thread, একটা counter

thread-গুলোর সবার একই `Mutex` লাগে, কিন্তু `Mutex`-এর মালিক একজনই হতে পারে। `Rc` (পাঠ ২৮) এখানে চলবে না, কারণ সেটা thread-safe নয়।
তাই আছে `Arc` (**A**tomic **R**eference **C**ounted): `Rc`-এর মতোই, কিন্তু একাধিক thread থেকে নিরাপদে ব্যবহার করা যায়।
`Arc::clone(&x)` শুধু count বাড়ায়, ডেটা কপি করে না। ছক হলো `Arc<Mutex<T>>`।

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();

    for _ in 0..4 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                *counter.lock().unwrap() += 1;
            }
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
    println!("total = {}", *counter.lock().unwrap());
}
```

```text
total = 4000
```

৪টা thread প্রতিটা ১০০০ বার যোগ করেছে, আর ফল সবসময় ঠিক ৪০০০ আসে। lock না থাকলে কখনো কম আসতো।

## RwLock আর atomic

**`RwLock`:** অনেকে একসাথে পড়তে পারে (`read()`), কিন্তু লিখতে (`write()`) একজনই, আর তখন কেউ পড়তেও পারে না। পড়া বেশি, লেখা কম হলে কাজের।

**atomic:** শুধু একটা সংখ্যা বা bool হলে `Mutex` ছাড়াই `AtomicUsize`, `AtomicBool` ইত্যাদি চলে। CPU নিজেই একবারে পুরো কাজটা করে, তাই তালা লাগে না আর দ্রুত চলে।

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let config = Arc::new(RwLock::new(String::from("v1")));
    {
        let r1 = config.read().unwrap();
        let r2 = config.read().unwrap(); // many readers are fine
        println!("{r1} {r2}");
    }
    config.write().unwrap().push_str("-updated"); // one writer
    println!("{}", config.read().unwrap());

    let hits = Arc::new(AtomicUsize::new(0));
    let handles: Vec<_> = (0..4)
        .map(|_| {
            let hits = Arc::clone(&hits);
            thread::spawn(move || {
                for _ in 0..500 {
                    hits.fetch_add(1, Ordering::Relaxed);
                }
            })
        })
        .collect();
    for h in handles {
        h.join().unwrap();
    }
    println!("hits = {}", hits.load(Ordering::Relaxed));
}
```

```text
v1 v1
v1-updated
hits = 2000
```

## Deadlock

তালা ভুলভাবে ব্যবহার করলে **deadlock** হয়: দুই thread একে অপরের তালা খোলার অপেক্ষায় চিরকাল আটকে থাকে। Rust এটা compile-এর সময় আটকাতে পারে না।
সবচেয়ে সহজ ভুল হলো একই thread-এ আগের guard ধরে রেখে আবার একই `lock()` ডাকা।

নিচে ঘটনাটা নিরাপদে দেখাচ্ছি। `lock()` ডাকলে আটকে যেতো, কিন্তু `try_lock()` অপেক্ষা না করে সঙ্গে সঙ্গে `Err` দেয়।

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(1);
    let first = m.lock().unwrap(); // lock held

    // m.lock() here would wait forever: deadlock
    println!("second try ok? {}", m.try_lock().is_ok());

    drop(first); // release
    println!("after drop ok? {}", m.try_lock().is_ok());
}
```

```text
second try ok? false
after drop ok? true
```

বাঁচার উপায়: guard ছোট scope-এ রাখো, দুটো তালা লাগলে সব thread-এ **একই ক্রমে** নাও, আর তালা ধরে রেখে ধীর কাজ (sleep, network) কোরো না।

## সাধারণ ভুল

`Mutex`-কে thread-এ ঢোকাতে `Arc` ছাড়া শুধু `move` করা:

```rust compile_fail
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Mutex::new(0);
    let mut handles = Vec::new();
    for _ in 0..2 {
        handles.push(thread::spawn(move || {
            *counter.lock().unwrap() += 1; // error[E0382]: value moved in previous iteration of loop
        }));
    }
    for h in handles {
        h.join().unwrap();
    }
}
```

প্রথম thread-এ `counter` move হয়ে গেছে, দ্বিতীয়টার জন্য কিছু নেই। ঠিক করতে `Arc::new(Mutex::new(0))` বানাও আর প্রতিটা thread-এর জন্য `Arc::clone(&counter)` করো।

## নিজে করো

`Arc<Mutex<Vec<u32>>>` বানাও। ৩টা thread-এ প্রতিটা নিজের সংখ্যা (১, ২, ৩) ওই `Vec`-এ `push` করবে। সবাইকে `join` করে `Vec`-টা `sort` করো আর print করো।

<details>
<summary>সমাধান দেখো</summary>

push-এর ক্রম ঠিক থাকে না, তাই শেষে `sort` করেছি। ফল তখন সবসময় একই।

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let list = Arc::new(Mutex::new(Vec::new()));

    let handles: Vec<_> = (1..=3u32)
        .map(|n| {
            let list = Arc::clone(&list);
            thread::spawn(move || {
                list.lock().unwrap().push(n);
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }

    let mut v = list.lock().unwrap();
    v.sort();
    println!("{:?}", *v);
}
```

```text
[1, 2, 3]
```

</details>

## মনে রাখো

- `Mutex<T>` ডেটা ঘিরে রাখে। `lock()` দিলে guard পাও, guard drop হলে তালা খোলে।
- অনেক thread-এ share করতে `Arc<Mutex<T>>`। `Arc::clone` শুধু count বাড়ায়। `Rc` thread-এ চলে না।
- `RwLock`: অনেক reader অথবা একজন writer। সাধারণ সংখ্যার জন্য atomic (`AtomicUsize`) তালা ছাড়াই চলে।
- deadlock compiler ধরে না। guard ছোট scope-এ রাখো, তালার ক্রম সবখানে এক রাখো।
- তালা ধরে রাখার সময় যত কম, program তত দ্রুত।
