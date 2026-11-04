---
title: "Closure: নিজের environment মনে রাখা function"
short: "Closures"
part: 6
order: 25
summary: "closure হলো নামহীন ছোট function, যে তার চারপাশের variable ধরে রাখতে পারে।"
icon: "🎒"
minutes: 9
---

## কেন শিখবো?

ধরো একটা list sort করতে চাও, কিন্তু "কীসের ভিত্তিতে sort হবে" সেটা প্রতিবার আলাদা। এই ছোট নিয়মটা কি আলাদা করে নাম দিয়ে function লিখতে হবে? অনেক সময় সেটা বাড়াবাড়ি।
Python-এর `lambda` বা JS-এর `x => x + 1` তোমার চেনা থাকলে closure বুঝতে সমস্যা হবে না। Rust-এ এর বাড়তি ক্ষমতা হলো, closure চারপাশের variable **ধার নিতে বা মালিকানা নিয়ে নিতে** পারে, আর compiler সেটা নিরাপদে হিসাব রাখে।

## Closure-এর syntax

`|parameter| body` হলো closure। এটাকে variable-এ রেখে function-এর মতো ডাকা যায়। সাধারণত type লিখতে হয় না, compiler বুঝে নেয়।

```rust
fn main() {
    let add_one = |x| x + 1;
    let area = |w: u32, h: u32| -> u32 { w * h };
    println!("{}", add_one(4));
    println!("{}", area(3, 5));
}
```

```text
5
15
```

## Environment ধরা: ধার, নাকি মালিকানা

সাধারণ function চারপাশের local variable দেখতে পায় না। closure পায়। Rust নিজে ঠিক করে সবচেয়ে হালকা উপায়ে সে variable ধরবে:
শুধু পড়লে `&` (ধার), বদলালে `&mut`, আর value-টা নিয়ে চলে গেলে move।

```rust
fn main() {
    let name = String::from("Rina");
    let greet = || println!("hello, {name}"); // borrows name
    greet();
    println!("name is still here: {name}");

    let mut count = 0;
    let mut bump = || count += 1; // borrows count mutably
    bump();
    bump();
    println!("count = {count}");
}
```

```text
hello, Rina
name is still here: Rina
count = 2
```

লক্ষ্য করো, যে closure বদলায় (`bump`), সেটাকেও `let mut` করতে হয়। কারণ সে ভেতরের অবস্থা বদলাচ্ছে।

## `move`: মালিকানা নিয়ে নেওয়া

`move` লিখলে closure ধার না নিয়ে variable-টার **মালিক** হয়ে যায়। closure যখন তার বানানোর জায়গার চেয়ে বেশি সময় বাঁচবে (যেমন function থেকে return হবে, বা পরে thread-এ যাবে), তখন এটা দরকার হয়।

```rust
fn main() {
    let name = String::from("Rina");
    let owns = move || println!("owned: {name}");
    owns();
    owns();
}
```

```text
owned: Rina
owned: Rina
```

`move` হলেও closure কতবার ডাকা যাবে, সেটা নির্ভর করে ভেতরে কী করা হচ্ছে তার ওপর। সেটাই পরের অংশ।

## `Fn`, `FnMut`, `FnOnce`

closure ভেতরে captured value নিয়ে যা করে, তার ভিত্তিতে compiler তাকে তিনটার একটা (বা একাধিক) trait দেয়:

- `Fn`: শুধু পড়ে। যত খুশি ডাকা যায়।
- `FnMut`: বদলায়। যত খুশি ডাকা যায়, কিন্তু `mut` লাগে।
- `FnOnce`: captured value **খরচ** (move out) করে ফেলে। মাত্র একবার ডাকা যায়।

function-এ closure নেওয়ার সময় `impl Fn...` bound দিয়ে বলে দিতে হয় কোনটা চাই।

```rust
fn call_twice(f: impl Fn() -> i32) -> i32 {
    f() + f()
}

fn run_once(f: impl FnOnce() -> String) -> String {
    f()
}

fn main() {
    let base = 10;
    println!("{}", call_twice(|| base + 1));

    let word = String::from("bye");
    let s = run_once(move || word); // returns word, so it is consumed
    println!("{s}");
}
```

```text
22
bye
```

নিয়মটা মনে রাখার সহজ উপায়: `Fn` সবচেয়ে কড়া, তাই সব `Fn` closure-ই `FnMut` আর `FnOnce`-ও বটে। যে function `FnOnce` চায়, তাকে যেকোনো closure দেওয়া যায়।

## Closure return করা আর `sort_by_key`

closure-এর type নামহীন, তাই return type-এ `impl Fn(...)` লিখতে হয়। আর standard library-র অনেক method closure নেয়, যেমন `sort_by_key`।

```rust
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n
}

fn main() {
    let add5 = make_adder(5);
    println!("{}", add5(10));

    let mut words = vec!["pear", "fig", "banana", "kiwi"];
    words.sort_by_key(|w| w.len());
    println!("{words:?}");
}
```

```text
15
["fig", "pear", "kiwi", "banana"]
```

এখানে `move` না দিলে `n` ধার করা থাকতো, কিন্তু `make_adder` শেষ হলে `n` মুছে যেত। তাই `move` লাগে। আর `sort_by_key` stable, তাই সমান দৈর্ঘ্যের `pear` আর `kiwi` আগের ক্রমেই থাকে।

## সাধারণ ভুল

`move` করার পর মূল variable আবার ব্যবহার করা:

```rust compile_fail
fn main() {
    let s = String::from("hi");
    let f = move || println!("{s}");
    f();
    println!("{s}"); // error[E0382]: borrow of moved value: `s`
}
```

`move` closure-এর ভেতরে `s` চলে গেছে, তাই বাইরে আর নেই। ঠিক করতে হলে `move`-এর আগে `s.clone()` দিয়ে একটা কপি closure-কে দাও, অথবা `move` বাদ দিয়ে শুধু ধার নিতে দাও।

```rust
fn main() {
    let s = String::from("hi");
    let copy = s.clone();
    let f = move || println!("{copy}");
    f();
    println!("{s}");
}
```

```text
hi
hi
```

## নিজে করো

`make_counter` নামে একটা function লেখো, যেটা `impl FnMut() -> u32` return করে। প্রথমবার ডাকলে `1`, তারপর `2`, `3` দেবে। `main`-এ তিনবার ডেকে print করো।

<details>
<summary>সমাধান দেখো</summary>

counter-টা closure-এর ভেতরে `move` করে নিতে হবে, আর closure নিজে `mut` হবে।

```rust
fn make_counter() -> impl FnMut() -> u32 {
    let mut n = 0;
    move || {
        n += 1;
        n
    }
}

fn main() {
    let mut next = make_counter();
    println!("{}", next());
    println!("{}", next());
    println!("{}", next());
}
```

```text
1
2
3
```

</details>

## মনে রাখো

- `|x| x + 1` হলো closure। সাধারণত type লিখতে হয় না।
- closure চারপাশের variable ধার নেয় (`&`, `&mut`), আর `move` দিলে মালিকানা নিয়ে নেয়।
- `Fn` শুধু পড়ে, `FnMut` বদলায়, `FnOnce` value খরচ করে ফেলে বলে একবারই চলে।
- closure return করতে `impl Fn(...)` লেখো, আর সাধারণত সেখানে `move` লাগে।
