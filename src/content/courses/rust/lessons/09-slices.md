---
title: "Slices: কাটা অংশের view"
short: "Slices"
part: 2
order: 9
summary: "`&str` আর `&[T]` হলো কোনো ডেটার একটা অংশের দিকে তাকানো, কপি না করেই।"
minutes: 5
---

## কেন শিখবো?

কপি করলে বাড়তি memory লাগে, আর শুধু index রাখলে মূল String বদলালে index ভুল হয়ে যায়। **Slice** হলো মূল ডেটার একটা অংশের borrow, কপি ছাড়া, আর ভুল হলে compiler ধরে।

## `String` আর `&str`

`String` হলো মালিকানাওয়ালা, বাড়তে পারে এমন text। `&str` হলো text-এর ধার-করা view, আর literal `"hello"`-এর type `&str`।

```rust
fn main() {
    let owned: String = String::from("hello");
    let borrowed: &str = "hello"; // a literal is a &str
    let view: &str = &owned; // &String turns into &str
    println!("{owned} {borrowed} {view}");
}
```

```text
hello hello hello
```

## Slice বানানো

`&s[start..end]` দিলে `start` থেকে `end`-এর আগ পর্যন্ত অংশ পাওয়া যায়। সংখ্যাগুলো **byte** index, আর শুরু বা শেষ বাদ দেওয়া যায়: `[..5]`, `[6..]`।

```rust
fn main() {
    let s = String::from("hello world");
    let hello = &s[0..5];
    let world = &s[6..];
    println!("{hello}|{world}");
}
```

```text
hello|world
```

## Function-এর parameter: `&str` আর `&[T]`

parameter-এ `&String`-এর বদলে `&str` লেখো, তাহলে `String` আর literal দুটোই চলে। array বা Vec-এর জন্য `&[i32]`।

```rust
fn sum(nums: &[i32]) -> i32 {
    let mut total = 0;
    for n in nums {
        total += n;
    }
    total
}

fn main() {
    let a = [1, 2, 3, 4, 5];
    println!("{}", sum(&a));
    println!("{}", sum(&a[1..4]));
}
```

```text
15
9
```

## সাধারণ ভুল

slice বেঁচে থাকতে মূল String বদলানো:

```rust compile_fail
fn main() {
    let mut s = String::from("hello world");
    let word = &s[..5];
    s.clear(); // error[E0502]: cannot borrow `s` as mutable
    println!("{word}");
}
```

`word` একটা `&` borrow, আর `clear()` চায় `&mut`। ঠিক করতে `println!` আগে করো, তারপর `s.clear()`।

## নিজে করো

`last_word(s: &str) -> &str` লেখো, যা শেষ শব্দটা দেবে।

<details>
<summary>সমাধান দেখো</summary>

প্রতি space-এর পরে `start = i + 1` করো, শেষে `&s[start..]` ফেরত দাও।

```rust
fn last_word(s: &str) -> &str {
    let mut start = 0;
    for (i, ch) in s.char_indices() {
        if ch == ' ' {
            start = i + 1;
        }
    }
    &s[start..]
}

fn main() {
    println!("{}", last_word("learn rust today"));
    println!("{}", last_word("solo"));
}
```

```text
today
solo
```

</details>

## মনে রাখো

- `&str` ধার-করা view, `String` মালিকানাওয়ালা। literal মানেই `&str`।
- `&s[a..b]` কপি করে না, সংখ্যাগুলো byte index।
- parameter-এ `&str` আর `&[T]` লেখো।
- slice একটা borrow, তাই সে থাকতে মূল ডেটা বদলানো যায় না।
