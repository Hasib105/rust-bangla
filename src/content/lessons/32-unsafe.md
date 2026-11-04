---
title: "Unsafe: compiler-কে বলো, এবার আমি দেখছি"
short: "Unsafe"
part: 8
order: 32
summary: "`unsafe` compiler-এর চেক বন্ধ করে না, বরং কিছু বাড়তি কাজ করার অনুমতি দেয়। দায়িত্ব তখন তোমার।"
icon: "⚠️"
minutes: 9
---

## কেন শিখবো?

Rust-এর compiler খুব কড়া। কিন্তু কিছু কাজ compiler প্রমাণ করতে পারে না, যদিও সেগুলো আসলে নিরাপদ। যেমন C library ডাকা, hardware-এর address ধরে কাজ করা, বা `Vec` নিজে বানানো।
এই কাজগুলোর জন্যই আছে `unsafe`। আর std-এর ভেতরের `Vec`, `String`, `Rc` সবই কোথাও না কোথাও `unsafe` ব্যবহার করে।
তুমি হয়তো নিজে বেশি লিখবে না, কিন্তু কী করে আর কেন বিপজ্জনক, সেটা জানা দরকার।

## unsafe কী করতে দেয়?

`unsafe` লিখলে compiler মাত্র কয়েকটা বাড়তি কাজের অনুমতি দেয়:

1. raw pointer (`*const T`, `*mut T`) **dereference** করা
2. `unsafe fn` ডাকা (FFI-র C function-ও এর মধ্যে পড়ে)
3. `static mut` variable পড়া বা বদলানো
4. `unsafe trait` implement করা
5. `union`-এর field পড়া

বাকি সব নিয়ম (ownership, borrow, type check) **আগের মতোই** চলে। `unsafe` কোনো কিছু বন্ধ করে না।

## Raw pointer

raw pointer বানানো safe, কারণ শুধু address রাখলে কোনো ক্ষতি হয় না। ক্ষতি হয় তার ভেতরের value পড়তে গেলে, কারণ address ঠিক আছে কিনা compiler জানে না। তাই dereference করতে `unsafe` লাগে।

```rust
fn main() {
    let mut n = 10;
    let p = &mut n as *mut i32; // creating a raw pointer is safe

    unsafe {
        *p += 5; // dereferencing needs unsafe
        println!("through pointer: {}", *p);
    }
    println!("n = {n}");
}
```

```text
through pointer: 15
n = 15
```

## unsafe fn আর static mut

যে function-এর শর্ত compiler চেক করতে পারে না, তাকে `unsafe fn` বানানো হয়। ডাকার সময় `unsafe { }` লাগে, মানে ডাকনেওয়ালা শর্ত মানার দায় নিচ্ছে।
নিয়ম হলো, `unsafe fn`-এর doc-এ `# Safety` লিখে দেওয়া, কী মানতে হবে।

`static mut` হলো পুরো program জুড়ে একটাই global বদলানো যায় এমন variable। দুই thread একসাথে বদলালে data race হয়, তাই এটা `unsafe`। (Rust 2024-এ `static mut`-এর reference নেওয়াই নিষেধ, তাই নিচে মান কপি করে পড়া হয়েছে।)

```rust
static mut COUNTER: u32 = 0;

/// # Safety
/// `p` must point to a valid, readable i32.
unsafe fn read_it(p: *const i32) -> i32 {
    unsafe { *p }
}

fn main() {
    let x = 42;
    let v = unsafe { read_it(&x) };
    println!("v = {v}");

    unsafe {
        COUNTER += 1;
        COUNTER += 1;
    }
    let now = unsafe { COUNTER }; // copy the value out
    println!("counter = {now}");
}
```

```text
v = 42
counter = 2
```

## Safe abstraction: unsafe ভেতরে, safe বাইরে

`unsafe` ব্যবহারের সবচেয়ে ভালো উপায় হলো এটাকে ছোট একটা function-এর ভেতরে আটকে রাখা, যার বাইরের চেহারা **safe**। ভেতরে তুমি নিশ্চিত করো কোনো নিয়ম ভাঙছে না।
নিচে `split_at_mut`-এর মতো function: একটা slice-কে দুই ভাগ করে দুটোকেই `&mut` দেয়। borrow checker নিজে এটা বুঝবে না (একই slice-এর দুটো `&mut`), কিন্তু আমরা জানি ভাগ দুটো কখনো overlap করে না।

