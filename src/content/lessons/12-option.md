---
title: "Option: null-এর বদলে নিরাপদ পথ"
short: "Option"
part: 3
order: 12
summary: "Rust-এ null নেই। value থাকতেও পারে, নাও পারে, এটা `Option<T>` দিয়ে type-এ লেখা হয়।"
icon: "📦"
minutes: 9
---

## কেন শিখবো?

অনেক ভাষায় `null` আছে: Java-তে `NullPointerException`, JS-এ `undefined is not a function`। null-এর আবিষ্কর্তা নিজেই একে "billion dollar mistake" বলেছেন। সমস্যা হলো, null-টা type দেখে বোঝা যায় না, আর চেক করতে ভুলে গেলে program চলতে চলতে হঠাৎ crash করে।
Rust-এ null নেই। বদলে আছে একটা সাধারণ enum, `Option<T>`। value না থাকার সম্ভাবনাটা type-এই লেখা থাকে, আর compiler তোমাকে সেটা সামলাতে বাধ্য করে।

## `Option<T>`: Some অথবা None

```rust ignore
enum Option<T> {
    Some(T), // there is a value
    None,    // there is nothing
}
```

এটা std-এর ভেতরেই আছে, আলাদা করে import করতে হয় না। যে function ব্যর্থ হতে পারে, সে `Option` ফেরত দেয়।

```rust
fn divide(a: i32, b: i32) -> Option<i32> {
    if b == 0 {
        None
    } else {
        Some(a / b)
    }
}

fn main() {
    println!("{:?}", divide(10, 2));
    println!("{:?}", divide(10, 0));
    match divide(9, 3) {
        Some(v) => println!("result = {v}"),
        None => println!("cannot divide"),
    }
}
```

```text
Some(5)
None
result = 3
```

`Option<i32>` আর `i32` সম্পূর্ণ আলাদা type। তাই `Some(5)`-কে সরাসরি সংখ্যা হিসেবে ব্যবহার করা যায় না। আগে ভেতরের value বের করতে হয়, আর সেই সময়েই তোমাকে `None`-এর কথা ভাবতে হয়।

## বের করার সহজ উপায়: `unwrap_or`, `map`

প্রতিবার `match` লেখা লম্বা হয়। ছোট কাজের জন্য কয়েকটা method আছে:

- `unwrap_or(default)`: `Some` হলে ভেতরের value, `None` হলে default।
- `map(f)`: `Some`-এর ভেতরে `f` চালায়, `None` হলে `None`-ই থাকে।

`|n| n * 2` হলো একটা ছোট নামহীন function (closure), এটা নিয়ে পরে আলাদা পাঠ আছে। এখন শুধু "n নাও, n * 2 ফেরত দাও" পড়ে নাও।

```rust
fn main() {
    let nums = [10, 20, 30];

    println!("{}", nums.get(1).unwrap_or(&0));
    println!("{}", nums.get(9).unwrap_or(&0));
    println!("{:?}", nums.get(1).map(|n| n * 2));
    println!("{:?}", nums.get(9).map(|n| n * 2));
}
```

```text
20
0
Some(40)
None
```

`.get(i)` index ঠিক থাকলে `Some(&value)`, বাইরে হলে `None` দেয়। `nums[9]` লিখলে panic হতো, কিন্তু `get` নিরাপদ।

## `and_then`: Option-এর চেইন

একটা ধাপ নিজেই `Option` দিলে `map` ব্যবহার করলে `Option<Option<..>>` হয়ে যায়। তখন `and_then` লাগে। যেকোনো ধাপে `None` এলে বাকি সব ধাপ বাদ যায়।

```rust
fn half(n: i32) -> Option<i32> {
    if n % 2 == 0 { Some(n / 2) } else { None }
}

fn main() {
    println!("{:?}", Some(8).and_then(half).and_then(half));
    println!("{:?}", Some(6).and_then(half).and_then(half));
}
```

```text
Some(2)
None
```

