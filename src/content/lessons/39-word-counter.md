---
title: "ক্যাপস্টোন: multi-thread word counter"
short: "Word counter"
part: 10
order: 39
summary: "text-কে ভাগ করে scoped thread-এ শব্দ গোনা, ফল merge করা, top-N সাজানো আর নিজের error type, সব একসাথে।"
icon: "📊"
minutes: 6
---

## কেন শিখবো?

Capstone: বড় text-এ কোন শব্দ কতবার এসেছে, একাধিক thread দিয়ে গোনা।
ধাঁচটা: **ভাগ করো, আলাদা করো, জোড়া দাও** (split, process, merge)।

## ধাপ ১: এক thread-এর গোনা

শব্দের দুইপাশের চিহ্ন কেটে lowercase করি, যাতে "Rust" আর "rust." এক শব্দ হয়। `HashMap`-এর ক্রম ঠিক নেই, তাই print-এর আগে sort করি।

```rust
use std::collections::HashMap;

fn count_words(text: &str) -> HashMap<String, usize> {
    let mut map = HashMap::new();
    for word in text.split_whitespace() {
        let word = word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
        if !word.is_empty() {
            *map.entry(word).or_insert(0) += 1;
        }
    }
    map
}

fn main() {
    let map = count_words("Rust is fast. Rust is safe!");
    let mut pairs: Vec<(&String, &usize)> = map.iter().collect();
    pairs.sort();
    for (word, n) in pairs {
        println!("{word}: {n}");
    }
}
```

```text
fast: 1
is: 2
rust: 2
safe: 1
```

## ধাপ ২: ভাগ করা আর merge করা

লাইনগুলো `chunks` করে প্রতি chunk-এর জন্য একটা scoped thread চালাই। scope শেষে সব thread join হয়, তাই `Arc` বা clone ছাড়াই borrow চলে। প্রতিটা thread নিজের `HashMap` ফেরত দেয়, main সেগুলো যোগ করে। তাই **কোনো `Mutex` লাগে না**।

```rust
use std::collections::HashMap;
use std::thread;

fn count_words(text: &str) -> HashMap<String, usize> {
    let mut map = HashMap::new();
    for word in text.split_whitespace() {
        let word = word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
        if !word.is_empty() {
            *map.entry(word).or_insert(0) += 1;
        }
    }
    map
}

fn main() {
    let lines = ["a b a", "b c", "a c c", "d"];
    let size = lines.len().div_ceil(2); // lines per thread
    let partials: Vec<HashMap<String, usize>> = thread::scope(|s| {
        let handles: Vec<_> = lines
            .chunks(size)
            .map(|chunk| s.spawn(move || count_words(&chunk.join("\n"))))
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).collect()
    });

    let mut total: HashMap<String, usize> = HashMap::new();
    for part in partials {
        for (word, n) in part {
            *total.entry(word).or_insert(0) += n;
        }
    }
    let mut pairs: Vec<_> = total.into_iter().collect();
    pairs.sort();
    println!("{pairs:?}");
}
```

```text
[("a", 3), ("b", 2), ("c", 3), ("d", 1)]
```

## ধাপ ৩: top-N আর নিজের error

বেশি count আগে; সমান হলে বর্ণানুক্রম, যাতে ফল স্থির থাকে। `CountError`-এ `Display` + `Error` impl থাকায় `Box<dyn Error>` আর `?` চলে।

```rust
use std::fmt;

#[derive(Debug)]
enum CountError {
    EmptyText,
    ZeroThreads,
}

impl fmt::Display for CountError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            CountError::EmptyText => write!(f, "the text is empty"),
            CountError::ZeroThreads => write!(f, "need at least one thread"),
        }
    }
}

impl std::error::Error for CountError {}

fn check(text: &str, threads: usize) -> Result<(), CountError> {
    if threads == 0 {
        return Err(CountError::ZeroThreads);
    }
    if text.trim().is_empty() {
        return Err(CountError::EmptyText);
    }
    Ok(())
}

fn main() {
    let mut pairs = vec![("b", 2), ("a", 2), ("c", 5)];
    pairs.sort_by(|x, y| y.1.cmp(&x.1).then(x.0.cmp(y.0)));
    println!("{pairs:?}");
    for (t, input) in [(0, "x"), (2, "   ")] {
        if let Err(e) = check(input, t) {
            println!("error: {e}");
        }
    }
}
```

```text
[("c", 5), ("a", 2), ("b", 2)]
error: need at least one thread
error: the text is empty
```

## সাধারণ ভুল

```rust compile_fail
use std::thread;

fn main() {
    let lines = vec!["a b", "b c"];
    let h = thread::spawn(|| {
        println!("{}", lines.len());
    });
    h.join().unwrap();
}
```

`spawn`-এর thread `'static` হতে চায়, কিন্তু `lines` শুধু `main`-এ বাঁচে (`closure may outlive the current function`)। `thread::scope` ব্যবহার করো বা `move` দাও।

## নিজে করো

`("x", 1), ("y", 3), ("a", 3)` তালিকা sort করো: বেশি count আগে, সমান হলে বর্ণানুক্রম।

<details>
<summary>সমাধান দেখো</summary>

```rust
fn main() {
    let mut pairs = vec![("x", 1), ("y", 3), ("a", 3)];
    pairs.sort_by(|p, q| q.1.cmp(&p.1).then(p.0.cmp(q.0)));
    println!("{pairs:?}");
}
```

```text
[("a", 3), ("y", 3), ("x", 1)]
```

</details>

## মনে রাখো

- ভাগ করো, প্রতি thread আলাদা map বানাক, main-এ merge করো; lock লাগে না।
- `thread::scope`-এর thread local data borrow করতে পারে।
- `HashMap`-এর ক্রম ঠিক নেই: `Vec`-এ নিয়ে sort করো।
- sort-এ `.then(...)` দিয়ে দ্বিতীয় শর্ত বসাও।
