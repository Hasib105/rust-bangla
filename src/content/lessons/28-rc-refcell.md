---
title: "Rc আর RefCell: shared ownership"
short: "Rc, RefCell"
part: 7
order: 28
summary: "Rc একটা value-র অনেক মালিক বানায়, RefCell চালু অবস্থায় borrow-এর নিয়ম মানায়, আর Weak চক্র ভাঙে।"
icon: "🔗"
minutes: 10
---

## কেন শিখবো?

ownership বলে মালিক একজন। কিন্তু কিছু জিনিস স্বভাবতই অনেকের হাতে থাকে। যেমন graph-এর একটা node-এ একাধিক edge এসে মেশে। কে সবার শেষে ছাড়বে, তা আগে থেকে বলা যায় না।
এই সমস্যার জন্য Rust-এ আছে `Rc` (অনেক মালিক), আর `RefCell` (দরকার হলে ভেতরে বদলানো)। এই দুই জিনিস একসঙ্গে ব্যবহার করলে compile-এর বদলে **চালানোর সময়** borrow-এর নিয়ম যাচাই হয়, তাই ভুল করলে `panic` হয়। সবসময় `Box` বা `&` দিয়ে কাজ চললে এদের দরকার নেই।

## Rc: অনেক মালিক

`Rc` মানে reference counted। `Rc::clone(&a)` heap-এর ডেটা কপি করে না, শুধু একটা গণনা বাড়ায়। গণনা শূন্য হলে value মুছে যায়। `Rc::strong_count` দিয়ে গণনা দেখা যায়।

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("shared"));
    println!("count = {}", Rc::strong_count(&a));
    let b = Rc::clone(&a);
    println!("count = {}", Rc::strong_count(&a));
    {
        let c = Rc::clone(&a);
        println!("count = {} ({c})", Rc::strong_count(&a));
    }
    println!("count = {}", Rc::strong_count(&b));
}
```

```text
count = 1
count = 2
count = 3 (shared)
count = 2
```

`c` বের হয়ে গেলে গণনা আবার কমে যায়। `Rc` শুধু একটা thread-এর জন্য। thread-এর কাজে লাগে `Arc`, যা পরে আসবে।

## RefCell: চালু অবস্থায় borrow-এর হিসাব

`Rc`-র ভেতরের value শুধু পড়া যায়, কারণ অনেক মালিক থাকলে সবাই বদলাতে পারলে বিপদ। তবু বদলানো দরকার হলে `RefCell`। এটা `borrow()` আর `borrow_mut()` দেয়, আর নিয়মটা একই: অনেক পাঠক **অথবা** একজন লেখক। তফাত হলো, নিয়ম ভাঙলে compile error নয়, **চালানোর সময় panic**। `try_borrow_mut()` দিয়ে panic ছাড়াই পরীক্ষা করা যায়।

```rust
use std::cell::RefCell;

fn main() {
    let c = RefCell::new(5);
    *c.borrow_mut() += 1;
    println!("value = {}", c.borrow());

    let reader = c.borrow(); // a reader is alive
    println!("can write now? {}", c.try_borrow_mut().is_ok());
    drop(reader);
    println!("can write now? {}", c.try_borrow_mut().is_ok());
}
```

```text
value = 6
can write now? false
can write now? true
```

`RefCell` নিজে `mut` ছাড়াই বদলানোর সুযোগ দেয়। একে বলে **interior mutability**।

## `Rc<RefCell<T>>`: অনেক মালিক, সবাই বদলাতে পারে

দুটো মিলিয়ে নিলে একটা value-র অনেক মালিক হয়, আর যে কেউ বদলালে বাকিরাও সেটা দেখে।

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let shared = Rc::new(RefCell::new(vec![1, 2]));
    let other = Rc::clone(&shared);

    other.borrow_mut().push(3);
    shared.borrow_mut().push(4);

    println!("{:?}", shared.borrow());
    println!("owners = {}", Rc::strong_count(&shared));
}
```

```text
[1, 2, 3, 4]
owners = 2
```

