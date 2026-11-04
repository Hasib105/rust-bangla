---
title: "Closure: নিজের environment মনে রাখা function"
short: "Closures"
part: 6
order: 25
summary: "closure হলো নামহীন ছোট function, যে তার চারপাশের variable ধরে রাখতে পারে।"
icon: "🎒"
minutes: 5
---

## কেন শিখবো?

sort করতে চাও, কিন্তু "কীসের ভিত্তিতে" প্রতিবার আলাদা। তখন নাম দিয়ে function লেখা বাড়াবাড়ি। Python-এর `lambda`-র মতো Rust-এ আছে **closure**, যা চারপাশের variable ধরে রাখতে পারে।

## Closure-এর syntax

`|parameter| body` হলো closure। সাধারণত type লিখতে হয় না। standard library-র অনেক method closure নেয়, যেমন `sort_by_key`।

```rust
fn main() {
    let add_one = |x| x + 1;
    println!("{}", add_one(4));

    let mut words = vec!["pear", "fig", "banana", "kiwi"];
    words.sort_by_key(|w| w.len());
    println!("{words:?}");
}
```

```text
5
["fig", "pear", "kiwi", "banana"]
```

## Environment ধরা

সাধারণ function চারপাশের variable দেখে না, closure দেখে। শুধু পড়লে `&` (ধার), বদলালে `&mut`। যে closure বদলায়, তাকে `let mut` করতে হয়।

```rust
fn main() {
    let name = String::from("Rina");
    let greet = || println!("hello, {name}");
    greet();

    let mut count = 0;
    let mut bump = || count += 1;
    bump();
    bump();
    println!("count = {count}");
}
```

```text
hello, Rina
count = 2
```

## `move` আর closure return

`move` লিখলে closure ধার না নিয়ে variable-এর **মালিক** হয়। closure যদি function থেকে return হয়, তখন `move` লাগে, কারণ `n` মুছে যাবে। return type-এ লিখতে হয় `impl Fn(...)`।

```rust
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n
}

fn main() {
    let add5 = make_adder(5);
    println!("{}", add5(10));
}
```

```text
15
```

## `Fn`, `FnMut`, `FnOnce`

- `Fn`: শুধু পড়ে, যতবার খুশি ডাকা যায়।
- `FnMut`: বদলায়, যতবার খুশি ডাকা যায়।
- `FnOnce`: value খরচ করে ফেলে, তাই একবারই ডাকা যায়।

```rust
fn run_once(f: impl FnOnce() -> String) -> String {
    f()
}

fn main() {
    let word = String::from("bye");
    println!("{}", run_once(move || word));
}
```

```text
bye
```

## সাধারণ ভুল

`move`-এর পর মূল variable আবার ব্যবহার করা:

```rust compile_fail
fn main() {
    let s = String::from("hi");
    let f = move || println!("{s}");
    f();
    println!("{s}"); // error[E0382]: borrow of moved value: `s`
}
```

ঠিক করতে `move`-এর আগে `s.clone()` closure-কে দাও, অথবা `move` বাদ দাও।

## নিজে করো

`make_counter` নামে function লেখো, যেটা `impl FnMut() -> u32` return করে। ডাকলে `1`, `2`, `3` দেবে। `main`-এ তিনবার ডেকে print করো।

<details>
<summary>সমাধান দেখো</summary>

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

- `|x| x + 1` হলো closure, type সাধারণত লাগে না।
- closure variable ধার নেয় (`&`, `&mut`), আর `move` দিলে মালিকানা নেয়।
- `Fn` পড়ে, `FnMut` বদলায়, `FnOnce` খরচ করে বলে একবারই চলে।
- closure return করতে `impl Fn(...)` আর সাধারণত `move`।
