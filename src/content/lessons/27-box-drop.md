---
title: "Box আর Drop: heap-এ রাখা ও পরিষ্কার করা"
short: "Box, Drop"
part: 7
order: 27
summary: "Box<T> value-কে heap-এ রাখে, আর Drop trait বলে দেয় value মুছে যাওয়ার সময় কী করতে হবে।"
icon: "📦"
minutes: 5
---

## কেন শিখবো?

যে value-র size আগে থেকে জানা নেই (যেমন নিজের ভেতরে নিজেকে রাখা list), তাকে heap-এ রাখতে হয়। সেজন্য `Box<T>`। আর value মুছে যাওয়ার মুহূর্তে নিজের কোড চালাতে চাইলে `Drop`।

## Box আর recursive type

`Box::new(5)` মানে `5` যায় heap-এ, stack-এ থাকে pointer। `*` দিয়ে ভেতরের মান পাওয়া যায়। recursive type-এ ভেতরে সরাসরি নিজেকে রাখলে size অসীম হয়।

```rust compile_fail
enum List {
    Cons(i32, List), // error[E0072]: recursive type `List` has infinite size
    Nil,
}

fn main() {
    let _l = List::Nil;
}
```

`Box<List>` দিলে ভেতরে থাকে নির্দিষ্ট size-এর pointer, তাই compiler খুশি।

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Nil))));
    if let Cons(first, _) = list {
        println!("first = {first}");
    }
    let b = Box::new(20);
    println!("{}", *b + 1);
}
```

```text
first = 1
21
```

## Deref

`Deref` বলে দেয় `*` দিলে কী পাওয়া যাবে। তাই `&Box<String>` বা `&String` দিয়ে `&str` চাওয়া function ডাকা যায়। compiler নিজেই ধাপে ধাপে বদলে নেয় (deref coercion)।

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}

fn hello(name: &str) {
    println!("hello, {name}");
}

fn main() {
    let name = MyBox(String::from("Rust"));
    hello(&name);
}
```

```text
hello, Rust
```

## Drop

`Drop::drop` scope শেষে compiler নিজে ডাকে। local variable **উল্টো ক্রমে** drop হয়। আগে ফেলতে চাইলে `drop(value)` লেখো। `x.drop()` হাতে ডাকা যায় না, কারণ দুবার free হতে পারতো।

```rust
struct Noisy(&'static str);

impl Drop for Noisy {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

fn main() {
    let x = Noisy("x");
    let _a = Noisy("a");
    let _b = Noisy("b");
    drop(x);
    println!("end of main");
}
```

```text
drop x
end of main
drop b
drop a
```

## সাধারণ ভুল

`drop` একটা move, তাই পরে variable ব্যবহার করা যায় না:

```rust compile_fail
fn main() {
    let s = String::from("bye");
    drop(s);
    println!("{s}"); // error[E0382]: borrow of moved value: `s`
}
```

পরেও দরকার হলে `drop` ডেকো না, scope নিজেই সামলে নেবে।

## নিজে করো

`Guard` নামে struct বানাও (একটা `&'static str` নাম)। `Drop`-এ `closing <name>` print করো। `main`-এ `Guard("one")`, `Guard("two")` বানিয়ে `two`-কে `drop(...)` দিয়ে ফেলো, তারপর `done` print করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
struct Guard(&'static str);

impl Drop for Guard {
    fn drop(&mut self) {
        println!("closing {}", self.0);
    }
}

fn main() {
    let _one = Guard("one");
    let two = Guard("two");
    drop(two);
    println!("done");
}
```

```text
closing two
done
closing one
```

</details>

## মনে রাখো

- `Box<T>` value-কে heap-এ রাখে। recursive type-এ এটা লাগেই।
- `Deref`-এর জন্য `*b` কাজ করে, আর `&Box<T>` থেকে `&T`-তে অটো রূপান্তর হয়।
- `Drop::drop` scope শেষে চলে, উল্টো ক্রমে।
- তাড়াতাড়ি ফেলতে `drop(value)`, তারপর আর ব্যবহার করা যায় না।
