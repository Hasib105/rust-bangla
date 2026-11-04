---
title: "Vec: বাড়তে থাকা তালিকা"
short: "Vec"
part: 3
order: 13
summary: "Vec হলো heap-এ থাকা, ইচ্ছামতো বাড়তে-কমতে পারা তালিকা। array-র মতো সহজ, কিন্তু size আগে থেকে ঠিক করতে হয় না।"
icon: "📚"
minutes: 5
video: "OVerIo7eeiY"
---

## কেন শিখবো?

array-র size compile-এর সময়েই ঠিক করতে হয়, কিন্তু বাস্তবে কয়টা জিনিস আসবে আগে জানা যায় না। Python-এর `list`-এর মতো বাড়তে পারে **`Vec<T>`**, আর Rust-এর safety সঙ্গে থাকে।

## Vec বানানো, push আর pop

`Vec::new()` বা `vec![...]` দিয়ে বানাও, বদলাতে `mut` লাগে। `push` শেষে যোগ করে, `pop` শেষ element বের করে। `pop` দেয় `Option`, কারণ Vec খালি থাকতে পারে।

```rust
fn main() {
    let mut v = Vec::new();
    v.push(10);
    v.push(20);
    v.push(30);
    println!("{:?} len={}", v, v.len());

    let last = v.pop();
    println!("{:?} {:?}", last, v);
}
```

```text
[10, 20, 30] len=3
Some(30) [10, 20]
```

## `v[i]` আর `get`

`v[i]` সীমার বাইরে গেলে **panic** করে। `v.get(i)` কখনো panic করে না, সে `Option` দেয়। index নিশ্চিত না হলে `get` ব্যবহার করো।

```rust
fn main() {
    let v = vec![5, 6, 7];
    println!("{}", v[1]);
    println!("{:?}", v.get(1));
    println!("{:?}", v.get(10));
}
```

```text
6
Some(6)
None
```

## loop চালিয়ে পড়া ও বদলানো

`for x in &v` শুধু পড়ে। বদলাতে `&mut v` লেখো, তখন `x` একটা reference, আর মান বদলাতে `*x` লিখতে হয়।

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    for x in &v {
        println!("read {x}");
    }
    for x in &mut v {
        *x *= 10;
    }
    println!("{:?}", v);
}
```

```text
read 1
read 2
read 3
[10, 20, 30]
```

## `sort`, `dedup`, `retain`

`sort()` ছোট থেকে বড় সাজায়। `dedup()` **পাশাপাশি** থাকা একই মান মুছে একটা রাখে, তাই আগে `sort` করো। `retain` শুধু শর্ত মেলা element রাখে (`|n| *n != 2` একটা closure, পরে আসছে)।

```rust
fn main() {
    let mut v = vec![3, 1, 3, 2, 1];
    v.sort();
    println!("sorted: {:?}", v);
    v.dedup();
    println!("dedup:  {:?}", v);
    v.retain(|n| *n != 2);
    println!("retain: {:?}", v);
}
```

```text
sorted: [1, 1, 2, 3, 3]
dedup:  [1, 2, 3]
retain: [1, 3]
```

## সাধারণ ভুল

reference ধরে রেখে Vec বদলানো (`push`-এ Vec নতুন জায়গায় সরতে পারে, তাই পুরোনো reference ঝুলে যেত):

```rust compile_fail
fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];
    v.push(4); // error[E0502]: cannot borrow `v` as mutable
    println!("{first}");
}
```

ঠিক করতে মানটা কপি করো: `let first = v[0];`।

## নিজে করো

`vec![5, 3, 8, 3, 1]` নাও। sort করো, duplicate সরাও, শেষে `100` যোগ করো, তারপর Vec আর যোগফল (`v.iter().sum::<i32>()`) print করো।

<details>
<summary>সমাধান দেখো</summary>

```rust
fn main() {
    let mut v = vec![5, 3, 8, 3, 1];
    v.sort();
    v.dedup();
    v.push(100);
    let total = v.iter().sum::<i32>();
    println!("{:?} total={}", v, total);
}
```

```text
[1, 3, 5, 8, 100] total=117
```

</details>

## মনে রাখো

- `Vec<T>` heap-এ থাকে, বাড়ে-কমে। বদলাতে `mut` লাগে।
- `v[i]` সীমার বাইরে গেলে panic, `v.get(i)` `Option` দেয়।
- `for x in &v` পড়ার জন্য, `&mut v` বদলানোর জন্য (`*x`)।
- `sort`, `dedup`, `retain` কাজের method। reference থাকতে `push` চলে না।
