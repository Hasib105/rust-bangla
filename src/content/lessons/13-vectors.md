---
title: "Vec: বাড়তে থাকা তালিকা"
short: "Vec"
part: 3
order: 13
summary: "Vec হলো heap-এ থাকা, ইচ্ছামতো বাড়তে-কমতে পারা তালিকা। array-র মতো সহজ, কিন্তু size আগে থেকে ঠিক করতে হয় না।"
icon: "📚"
minutes: 9
video: "OVerIo7eeiY"
---

## কেন শিখবো?

array-র size compile-এর সময়েই ঠিক করতে হয়: `[i32; 3]` মানে সবসময় ঠিক তিনটা। কিন্তু বাস্তব প্রোগ্রামে কয়টা জিনিস আসবে আগে জানা যায় না: user কয়টা নাম দেবে, file-এ কয়টা লাইন আছে।
Python-এর `list` বা JS-এর array যেমন বাড়তে পারে, Rust-এ সেই কাজ করে **`Vec<T>`**। এটা সব element heap-এ পাশাপাশি রাখে, তাই দ্রুত আর memory-friendly।
সাথে Rust-এর safety তো আছেই: ভুল index দিলে চুপচাপ garbage পড়ে না, আর loop চলার সময় Vec বদলে ফেলাও compiler আটকে দেয়।

## Vec বানানো, push আর pop

`Vec::new()` দিয়ে খালি Vec হয়, আর `vec![...]` macro দিয়ে মান সহ। বদলাতে চাইলে `mut` লাগবে। `push` শেষে যোগ করে, `pop` শেষ element বের করে।
`pop` সরাসরি মান দেয় না, দেয় `Option`, কারণ Vec খালি থাকতে পারে (লেসন ১২-র `Some`/`None` মনে আছে তো?)।

```rust
fn main() {
    let mut v = Vec::new();
    v.push(10);
    v.push(20);
    v.push(30);
    println!("{:?} len={}", v, v.len());

    let last = v.pop();
    println!("{:?} {:?}", last, v);

    let w = vec![1, 2, 3];
    println!("{:?}", w);
}
```

```text
[10, 20, 30] len=3
Some(30) [10, 20]
[1, 2, 3]
```

## index আর get

`v[i]` লিখলে element পাওয়া যায়, কিন্তু `i` সীমার বাইরে হলে প্রোগ্রাম **panic** করে (থেমে যায়)। আর `v.get(i)` কখনো panic করে না, সে ফেরত দেয় `Option`।
যেখানে index ঠিক কি না নিশ্চিত নও, সেখানে `get` ব্যবহার করো।

```rust
fn main() {
    let v = vec![5, 6, 7];
    println!("{}", v[1]);
    println!("{:?}", v.get(1));
    println!("{:?}", v.get(10));

    match v.get(10) {
        Some(x) => println!("found {x}"),
        None => println!("no item at 10"),
    }
}
```

```text
6
Some(6)
None
no item at 10
```

## loop চালিয়ে পড়া ও বদলানো

`for x in &v` লিখলে প্রতিটা element **ধার** (borrow) করে পড়া যায়, `v` অক্ষত থাকে। বদলাতে চাইলে `&mut v` লেখো। তখন `x` একটা `&mut i32`, আর মান বদলাতে `*x` লিখতে হয়
(`*` মানে "এই reference-এর ভেতরের মানটা")।

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

## sort, dedup আর retain

Vec-এর কয়েকটা কাজের method:

- `sort()` ছোট থেকে বড় সাজায়
- `dedup()` **পাশাপাশি** থাকা একই মান মুছে একটা রাখে (তাই আগে `sort` করা দরকার)
- `retain(...)` শুধু শর্ত মেলা element রাখে। `|n| *n != 2` একটা ছোট নামহীন function (closure), এর বিস্তারিত লেসন ২৫-এ। এখন শুধু বোঝো: "প্রতিটা `n`-এর জন্য শর্তটা সত্য হলে রাখো"

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

## Vec আর borrow-এর নিয়ম

লেসন ৮-এর নিয়ম Vec-এও খাটে: reader থাকলে writer চলবে না। `push` করলে Vec-এর জায়গা কম পড়তে পারে, তখন সে সব element নতুন জায়গায় সরায়। পুরোনো reference তখন ঝুলে যেত।
Rust তাই `first` ব্যবহার শেষ হওয়ার আগে `push` করতেই দেয় না।

## সাধারণ ভুল

reference ধরে রেখে Vec বদলানো:

```rust compile_fail
fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];
    v.push(4); // error[E0502]: cannot borrow `v` as mutable
    println!("{first}");
}
```

compiler বলে `immutable borrow later used here`। সমাধান: মানটা **কপি** করে নাও (`i32` তো `Copy`), তাহলে আর borrow থাকে না।

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    let first = v[0]; // copy, not a borrow
    v.push(4);
    println!("{first} {:?}", v);
}
```

```text
1 [1, 2, 3, 4]
```

## নিজে করো

`vec![5, 3, 8, 3, 1]` নাও। sort করো, duplicate সরাও, শেষে `100` যোগ করো, তারপর Vec আর সব element-এর যোগফল print করো।
যোগফলের জন্য `v.iter().sum::<i32>()` লিখতে পারো (`::<i32>` বলে দেয় যোগফল কোন type-এর হবে)।

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

- `Vec<T>` heap-এ থাকে, বাড়ে-কমে। `Vec::new()` বা `vec![...]` দিয়ে বানাও, বদলাতে `mut` লাগে।
- `v[i]` সীমার বাইরে গেলে panic। অনিশ্চিত হলে `v.get(i)` ব্যবহার করো, সে `Option` দেয়।
- `for x in &v` পড়ার জন্য, `for x in &mut v` বদলানোর জন্য (`*x` দিয়ে)।
- `sort`, `dedup`, `retain` রোজকার কাজের method। `dedup`-এর আগে `sort` করো।
- reference বেঁচে থাকতে Vec-এ `push` করা যায় না। borrow-এর নিয়ম এখানেও একই।
