---
title: "ক্যাপস্টোন: multi-thread word counter"
short: "Word counter"
part: 10
order: 39
summary: "text-কে ভাগ করে scoped thread-এ শব্দ গোনা, ফল merge করা, top-N সাজানো আর নিজের error type, সব একসাথে।"
icon: "📊"
minutes: 10
---

## কেন শিখবো?

এটা কোর্সের capstone: একটা বড় text-এ কোন শব্দ কতবার এসেছে তা গুনবো, আর সেটা করবো একাধিক thread দিয়ে।
এখানে `HashMap`, `thread::scope`, iterator, `Result`, নিজের error type আর sorting একসাথে কাজ করবে। শিখবে একটা বড় কাজকে **ভাগ করো, আলাদা আলাদা করো, জোড়া দাও** (split, process, merge) এই ধাঁচে সাজানো।

পরিকল্পনা:

1. একটা thread-এর জন্য `count_words`, যা `HashMap<String, usize>` বানায়।
2. text-কে লাইন ধরে কয়েক ভাগ করে প্রতিভাগের জন্য একটা scoped thread।
3. সব ছোট map যোগ করে একটা বড় map।
4. বেশি আসা শব্দ আগে রেখে top-N sort।
5. ভুল input-এর জন্য নিজের error।

## ধাপ ১: এক thread-এর গোনা

শব্দ গোনার কাজ আগেই করেছো (`entry().or_insert()`)। এখানে শুধু শব্দের দুইপাশের চিহ্ন (`.`, `!`) কেটে lowercase করি, যাতে "Rust" আর "rust." একই শব্দ ধরা হয়। `HashMap`-এর ক্রম নির্ধারিত না, তাই print করার আগে sort করি।

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

text-এর লাইনগুলো `chunks(2)` দিয়ে ভাগ করে প্রতিভাগের জন্য একটা thread চালাই। `thread::scope` ব্যবহার করার সুবিধা হলো thread-গুলো `lines` থেকে সরাসরি borrow করতে পারে, `Arc` বা clone লাগে না, কারণ scope শেষ হওয়ার আগেই সব thread join হয়ে যায়।
প্রতিটা thread নিজের `HashMap` ফেরত দেয়। তারপর main thread সেগুলো একটা `total` map-এ যোগ করে। কোনো lock লাগে না, কারণ কেউ একই map-এ একসাথে লেখে না।

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
    let partials: Vec<HashMap<String, usize>> = thread::scope(|s| {
        let handles: Vec<_> = lines
            .chunks(2)
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

`handles`-এর join ক্রমানুসারে হয়, আর শেষে sort করা, তাই output সবসময় এক।

## ধাপ ৩: পুরো প্রোগ্রাম, top-N আর নিজের error

এবার সব জোড়া। এখানে নতুন দুটো জিনিস:

- `CountError` enum: `thread` সংখ্যা ০ হলে বা text ফাঁকা হলে ব্যর্থ। `Display` আর `Error` impl করা আছে, তাই `Box<dyn Error>` আর `?` দিয়ে কাজ করে।
- `top_n`: বেশি count আগে। count সমান হলে শব্দের বর্ণানুক্রম, যাতে ফল নির্ধারিত থাকে।

```rust
use std::collections::HashMap;
use std::fmt;
use std::thread;

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

fn parallel_count(text: &str, threads: usize) -> Result<HashMap<String, usize>, CountError> {
    if threads == 0 {
        return Err(CountError::ZeroThreads);
    }
    if text.trim().is_empty() {
        return Err(CountError::EmptyText);
    }
    let lines: Vec<&str> = text.lines().collect();
    let size = lines.len().div_ceil(threads);

    let partials: Vec<HashMap<String, usize>> = thread::scope(|s| {
        let handles: Vec<_> = lines
            .chunks(size)
            .map(|chunk| s.spawn(move || count_words(&chunk.join("\n"))))
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).collect()
    });

    let mut total = HashMap::new();
    for part in partials {
        for (word, n) in part {
            *total.entry(word).or_insert(0) += n;
        }
    }
    Ok(total)
}

fn top_n(map: HashMap<String, usize>, n: usize) -> Vec<(String, usize)> {
    let mut pairs: Vec<(String, usize)> = map.into_iter().collect();
    pairs.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    pairs.truncate(n);
    pairs
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let text = "the cat sat on the mat\nthe dog sat on the log\nA cat and a dog.\nThe end";
    let map = parallel_count(text, 3)?;
    for (word, n) in top_n(map, 4) {
        println!("{word:<4} {n}");
    }
    for (t, input) in [(0, "x"), (2, "   ")] {
        if let Err(e) = parallel_count(input, t) {
            println!("error: {e}");
        }
    }
    Ok(())
}
```

```text
the  5
a    2
cat  2
dog  2
error: need at least one thread
error: the text is empty
```

`div_ceil` দিয়ে প্রতি thread-এর লাইন সংখ্যা ঠিক করা হয়, যাতে সব লাইন কোনো না কোনো chunk-এ পড়ে। আসল প্রজেক্টে text ফাইল থেকে পড়লেই চলে: `fs::read_to_string`।

## সাধারণ ভুল

scoped thread-এর বদলে সাধারণ `thread::spawn`-এ local variable borrow করা:

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

`spawn`-এর thread program-এর যে কোনো সময় পর্যন্ত বেঁচে থাকতে পারে (`'static`), কিন্তু `lines` বেঁচে আছে শুধু `main`-এর ভেতরে। তাই compiler আপত্তি করে: `closure may outlive the current function`।
ঠিক করার উপায়: `thread::scope` ব্যবহার করো (যেমন ওপরে), অথবা `move` দিয়ে মালিকানা thread-এ পাঠাও।

## নিজে করো

`top_n`-এর sort-টা আলাদা করে পরীক্ষা করো। `("b", 2), ("a", 2), ("c", 5)` এই তালিকাকে sort করো: বেশি count আগে, সমান হলে শব্দের বর্ণানুক্রম।

<details>
<summary>সমাধান দেখো</summary>

`y.1.cmp(&x.1)` উল্টো দিক (বড় আগে) দেয়, আর `.then(...)` সমান হলে পরের শর্ত দেখে।

```rust
fn main() {
    let mut pairs = vec![("b", 2), ("a", 2), ("c", 5)];
    pairs.sort_by(|x, y| y.1.cmp(&x.1).then(x.0.cmp(y.0)));
    println!("{pairs:?}");
}
```

```text
[("c", 5), ("a", 2), ("b", 2)]
```

</details>

## মনে রাখো

- বড় কাজ: ভাগ করো, প্রতি thread-কে আলাদা ফল বানাতে দাও, তারপর main thread-এ merge করো। এতে lock লাগে না।
- `thread::scope` দিয়ে thread local data borrow করতে পারে, কারণ scope শেষে সব join হয়।
- `HashMap`-এর ক্রম নির্ধারিত না: print করার আগে `Vec`-এ নিয়ে sort করো।
- sort-এ `.then(...)` দিয়ে দ্বিতীয় শর্ত বসাও, যাতে সমান count-এও ফল স্থির থাকে।
- নিজের error enum-এ `Display` + `Error` impl করলে `?` আর `Box<dyn Error>` দিয়ে সহজে ব্যবহার করা যায়।