```rust
use std::slice;

fn split_mut(s: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = s.len();
    assert!(mid <= len); // this check keeps the unsafe part sound
    let ptr = s.as_mut_ptr();
    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = vec![1, 2, 3, 4, 5];
    let (left, right) = split_mut(&mut v, 2);
    left[0] = 100;
    right[0] = 300;
    println!("{v:?}");
}
```

```text
[100, 2, 300, 4, 5]
```

`assert!` না থাকলে `mid` বড় হলে memory-র বাইরে পড়া হতো, যেটা undefined behavior। এই চেকটাই function-কে safe করে।

## FFI আর কেন এড়িয়ে চলবে

**FFI** মানে অন্য ভাষার (বেশিরভাগ C) function ডাকা। compiler C-র কোড দেখতে পায় না, তাই এই declaration-গুলো `unsafe`।
এখানে C-র `abs` function ডাকার নমুনা দেখাচ্ছি (এটা চালানো হয় না):

```rust ignore
unsafe extern "C" {
    fn abs(x: i32) -> i32;
}

fn main() {
    let r = unsafe { abs(-3) };
    println!("{r}");
}
```

`unsafe`-এর ভেতরে ভুল করলে **undefined behavior** (UB) হয়: crash, ভুল ফল, বা security hole, আর কখনো কখনো কিছুই বোঝা যায় না।
তাই নিয়ম হলো: প্রথমে safe উপায়ে চেষ্টা করো। `unsafe` লাগলে ছোট রাখো, কারণ কমেন্টে লিখে রাখো, আর safe function দিয়ে ঢেকে দাও।

## সাধারণ ভুল

`unsafe` ছাড়া raw pointer dereference করা:

```rust compile_fail
fn main() {
    let x = 5;
    let p = &x as *const i32;
    println!("{}", *p); // error[E0133]: dereference of raw pointer is unsafe
}
```

compiler বলে `this operation is unsafe and requires an unsafe block`। ঠিক করতে `unsafe { *p }` লেখো, তবে আগে ভাবো pointer-টা সত্যিই valid কিনা। এখানে তো `&x` দিয়ে সরাসরি পড়লেই হতো!

## নিজে করো

`swap_first_last(s: &mut [i32])` নামে একটা **safe** function লেখো, যেটা slice-এর প্রথম আর শেষ element অদলবদল করে (খালি slice হলে কিছু করে না)।
ভেতরে raw pointer ব্যবহার করো: `s.as_mut_ptr()` আর `std::ptr::swap(a, b)`। `main`-এ `[1, 2, 3, 4]` দিয়ে চালিয়ে print করো।

<details>
<summary>সমাধান দেখো</summary>

খালি slice-এর চেক-টাই unsafe অংশকে নিরাপদ করছে। `len - 1` তখন বাদ পড়ে যায়।

```rust
fn swap_first_last(s: &mut [i32]) {
    if s.is_empty() {
        return;
    }
    let last = s.len() - 1;
    let p = s.as_mut_ptr();
    unsafe {
        std::ptr::swap(p, p.add(last));
    }
}

fn main() {
    let mut v = [1, 2, 3, 4];
    swap_first_last(&mut v);
    println!("{v:?}");
}
```

```text
[4, 2, 3, 1]
```

</details>

## মনে রাখো

- `unsafe` মাত্র কয়েকটা বাড়তি কাজ করতে দেয়: raw pointer deref, `unsafe fn` call, `static mut`, `unsafe trait`, `union`। বাকি নিয়ম চালু থাকে।
- `unsafe` মানে "compiler প্রমাণ করতে পারছে না, আমি দায়িত্ব নিচ্ছি"। ভুল হলে undefined behavior।
- ভালো অভ্যাস: `unsafe` অংশ ছোট রাখো, কেন নিরাপদ তা লেখো, আর safe function দিয়ে মুড়ে দাও।
- FFI দিয়ে C library ডাকা যায়, কিন্তু declaration-গুলো `unsafe`।
- সাধারণ কাজে `unsafe` লাগেই না। আগে safe উপায় খোঁজো।
