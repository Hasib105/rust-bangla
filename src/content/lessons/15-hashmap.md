---
title: "HashMap: key দিয়ে খোঁজা"
short: "HashMap"
part: 3
order: 15
summary: "HashMap key দিয়ে value খুঁজে দেয়, প্রায় এক ধাপে। সাথে শিখবে entry দিয়ে গোনা, sorted BTreeMap আর duplicate-ছাড়া HashSet।"
icon: "🗺️"
minutes: 9
video: "3FC3MaOfHQw"
---

## কেন শিখবো?

"রহিমের নম্বর কত?" Vec-এ খুঁজতে হলে প্রথম থেকে প্রতিটা element দেখতে হয়। ডেটা যত বাড়ে, ততই ধীর।
Python-এর `dict` বা JS-এর `Map`-এর মতো **`HashMap<K, V>`** key থেকে সরাসরি value-তে চলে যায়, আর গড়ে সময় লাগে প্রায় সমান, ডেটা ১০ হোক বা ১০ লাখ।
শব্দ গোনা, cache, user id থেকে নাম খোঁজা, এই ধরনের কাজে HashMap রোজ লাগে।

## insert আর get

`HashMap` std library-র `collections`-এ থাকে, তাই আগে `use` করতে হয়। `insert(key, value)` দিয়ে ঢোকাও। একই key আবার insert করলে পুরোনো value বদলে যায়।
`get(&key)` ফেরত দেয় `Option`, কারণ key নাও থাকতে পারে। আর `map[key]` সরাসরি value দেয়, কিন্তু key না থাকলে panic।

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert("rahim", 80);
    scores.insert("karim", 90);

    println!("{:?}", scores.get("rahim"));
    println!("{:?}", scores.get("nobody"));
    println!("{}", scores.len());

    scores.insert("rahim", 85); // same key: old value replaced
    println!("{}", scores["rahim"]);
    println!("{}", scores.len());
}
```

```text
Some(80)
None
2
85
2
```

## entry().or_insert: গুনতে গুনতে বাড়ানো

শব্দ গোনার কাজটা ভাবো: শব্দটা আগে দেখা থাকলে সংখ্যা বাড়াও, না থাকলে ০ থেকে শুরু করো। এই "আছে কি নেই" দেখার ঝামেলা সামলায় `entry(key).or_insert(0)`।
সে map-এর ভেতরের value-র একটা `&mut` ফেরত দেয়, তাই `*` দিয়ে সোজা `+= 1` করা যায়।

HashMap-এর iterate করার ক্রম **এলোমেলো** (প্রতিবার আলাদা হতে পারে)। তাই output সবসময় এক রাখতে হলে আগে Vec-এ তুলে sort করো।

```rust
use std::collections::HashMap;

fn main() {
    let text = "a b a c b a";
    let mut counts = HashMap::new();
    for w in text.split_whitespace() {
        *counts.entry(w).or_insert(0) += 1;
    }

    let mut pairs: Vec<_> = counts.iter().collect();
    pairs.sort();
    for (word, n) in pairs {
        println!("{word}: {n}");
    }
}
```

```text
a: 3
b: 2
c: 1
```

## BTreeMap: নিজে থেকেই sorted

প্রতিবার sort করা বিরক্তিকর হলে `BTreeMap` নাও। API প্রায় একই, কিন্তু key সবসময় ছোট থেকে বড় ক্রমে থাকে। দাম হিসেবে lookup একটু ধীর (গড়ে O(log n))।
সাজানো output লাগলে BTreeMap, শুধু দ্রুত খোঁজা লাগলে HashMap।

```rust
use std::collections::BTreeMap;

fn main() {
    let mut m = BTreeMap::new();
    m.insert("pear", 3);
    m.insert("apple", 5);
    m.insert("mango", 1);
    for (name, qty) in &m {
        println!("{name} = {qty}");
    }
}
```

```text
apple = 5
mango = 1
pear = 3
```

## HashSet: শুধু key, duplicate নেই

যদি শুধু জানতে চাও "এটা কি আছে?" বা duplicate বাদ দিতে চাও, value লাগে না। তখন `HashSet`। `insert` ফেরত দেয় `bool`: নতুন হলে `true`, আগে থেকে থাকলে `false`।

```rust
use std::collections::HashSet;

fn main() {
    let mut seen = HashSet::new();
    println!("{}", seen.insert(3));
    println!("{}", seen.insert(3));
    seen.insert(7);
    println!("{}", seen.contains(&7));
    println!("{}", seen.len());
}
```

```text
true
false
true
2
```

## সাধারণ ভুল

`insert` করলে key আর value দুটোই map-এর কাছে **move** হয়ে যায়। `String` key-র পরে সেই variable আর ব্যবহার করা যায় না:

```rust compile_fail
use std::collections::HashMap;

fn main() {
    let name = String::from("rahim");
    let mut m = HashMap::new();
    m.insert(name, 1);
    println!("{name}"); // error[E0382]: borrow of moved value: `name`
}
```

`name` দরকার থাকলে `m.insert(name.clone(), 1)` লেখো, অথবা key হিসেবে `&str` ব্যবহার করো।

## নিজে করো

`"hello"` শব্দের প্রতিটা অক্ষর কতবার আছে গুনে print করো, অক্ষরের ক্রমে। `chars()` দিয়ে অক্ষর পাবে, আর sorted ক্রমের জন্য `BTreeMap` নাও।

<details>
<summary>সমাধান দেখো</summary>

```rust
use std::collections::BTreeMap;

fn main() {
    let mut freq = BTreeMap::new();
    for c in "hello".chars() {
        *freq.entry(c).or_insert(0) += 1;
    }
    for (c, n) in &freq {
        println!("{c}: {n}");
    }
}
```

```text
e: 1
h: 1
l: 2
o: 1
```

</details>

## মনে রাখো

- `HashMap<K, V>` key থেকে value দ্রুত খুঁজে দেয়। `use std::collections::HashMap;` লাগে।
- `get` দেয় `Option`, `map[key]` key না থাকলে panic করে। একই key আবার `insert` করলে value বদলায়।
- গোনার জন্য `*map.entry(key).or_insert(0) += 1` হলো চেনা ছক।
- HashMap-এর ক্রম এলোমেলো। ক্রম দরকার হলে sort করো, অথবা `BTreeMap` নাও।
- `HashSet` শুধু key রাখে, duplicate ঢোকে না। `insert` ফেরত দেয় নতুন কি না।
