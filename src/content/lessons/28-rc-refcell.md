---
title: "Rc আর RefCell: shared ownership"
short: "Rc, RefCell"
part: 7
order: 28
summary: "Rc একটা value-র অনেক মালিক বানায়, RefCell চালু অবস্থায় borrow-এর নিয়ম মানায়, আর Weak চক্র ভাঙে।"
icon: "🔗"
minutes: 5
---

## কেন শিখবো?

ownership বলে মালিক একজন, কিন্তু graph-এর node-এর মতো জিনিসের মালিক অনেক। তখন `Rc` (অনেক মালিক) আর `RefCell` (ভেতরে বদলানো)। নিয়ম ভাঙলে compile error নয়, চালানোর সময় `panic`।

## Rc: অনেক মালিক

`Rc::clone(&a)` ডেটা কপি করে না, শুধু গণনা বাড়ায়। গণনা শূন্য হলে value মুছে যায়। `Rc` শুধু এক thread-এর জন্য।

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("shared"));
    let b = Rc::clone(&a);
    println!("count = {}", Rc::strong_count(&a));
    {
        let _c = Rc::clone(&a);
        println!("count = {}", Rc::strong_count(&a));
    }
    println!("count = {}", Rc::strong_count(&b));
}
```

```text
count = 2
count = 3
count = 2
```

## RefCell আর `Rc<RefCell<T>>`

`Rc`-র ভেতরের value শুধু পড়া যায়। বদলাতে `RefCell`: `borrow()` আর `borrow_mut()`, নিয়ম একই (অনেক পাঠক **অথবা** একজন লেখক), কিন্তু যাচাই হয় চালানোর সময়। `try_borrow_mut()` panic ছাড়াই দেখে। একে বলে **interior mutability**। দুটো মিলালে অনেক মালিক, সবাই বদলাতে পারে।

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let shared = Rc::new(RefCell::new(vec![1, 2]));
    let other = Rc::clone(&shared);
    other.borrow_mut().push(3);
    println!("{:?}", shared.borrow());

    let reader = shared.borrow();
    println!("can write? {}", shared.try_borrow_mut().is_ok());
    drop(reader);
    println!("can write? {}", shared.try_borrow_mut().is_ok());
}
```

```text
[1, 2, 3]
can write? false
can write? true
```

## Weak আর Cell

দুটো `Rc` একে অপরকে ধরলে গণনা কখনো শূন্য হয় না, তাই leak। `Weak` value ধরে রাখে না। `Rc::downgrade` দিয়ে বানাও, `upgrade()` দিলে `Option<Rc<T>>` পাও। `Copy` value-র জন্য আরও সহজ `Cell` (`get`/`set`)।

```rust
use std::cell::Cell;
use std::rc::Rc;

fn main() {
    let a = Rc::new(5);
    let w = Rc::downgrade(&a);
    println!("alive: {}", w.upgrade().is_some());
    drop(a);
    println!("alive: {}", w.upgrade().is_some());

    let hits = Cell::new(0);
    hits.set(hits.get() + 1);
    println!("hits = {}", hits.get());
}
```

```text
alive: true
alive: false
hits = 1
```

## সাধারণ ভুল

`Rc`-র ভেতরের value সরাসরি বদলানো:

```rust compile_fail
use std::rc::Rc;

fn main() {
    let a = Rc::new(5);
    *a += 1; // error[E0594]: cannot assign to data in an `Rc`
    println!("{a}");
}
```

ঠিক করতে `Rc<RefCell<i32>>` বানাও।

## নিজে করো

`Rc<RefCell<i32>>` দিয়ে `100` টাকার balance বানাও। `wallet` আর `phone` দুই মালিক। `wallet` দিয়ে `50` যোগ, `phone` দিয়ে `30` বিয়োগ করে balance আর `Rc::strong_count` print করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let wallet = Rc::new(RefCell::new(100));
    let phone = Rc::clone(&wallet);

    *wallet.borrow_mut() += 50;
    *phone.borrow_mut() -= 30;

    println!("balance = {}", wallet.borrow());
    println!("owners = {}", Rc::strong_count(&wallet));
}
```

```text
balance = 120
owners = 2
```

</details>

## মনে রাখো

- `Rc<T>` অনেক মালিক বানায়, `Rc::clone` শুধু গণনা বাড়ায়।
- `RefCell<T>` borrow-এর নিয়ম চালানোর সময় যাচাই করে, ভাঙলে panic।
- `Rc<RefCell<T>>` মানে অনেক মালিক, সবাই বদলাতে পারে।
- চক্রে leak হয়, তাই back-reference-এ `Weak`।
