---
title: "Mutex আর Arc: share করা ডেটা"
short: "Mutex & Arc"
part: 9
order: 35
summary: "অনেক thread একই ডেটা বদলাতে চাইলে `Arc<Mutex<T>>` ব্যবহার করো। lock নিলে তবেই ডেটায় হাত দেওয়া যায়।"
minutes: 5
---

## কেন শিখবো?

কখনো সবাইকে **একই counter** বদলাতে হয়। lock ছাড়া দুই thread একসাথে বদলালে **data race** হয়।
`Mutex` একটা তালা: একবারে একজনই ডেটা ধরতে পারে।

## Mutex আর guard

`lock()` তালা নিয়ে একটা **guard** দেয়, যা দিয়ে ডেটা বদলানো যায়। guard scope থেকে বেরোলে তালা **নিজে খুলে যায়**।

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

## Arc<Mutex<T>>

অনেক thread-এ একই `Mutex` লাগলে `Arc` লাগে: এটা `Rc`-এর মতো, কিন্তু thread-safe (atomic count)। `Arc::clone` শুধু count বাড়ায়, ডেটা কপি করে না।

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

## RwLock আর atomic

`RwLock`: অনেক reader (`read()`) **অথবা** একজন writer (`write()`)। শুধু একটা সংখ্যা হলে `AtomicUsize` তালা ছাড়াই চলে।

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

তালা ধরে রেখে আবার একই `lock()` ডাকলে thread চিরকাল আটকে যায়, একে **deadlock** বলে। compiler এটা ধরতে পারে না। `try_lock()` অপেক্ষা না করে সঙ্গে সঙ্গে `Err` দেয়।

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

## সাধারণ ভুল

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

`Arc::new(Mutex::new(0))` বানাও আর প্রতি thread-এর জন্য `Arc::clone(&counter)` করো।

## নিজে করো

`Arc<Mutex<Vec<u32>>>`-এ ৩টা thread ১, ২, ৩ `push` করবে। সবাইকে `join` করে `sort` করে print করো।

<details>
<summary>সমাধান দেখো</summary>

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

- `Mutex<T>`: `lock()` guard দেয়, guard drop হলে তালা খোলে।
- thread-এ share করতে `Arc<Mutex<T>>`; `Rc` চলে না।
- `RwLock`: অনেক reader বা একজন writer। সংখ্যার জন্য atomic।
- deadlock compiler ধরে না; guard ছোট scope-এ রাখো।
