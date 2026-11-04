---
title: "Unsafe: compiler-কে বলো, এবার আমি দেখছি"
short: "Unsafe"
part: 8
order: 32
summary: "`unsafe` compiler-এর চেক বন্ধ করে না, বরং কিছু বাড়তি কাজ করার অনুমতি দেয়। দায়িত্ব তখন তোমার।"
icon: "⚠️"
minutes: 5
---

## কেন শিখবো?

কিছু কাজ (C library ডাকা, `Vec` নিজে বানানো) compiler প্রমাণ করতে পারে না, যদিও সেগুলো নিরাপদ হতে পারে। সেজন্য `unsafe`। std-এর `Vec`, `String`, `Rc` সবই ভেতরে `unsafe` ব্যবহার করে।

## `unsafe` কী করতে দেয়

`unsafe` শুধু পাঁচটা বাড়তি কাজ দেয়: raw pointer **dereference**, `unsafe fn` ডাকা (C function-ও), `static mut` পড়া বা বদলানো, `unsafe trait` implement, `union`-এর field পড়া। ownership, borrow আর type check **আগের মতোই** চলে। raw pointer বানানো safe, কিন্তু ভেতরের value পড়তে `unsafe` লাগে, কারণ address ঠিক কিনা compiler জানে না।

```rust
fn main() {
    let mut n = 10;
    let p = &mut n as *mut i32;

    unsafe {
        *p += 5;
    }
    println!("n = {n}");
}
```

```text
n = 15
```

## `unsafe fn` আর `static mut`

শর্ত compiler চেক করতে না পারলে function হয় `unsafe fn`, ডাকতে `unsafe { }` লাগে। doc-এ `# Safety` লিখে দিতে হয়। `static mut` global বদলানো variable, thread-এ data race হতে পারে বলে `unsafe`। (2024-এ এর reference নেওয়া নিষেধ, তাই মান কপি করে পড়ো।)

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
    unsafe {
        COUNTER += 1;
    }
    let now = unsafe { COUNTER };
    println!("v = {v}, counter = {now}");
}
```

```text
v = 42, counter = 1
```

## Safe abstraction

সবচেয়ে ভালো অভ্যাস: `unsafe` ছোট function-এর ভেতরে আটকে রাখো, বাইরের চেহারা **safe**। নিচের function slice-কে দুই `&mut` ভাগে দেয়। borrow checker নিজে বুঝবে না, কিন্তু আমরা জানি ভাগ দুটো overlap করে না। `assert!` না থাকলে `mid` বড় হলে memory-র বাইরে পড়া হতো (undefined behavior)।

```rust
use std::slice;

fn split_mut(s: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = s.len();
    assert!(mid <= len);
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

## FFI আর UB

**FFI** মানে C-র মতো অন্য ভাষার function ডাকা, এর declaration `unsafe extern "C"` হয়। `unsafe`-এ ভুল করলে **undefined behavior** (UB): crash, ভুল ফল বা security hole। তাই আগে safe উপায় চেষ্টা করো, `unsafe` ছোট রাখো আর কেন নিরাপদ তা লিখে রাখো।

## সাধারণ ভুল

`unsafe` ছাড়া raw pointer dereference:

```rust compile_fail
fn main() {
    let x = 5;
    let p = &x as *const i32;
    println!("{}", *p); // error[E0133]: dereference of raw pointer is unsafe
}
```

ঠিক করতে `unsafe { *p }`, তবে আগে ভাবো pointer valid কিনা। এখানে `&x` দিয়েই পড়া যেত।

## নিজে করো

`swap_first_last(s: &mut [i32])` নামে **safe** function লেখো, যেটা প্রথম আর শেষ element অদলবদল করে (খালি slice হলে কিছু না)। ভেতরে `s.as_mut_ptr()` আর `std::ptr::swap` ব্যবহার করো। `[1, 2, 3, 4]` দিয়ে চালাও।

<details>
<summary>সমাধান দেখো</summary>

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

- `unsafe` কয়েকটা বাড়তি কাজ দেয় (raw pointer deref, `unsafe fn`, `static mut`...), বাকি নিয়ম চালু থাকে।
- মানে "compiler প্রমাণ করতে পারছে না, আমি দায়িত্ব নিচ্ছি"। ভুল হলে UB।
- `unsafe` ছোট রাখো, safe function দিয়ে মুড়ে দাও।
- FFI declaration `unsafe`। সাধারণ কাজে `unsafe` লাগেই না।