## Weak: চক্র ভাঙা

দুটো `Rc` একে অপরকে ধরে রাখলে গণনা কখনো শূন্য হয় না, ফলে memory leak হয়। এর সমাধান `Weak`: সে value-কে ধরে রাখে না, শুধু নজর রাখে। `Rc::downgrade` দিয়ে `Weak` বানাও, আর `upgrade()` দিলে `Option<Rc<T>>` পাও (value মরে গেলে `None`)।
সাধারণ নিয়ম: parent child-কে `Rc` দিয়ে ধরে, child parent-কে `Weak` দিয়ে।

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

struct Node {
    name: &'static str,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

fn main() {
    let root = Rc::new(Node {
        name: "root",
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });
    let leaf = Rc::new(Node {
        name: "leaf",
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    *leaf.parent.borrow_mut() = Rc::downgrade(&root);
    root.children.borrow_mut().push(Rc::clone(&leaf));

    let p = leaf.parent.borrow().upgrade();
    println!("parent of {} = {}", leaf.name, p.map(|n| n.name).unwrap_or("none"));
    println!("root strong = {}, weak = {}", Rc::strong_count(&root), Rc::weak_count(&root));
    println!("root has {} child", root.children.borrow().len());
}
```

```text
parent of leaf = root
root strong = 1, weak = 1
root has 1 child
```

`root`-এর strong গণনা ১, কারণ leaf তাকে `Weak` দিয়ে ধরেছে। তাই `root` ছাড়লে সে ঠিকমতো মুছে যায়।

## Cell: ছোট Copy value-র জন্য

`i32`-এর মতো `Copy` type-এর জন্য `Cell` আরও সহজ। এখানে borrow-ই নেই, শুধু `get` আর `set`।

```rust
use std::cell::Cell;

fn main() {
    let hits = Cell::new(0);
    hits.set(hits.get() + 1);
    hits.set(hits.get() + 1);
    println!("hits = {}", hits.get());
}
```

```text
hits = 2
```

## সাধারণ ভুল

`Rc`-র ভেতরের value সরাসরি বদলানোর চেষ্টা:

```rust compile_fail
use std::rc::Rc;

fn main() {
    let a = Rc::new(5);
    *a += 1; // error[E0594]: cannot assign to data in an `Rc`
    println!("{a}");
}
```

`Rc` শুধু shared পড়ার সুযোগ দেয়। বদলাতে চাইলে `Rc<RefCell<i32>>` বানাও।

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let a = Rc::new(RefCell::new(5));
    *a.borrow_mut() += 1;
    println!("{}", a.borrow());
}
```

```text
6
```

## নিজে করো

`Rc<RefCell<i32>>` দিয়ে একটা ব্যাংক balance বানাও, শুরুতে `100`। দুটো আলাদা variable (`wallet` আর `phone`) একই balance ধরবে। `wallet` দিয়ে `50` যোগ করো, `phone` দিয়ে `30` বিয়োগ করো, তারপর balance আর `Rc::strong_count` print করো।

<details>
<summary>সমাধান দেখো</summary>

`Rc::clone` গণনা বাড়ায়, তাই শেষে মালিক ২ জন। দুজনই একই `i32`-কে বদলায়: 100 + 50 - 30 = 120।

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

- `Rc<T>` একটা value-র অনেক মালিক বানায়। `Rc::clone` শুধু গণনা বাড়ায়, ডেটা কপি করে না।
- `RefCell<T>` borrow-এর নিয়ম চালানোর সময় যাচাই করে। ভাঙলে panic, `try_borrow_mut` দিয়ে আগে দেখা যায়।
- `Rc<RefCell<T>>` মানে অনেক মালিক আর সবাই বদলাতে পারে। এটা দরকার পড়লে ব্যবহার করো, প্রথম পছন্দ নয়।
- চক্র হলে leak হয়। back-reference-এ `Weak` ব্যবহার করো।
- ছোট `Copy` value-র জন্য `Cell` (`get`/`set`)।
