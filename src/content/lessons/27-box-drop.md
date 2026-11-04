---
title: "Box আর Drop: heap-এ রাখা ও পরিষ্কার করা"
short: "Box, Drop"
part: 7
order: 27
summary: "Box<T> value-কে heap-এ রাখে, আর Drop trait বলে দেয় value মুছে যাওয়ার সময় কী করতে হবে।"
icon: "📦"
minutes: 9
---

## কেন শিখবো?

এখন পর্যন্ত বেশিরভাগ value stack-এ ছিল, যার size compile-এর সময়েই জানা থাকতে হয়। কিন্তু কখনো কখনো size জানা নেই, যেমন একটা list যে নিজেই নিজের ভেতরে আরেকটা list রাখে।
তখন value-টা heap-এ রেখে stack-এ শুধু একটা **pointer** রাখতে হয়। Rust-এ এর সবচেয়ে সরল উপায় হলো `Box<T>`।
আর ownership মনে আছে? মালিক চলে গেলে value মুছে যায়। সেই মুছে যাওয়ার মুহূর্তে নিজের কোড চালাতে চাইলে (file বন্ধ করা, lock ছাড়া) লাগে `Drop`।

## Box: heap-এ একটা value

`Box::new(5)` লিখলে `5` যায় heap-এ, আর `Box` নিজে stack-এ থাকে একটা pointer হয়ে। `*` দিয়ে ভেতরের মান পাওয়া যায়। `Box` scope থেকে বের হলে heap-এর memory আপনা থেকেই ফেরত যায়।

```rust
fn main() {
    let b = Box::new(5);
    println!("b = {b}");
    println!("b + 1 = {}", *b + 1);
}
```

```text
b = 5
b + 1 = 6
```

শুধু একটা `i32`-এর জন্য Box দরকার নেই, এটা শুধু দেখানোর জন্য। আসল কাজ নিচে।

## Recursive type: Box কেন লাগে

একটা linked list ভাবো: প্রতিটা node-এ একটা মান আর পরের node। যদি পরের node-টা সরাসরি ভেতরে রাখা হয়, তাহলে size হয় অসীম, কারণ ভেতরের node-এর ভেতরেও node, তার ভেতরেও node...

```rust compile_fail
enum List {
    Cons(i32, List), // error[E0072]: recursive type `List` has infinite size
    Nil,
}

fn main() {
    let _l = List::Nil;
}
```

`Box` দিলে ভেতরে থাকে শুধু একটা pointer, যার size নির্দিষ্ট। তাই compiler খুশি।

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn sum(list: &List) -> i32 {
    match list {
        Cons(n, rest) => n + sum(rest),
        Nil => 0,
    }
}

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
    println!("sum = {}", sum(&list));
}
```

```text
sum = 6
```

`sum(rest)`-এ `rest` হলো `&Box<List>`, কিন্তু function চায় `&List`। তবু compiler নিজে বদলে দেয়, কারণ `Box` `Deref` trait মানে। সেটাই পরের অংশ।

## Deref: Box-কে reference-এর মতো ব্যবহার

`Deref` trait বলে দেয় `*` চিহ্ন দিলে কী পাওয়া যাবে। `Box`, `String`, `Vec` সবাই এটা মানে, তাই `&String` দিয়ে `&str` চাওয়া function ডাকা যায়। নিজের type-এও এটা লেখা যায়।

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
    let x = MyBox(5);
    println!("{}", *x + 1);

    let name = MyBox(String::from("Rust"));
    hello(&name); // &MyBox<String> -> &String -> &str
}
```

```text
6
hello, Rust
```

## Drop: মুছে যাওয়ার সময় কাজ

`Drop` trait-এর `drop` method scope শেষে compiler নিজে ডেকে দেয়। তুমি এটা হাতে ডাকো না। local variable-গুলো **উল্টো ক্রমে** drop হয়: যেটা পরে বানানো, সেটা আগে যায়।

```rust
struct Noisy(&'static str);

impl Drop for Noisy {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

fn main() {
    let _a = Noisy("a");
    let _b = Noisy("b");
    println!("end of main");
}
```

```text
end of main
drop b
drop a
```

## আগেই ফেলে দেওয়া: `std::mem::drop`

কখনো scope-এর শেষ পর্যন্ত অপেক্ষা করতে চাও না (যেমন lock তাড়াতাড়ি ছেড়ে দেওয়া)। তখন `drop(value)` ডাকো। এটা সাধারণ একটা function, যে value-র মালিকানা নিয়ে সঙ্গে সঙ্গে ফেলে দেয়। `Drop::drop` method-টা নিজে ডাকা যায় না, কারণ তাহলে দুবার free হতে পারতো।

```rust
struct Noisy(&'static str);

impl Drop for Noisy {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

fn main() {
    let x = Noisy("x");
    let _y = Noisy("y");
    drop(x); // x goes now, not at the end
    println!("end of main");
}
```

```text
drop x
end of main
drop y
```

## সাধারণ ভুল

`drop` করার পর সেই variable আবার ব্যবহার করা। `drop` একটা move, তাই পরে value আর থাকে না:

```rust compile_fail
fn main() {
    let s = String::from("bye");
    drop(s);
    println!("{s}"); // error[E0382]: borrow of moved value: `s`
}
```

compiler বলে `value borrowed here after move`। যদি পরেও দরকার হয়, তাহলে `drop` ডেকো না। scope নিজেই সামলে নেবে।

## নিজে করো

`Guard` নামে একটা struct বানাও, যাতে একটা `&'static str` নাম থাকবে। এর `Drop`-এ `closing <name>` print করো। `main`-এ `Guard("one")` আর `Guard("two")` বানাও, তারপর `"two"`-কে `drop(...)` দিয়ে আগে ফেলে দাও, আর তারপর `done` print করো।

<details>
<summary>সমাধান দেখো</summary>

`two` আগেই drop হবে, তারপর `done` print হবে, আর শেষে scope শেষ হলে `one` drop হবে।

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

- `Box<T>` value-কে heap-এ রাখে, stack-এ থাকে শুধু pointer। recursive type-এ এটা লাগেই।
- `Box` `Deref` মানে, তাই `*b` দিয়ে ভেতরের মান আর `&Box<T>` থেকে `&T`-তে অটো রূপান্তর পাওয়া যায়।
- `Drop::drop` scope শেষে নিজে নিজে চলে, আর local variable উল্টো ক্রমে drop হয়।
- তাড়াতাড়ি ফেলতে চাইলে `drop(value)`, আর এর পরে সেই variable ব্যবহার করা যায় না।
