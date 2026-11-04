---
title: "HashMap: key দিয়ে খোঁজা"
short: "HashMap"
part: 3
order: 15
summary: "HashMap key দিয়ে value খুঁজে দেয়, প্রায় এক ধাপে। সাথে শিখবে entry দিয়ে গোনা, sorted BTreeMap আর duplicate-ছাড়া HashSet।"
minutes: 5
---

## কেন শিখবো?

Vec-এ "রহিমের নম্বর কত?" খুঁজতে প্রতিটা element দেখতে হয়। Python-এর `dict`-এর মতো **`HashMap<K, V>`** key থেকে সরাসরি value-তে যায়, ডেটা ১০ হোক বা ১০ লাখ।

## `insert` আর `get`

`use std::collections::HashMap;` লাগে। একই key আবার `insert` করলে value বদলায়। `get(&key)` দেয় `Option`, আর `map[key]` key না থাকলে panic করে।

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert("rahim", 80);
    scores.insert("karim", 90);

    println!("{:?}", scores.get("rahim"));
    println!("{:?}", scores.get("nobody"));

    scores.insert("rahim", 85); // same key: old value replaced
    println!("{} {}", scores["rahim"], scores.len());
}
```

```text
Some(80)
None
85 2
```

## `entry().or_insert`: গোনা

আছে কি নেই দেখার ঝামেলা সামলায় `entry(key).or_insert(0)`। সে value-র `&mut` দেয়, তাই `*... += 1` চলে। HashMap-এর ক্রম **এলোমেলো**, তাই output ঠিক রাখতে আগে Vec-এ তুলে sort করো।

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

## `BTreeMap`: নিজে থেকেই sorted

API প্রায় একই, কিন্তু key সবসময় ছোট থেকে বড় ক্রমে থাকে। সাজানো output লাগলে `BTreeMap`, শুধু দ্রুত খোঁজা লাগলে `HashMap`।

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

## `HashSet`: duplicate নেই

শুধু "আছে কি?" জানতে বা duplicate বাদ দিতে `HashSet`। `insert` নতুন হলে `true`, আগে থাকলে `false` দেয়।

```rust
use std::collections::HashSet;

fn main() {
    let mut seen = HashSet::new();
    println!("{}", seen.insert(3));
    println!("{}", seen.insert(3));
    println!("{}", seen.len());
}
```

```text
true
false
1
```

## সাধারণ ভুল

`insert` করলে key আর value map-এর কাছে **move** হয়, তাই `String` key পরে ব্যবহার করা যায় না:

```rust compile_fail
use std::collections::HashMap;

fn main() {
    let name = String::from("rahim");
    let mut m = HashMap::new();
    m.insert(name, 1);
    println!("{name}"); // error[E0382]: borrow of moved value: `name`
}
```

`m.insert(name.clone(), 1)` লেখো, অথবা key হিসেবে `&str` নাও।

## নিজে করো

`"hello"`-র প্রতিটা অক্ষর কতবার আছে গুনে অক্ষরের ক্রমে print করো। `BTreeMap` নাও।

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

- `HashMap<K, V>` key থেকে value দ্রুত খোঁজে। `get` দেয় `Option`, `map[key]` panic করতে পারে।
- গোনার ছক: `*map.entry(key).or_insert(0) += 1`।
- HashMap-এর ক্রম এলোমেলো। ক্রম চাইলে sort করো বা `BTreeMap` নাও।
- `HashSet` শুধু key রাখে, `insert` ফেরত দেয় নতুন কি না।
