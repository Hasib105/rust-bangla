---
title: "Slices: কাটা অংশের view"
short: "Slices"
part: 2
order: 9
summary: "`&str` আর `&[T]` হলো কোনো ডেটার একটা অংশের দিকে তাকানো, কপি না করেই।"
icon: "🍰"
minutes: 8
video: "vsPqPd_FsBs"
---

## কেন শিখবো?

ধরো একটা বাক্য থেকে প্রথম শব্দটা বের করতে হবে। কপি করলে বাড়তি memory লাগে। শুধু index (যেমন `5`) ফেরত দিলে মূল String বদলে গেলে সেই index ভুল হয়ে যায়, আর compiler কিছুই বলে না।
**Slice** দুটোর সমাধান: এটা মূল ডেটার একটা অংশের দিকে তাকানো (borrow), কপি ছাড়া। আর borrow-এর নিয়ম মেনে চলে বলে ভুল হলে compiler ধরে।

## `String` আর `&str`

`String` হলো heap-এর মালিকানাওয়ালা, বাড়তে পারে এমন text। আর `&str` হলো কোনো text-এর দিকে একটা ধার-করা view। string literal `"hello"`-এর type আসলে `&str`।

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

## String slice

`&s[start..end]` লিখলে `start` থেকে `end`-এর আগ পর্যন্ত অংশটা পাওয়া যায়। সংখ্যাগুলো **byte** index। শুরু বা শেষ বাদ দেওয়া যায়: `[..5]`, `[6..]`, `[..]`।

```rust
fn main() {
    let s = String::from("hello world");
    let hello = &s[0..5];
    let world = &s[6..];
    println!("{hello}|{world}|{}", &s[..]);
}
```

```text
hello|world|hello world
```

এখানে ইংরেজি অক্ষর ধরেছি, যেগুলো প্রতিটা ১ byte। বাংলা বা emoji-র মতো অক্ষর একাধিক byte নেয়, ওগুলো নিয়ে strings-এর পাঠে কথা হবে।

## উদাহরণ: `first_word`

প্রথম শব্দ মানে প্রথম space পর্যন্ত অংশ। function `&str` নিয়ে `&str` ফেরত দেয়, কপি হয় না।

```rust
fn first_word(s: &str) -> &str {
    for (i, ch) in s.char_indices() {
        if ch == ' ' {
            return &s[..i];
        }
    }
    s // no space: the whole text is one word
}

fn main() {
    let text = String::from("hello brave world");
    println!("{}", first_word(&text));
    println!("{}", first_word("rust"));
}
```

```text
hello
rust
```

`first_word(s: &str)` লেখার সুবিধা হলো, এটা `String` আর literal দুটোই নিতে পারে। `&String` পাঠালে Rust নিজে `&str`-এ বদলে দেয়। তাই function-এর parameter-এ সবসময় `&String`-এর বদলে `&str` লেখো।

## Array আর Vec-এর slice: `&[T]`

একই বুদ্ধি array-এর জন্যও আছে। `&[i32]` মানে কতগুলো `i32`-এর একটা ধার-করা view।

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

প্রথমটা পুরো array-র যোগফল। দ্বিতীয়টা `2 + 3 + 4`।

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

`word` হলো `s`-এর একটা `&` borrow, আর `clear()` চায় `&mut`। গত পাঠের নিয়ম: পাঠক থাকতে লেখক চলবে না। ভাগ্যিস! `clear()`-এর পরে `word` মরা memory দেখাতো।
ঠিক করতে `println!("{word}")` আগে করো, তারপর `s.clear()`।

## নিজে করো

`last_word(s: &str) -> &str` লেখো, যা শেষ শব্দটা দেবে। ইঙ্গিত: `first_word`-এর মতোই `char_indices()` দিয়ে ঘুরো। প্রতিবার space পেলে `start = i + 1` করে রাখো। শেষে `&s[start..]` ফেরত দাও।

<details>
<summary>সমাধান দেখো</summary>

`start` শুরুতে `0`। প্রতি space-এর পরেই নতুন শব্দ শুরু হয়, তাই শেষ space-এর পরের অংশটাই শেষ শব্দ। space না থাকলে `start` `0` থেকে যায়, মানে পুরো text।

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

- `&str` হলো text-এর ধার-করা view, `String` হলো মালিকানাওয়ালা text। literal মানেই `&str`।
- `&s[a..b]` একটা slice দেয়, কপি করে না। সংখ্যাগুলো byte index।
- parameter-এ `&String`-এর বদলে `&str`, আর `&Vec<T>`-এর বদলে `&[T]` লেখো। তাহলে function বেশি জায়গায় কাজ করে।
- slice একটা borrow, তাই সে বেঁচে থাকতে মূল ডেটা বদলানো যায় না।