প্রথমটায় `8 -> 4 -> 2`। দ্বিতীয়টায় `6 -> 3`, আর `3` বিজোড় বলে `half(3)` `None` দেয়।

## `if let`, `let else` আর `?`

একটা variant-এ আগ্রহ থাকলে `if let` সুবিধাজনক। আর "value না থাকলে এখনই বেরিয়ে যাও" ধরনের কাজে আছে `let else`: মিললে variable পাওয়া যায়, না মিললে `else` ব্লককে বেরিয়ে যেতে হয় (`return`, `break` ইত্যাদি)।

```rust
fn show(v: Option<i32>) {
    let Some(n) = v else {
        println!("nothing to show");
        return;
    };
    println!("got {n}");
}

fn main() {
    if let Some(c) = "rust".chars().next() {
        println!("first letter: {c}");
    }
    show(Some(7));
    show(None);
}
```

```text
first letter: r
got 7
nothing to show
```

আর `Option` ফেরত দেওয়া function-এর ভেতরে `?` লিখলে `Some` হলে value খুলে আসে, `None` হলে function সেখানেই `None` ফেরত দিয়ে শেষ হয়।

```rust
fn initial_upper(name: &str) -> Option<char> {
    let c = name.chars().next()?; // empty text: return None here
    Some(c.to_ascii_uppercase())
}

fn main() {
    println!("{:?}", initial_upper("rust"));
    println!("{:?}", initial_upper(""));
}
```

```text
Some('R')
None
```

## সাধারণ ভুল

`Option<i32>`-কে সরাসরি `i32`-এর মতো ব্যবহার করা:

```rust compile_fail
fn main() {
    let x: Option<i32> = Some(5);
    let y = x + 1; // error[E0369]: cannot add `{integer}` to `Option<i32>`
    println!("{y}");
}
```

compiler বলছে `Option<i32>` আর সংখ্যা যোগ করা যায় না। আগে `match`, `unwrap_or` বা `if let` দিয়ে ভেতরের value বের করো, যেমন `x.unwrap_or(0) + 1`।
`.unwrap()` নামে একটা method আছে যা `None` পেলে **panic** করে program থামিয়ে দেয়। তাড়াহুড়ো বা পরীক্ষার কোড ছাড়া এটা এড়িয়ে চলো।

## নিজে করো

`find_even(nums: &[i32]) -> Option<i32>` লেখো, যা slice-এর প্রথম জোড় সংখ্যা `Some`-এ দেবে, না পেলে `None`। 
`main`-এ `[3, 5, 8, 9]` আর `[1, 3]` দিয়ে চালাও। প্রথমটা `if let` দিয়ে, দ্বিতীয়টা `unwrap_or(-1)` দিয়ে print করো।

<details>
<summary>সমাধান দেখো</summary>

loop-এর ভেতরে জোড় সংখ্যা পেলেই `return Some(n)`। loop শেষ হয়ে গেলে কিছু পাওয়া যায়নি, তাই `None`।

```rust
fn find_even(nums: &[i32]) -> Option<i32> {
    for &n in nums {
        if n % 2 == 0 {
            return Some(n);
        }
    }
    None
}

fn main() {
    if let Some(n) = find_even(&[3, 5, 8, 9]) {
        println!("found {n}");
    }
    println!("{}", find_even(&[1, 3]).unwrap_or(-1));
}
```

```text
found 8
-1
```

</details>

## মনে রাখো

- Rust-এ null নেই। value থাকতে বা না থাকতে পারলে type হয় `Option<T>`, যার রূপ `Some(v)` বা `None`।
- `Option<T>` আর `T` আলাদা type, তাই `None`-এর কথা ভুলে যাওয়ার উপায় নেই।
- ছোট কাজে `unwrap_or`, `map`, `and_then`। একটা রূপ দেখতে `if let`, না পেলে বের হতে `let else`।
- `?` চালালে `None` সঙ্গে সঙ্গে function থেকে ফেরত যায়। `unwrap()` `None`-এ panic করে, তাই এড়িয়ে চলো।
