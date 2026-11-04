---
title: "Send আর Sync: data race-এর বিরুদ্ধে compiler"
short: "Send/Sync"
part: 9
order: 36
summary: "Send মানে value অন্য thread-এ পাঠানো যায়, Sync মানে reference শেয়ার করা যায়। এই দুটো trait দিয়েই compiler data race আটকায়।"
icon: "🛂"
minutes: 5
---

## কেন শিখবো?

ভুল জিনিস দুই thread-এ শেয়ার করলে C++-এ program চলে কিন্তু মাঝে মাঝে ভুল ফল দেয়। Rust-এ compiler **Send** আর **Sync** লেবেল দেখে সেটা compile-এর সময়ই আটকায়।

## Send আর Sync

- **`Send`**: value-র মালিকানা অন্য thread-এ পাঠানো নিরাপদ।
- **`Sync`**: `&T` অনেক thread-এ শেয়ার করা নিরাপদ।

দুটোই **marker trait** (কোনো method নেই), compiler নিজে ঠিক করে। নিচের function দুটো শুধু bound যাচাই করে।

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

`Cell<i32>` `Send`, কিন্তু `Sync` নয়: দুই thread একসাথে `&Cell` বদলালে data race হবে।

## Rc কেন Send নয়

`Rc`-এর count atomic নয়। দুই thread একসাথে `clone` করলে count ভুল হয়ে যাবে। তাই thread-এর জন্য `Arc` নাও।

```rust compile_fail
use std::rc::Rc;

fn needs_send<T: Send>() {}

fn main() {
    needs_send::<Rc<i32>>(); // error[E0277]: `Rc<i32>` cannot be sent between threads safely
}
```

## worker pool কীভাবে বন্ধ হয়

pool-এ worker-রা একটা channel থেকে job তোলে। job-এর type-এ `Send` লিখতে হয়, নাহলে সেটা অন্য thread-এ যেত না। বন্ধ হওয়ার ক্রম:

1. sender `drop` করলে channel বন্ধ হয়।
2. প্রতিটা worker-এর `recv()` `Err` দেয়।
3. worker loop থেকে বেরিয়ে শেষ হয়।
4. `join` সব worker-এর অপেক্ষা করে।

## সাধারণ ভুল

`Arc` লাগালেই সব ঠিক নয়। `Arc<RefCell<T>>` thread-এ যায় না:

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

`RefCell` `Sync` নয়। এর জায়গায় `Mutex` নাও: `Arc<Mutex<i32>>`।

## নিজে করো

`needs_send` আর `needs_sync` দিয়ে যাচাই করো `Mutex<String>` আর `Arc<Vec<i32>>` দুটোই `Send` ও `Sync`। ঠিক থাকলে `ok` print করো।

<details>
<summary>সমাধান দেখো</summary>

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

- `Send`: move করা যায়। `Sync`: `&T` শেয়ার করা যায়।
- দুটোই marker trait; `thread::spawn` শুধু `Send` closure নেয়।
- `Rc`, `RefCell` thread-এর জন্য নয়; `Arc`, `Mutex` নাও।
- data race compile সময়েই আটকে যায়।
