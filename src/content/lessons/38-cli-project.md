---
title: "প্রজেক্ট: নিজের grep বানাও"
short: "mini grep"
part: 10
order: 38
summary: "এ পর্যন্ত যা শিখেছো তা দিয়ে একটা command line tool: Config struct, Result দিয়ে error, আর logic আলাদা করে test করা।"
icon: "🔎"
minutes: 10
---

## কেন শিখবো?

এতদিন ছোট ছোট উদাহরণ করেছো। এবার একটা আসল প্রজেক্ট: `grep`-এর ছোট সংস্করণ, যেটা একটা ফাইলের ভেতর থেকে কোনো শব্দ আছে এমন লাইনগুলো দেখায়।
এই প্রজেক্টে struct, `Result`, iterator, lifetime আর module সব একসাথে কাজে লাগবে। আর বড় প্রোগ্রাম কীভাবে সাজাতে হয়, সেটাও শিখবে: **logic আলাদা, input/output আলাদা**।

আমরা চাই এরকম ব্যবহার:

```bash
cargo run -- rust poem.txt
cargo run -- rust poem.txt -i
```

প্রথম word `rust` হলো যা খুঁজবো, তারপর ফাইলের নাম, আর `-i` দিলে ছোট-বড় হাতের অক্ষর গণ্য করা হবে না।

## প্রথমে মূল কাজ: search

সবচেয়ে মজার অংশ আগে বানাই: একটা text থেকে query আছে এমন লাইনগুলো বের করা। এটা শুধু `&str` নিয়ে কাজ করে, ফাইল লাগে না, তাই সহজে test করা যায়।
ফেরত দেওয়া লাইনগুলো মূল text-এর অংশ (borrow), তাই return type-এ lifetime `'a` লাগে।

```rust
fn search<'a>(query: &str, text: &'a str) -> Vec<&'a str> {
    let mut found = Vec::new();
    for line in text.lines() {
        if line.contains(query) {
            found.push(line);
        }
    }
    found
}

fn main() {
    let text = "Rust is fast.\nPython is easy.\nRust is safe.\nGo is simple.";
    for line in search("Rust", text) {
        println!("{line}");
    }
}
```

```text
Rust is fast.
Rust is safe.
```

`'a` বলছে: ফেরত আসা প্রতিটা লাইন `text`-এর মতোই ততক্ষণ বেঁচে থাকবে। `query`-র সাথে তার কোনো সম্পর্ক নেই।

## Config আর Result দিয়ে argument পড়া

command line argument আসে `std::env::args()` থেকে। প্রথম argument সবসময় program-এর নাম। argument ঠিক না থাকলে program-কে panic করানো ভালো না। তাই `Result` দিয়ে সুন্দর error message ফেরত দিই।
আমরা argument-গুলোকে একটা `Config` struct-এ গুছিয়ে রাখি। নিচের উদাহরণে `args` এখানে হাতে বানানো, যাতে এখানেই চালিয়ে দেখা যায়:

```rust
struct Config {
    query: String,
    ignore_case: bool,
}

impl Config {
    fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("usage: minigrep <query> <file> [-i]");
        }
        let query = args[1].clone();
        let ignore_case = args.iter().any(|a| a == "-i");
        Ok(Config { query, ignore_case })
    }
}

fn main() {
    let good: Vec<String> = ["minigrep", "rust", "poem.txt", "-i"]
        .iter()
        .map(|s| s.to_string())
        .collect();
    let bad: Vec<String> = vec![String::from("minigrep"), String::from("rust")];

    match Config::build(&good) {
        Ok(c) => println!("query = {}, ignore_case = {}", c.query, c.ignore_case),
        Err(e) => println!("error: {e}"),
    }
    match Config::build(&bad) {
        Ok(c) => println!("query = {}", c.query),
        Err(e) => println!("error: {e}"),
    }
}
```

```text
query = rust, ignore_case = true
error: usage: minigrep <query> <file> [-i]
```

আসল `main.rs`-এ শুধু এই পার্থক্য: `args` আসে `env::args()` থেকে, আর ফাইল পড়া হয় `fs::read_to_string` দিয়ে। এগুলো ফাইল আর terminal ছাড়া চলে না, তাই এখানে `ignore` block:

```rust ignore
use std::{env, fs, process};

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = Config::build(&args).unwrap_or_else(|err| {
        eprintln!("problem: {err}");
        process::exit(1);
    });
    let text = fs::read_to_string(&args[2]).unwrap_or_else(|err| {
        eprintln!("cannot read {}: {err}", args[2]);
        process::exit(1);
    });
    if let Err(e) = run(&config, &text) {
        eprintln!("{e}");
        process::exit(1);
    }
}
```

`eprintln!` error-কে stderr-এ পাঠায়, যাতে `>` দিয়ে output ফাইলে সেভ করলে error তাতে মিশে না যায়। `process::exit(1)` মানে "ব্যর্থ হয়েছে", shell এটা বুঝতে পারে।

## সব জোড়া দেওয়া: ignore_case সহ run

এবার `Config` ব্যবহার করে `search` আর `run`। ফাইলের বদলে এখানেও একটা fixed text। `run` একটা `Result` ফেরত দেয়: কিছু না পেলে `Err`।

```rust
struct Config {
    query: String,
    ignore_case: bool,
}

fn search<'a>(config: &Config, text: &'a str) -> Vec<&'a str> {
    let query = if config.ignore_case {
        config.query.to_lowercase()
    } else {
        config.query.clone()
    };
    text.lines()
        .filter(|line| {
            if config.ignore_case {
                line.to_lowercase().contains(&query)
            } else {
                line.contains(&query)
            }
        })
        .collect()
}

fn run(config: &Config, text: &str) -> Result<usize, String> {
    let hits = search(config, text);
    if hits.is_empty() {
        return Err(format!("no line contains {:?}", config.query));
    }
    for (i, line) in hits.iter().enumerate() {
        println!("{}: {line}", i + 1);
    }
    Ok(hits.len())
}

fn main() {
    let text = "Rust is fast.\nrust is friendly.\nPython is easy.\nI love RUST.";
    let strict = Config { query: String::from("rust"), ignore_case: false };
    let loose = Config { query: String::from("rust"), ignore_case: true };
    let missing = Config { query: String::from("java"), ignore_case: true };

    println!("case sensitive:");
    println!("found {:?}", run(&strict, text));
    println!("ignore case:");
    println!("found {:?}", run(&loose, text));
    println!("{:?}", run(&missing, text));
}
```

```text
case sensitive:
1: rust is friendly.
found Ok(1)
ignore case:
1: Rust is fast.
2: rust is friendly.
3: I love RUST.
found Ok(3)
Err("no line contains \"java\"")
```

## lib আর main আলাদা করা, আর test

বড় প্রজেক্টে নিয়ম হলো: `main.rs` খুব ছোট রাখো (শুধু argument পড়ে আর ফাইল খোলে), আর সব logic রাখো `src/lib.rs`-এ। কারণ `main` test করা কঠিন, কিন্তু lib-এর function সহজেই test করা যায়।

```text
minigrep/
├── Cargo.toml
└── src/
    ├── lib.rs     <- Config, search, run (pub)
    └── main.rs    <- env::args, fs, process::exit
```

`main.rs`-এ lib-কে crate-এর নামে ডাকো: `use minigrep::{Config, run};`। আর `lib.rs`-এর function-গুলো `pub` করতে হবে। test লেখো `lib.rs`-এর নিচেই:

```rust ignore
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_matching_lines() {
        let config = Config { query: "fast".to_string(), ignore_case: false };
        let text = "Rust is fast.\nPython is easy.";
        assert_eq!(search(&config, text), vec!["Rust is fast."]);
    }

    #[test]
    fn ignore_case_works() {
        let config = Config { query: "RUST".to_string(), ignore_case: true };
        assert_eq!(search(&config, "I love rust"), vec!["I love rust"]);
    }
}
```

`cargo test` চালালে দুটো test-ই পাস করবে।

## সাধারণ ভুল

`Vec<String>` থেকে index দিয়ে সরাসরি `String` তুলে নেওয়া:

```rust compile_fail
fn main() {
    let args: Vec<String> = vec![String::from("minigrep"), String::from("rust")];
    let query = args[1]; // error[E0507]: cannot move out of index of `Vec<String>`
    println!("{query}");
}
```

index করলে vector-এর ভেতরের জিনিস move করে বের করা যায় না, কারণ তাহলে vector অর্ধেক খালি হয়ে যেতো। compiler নিজেই দুটো উপায় বলে: `&args[1]` (borrow) অথবা `args[1].clone()` (কপি), যেটা আমরা `Config::build`-এ করেছি।

## নিজে করো

আমাদের `search` লাইনগুলো ফেরত দেয়। এবার `count_matches(query: &str, text: &str) -> usize` লেখো, যেটা শুধু কতগুলো লাইনে query আছে তা গুনে ফেরত দেয়। iterator-এর `filter` আর `count` ব্যবহার করো।

<details>
<summary>সমাধান দেখো</summary>

`lines()` প্রতিটা লাইন দেয়, `filter` সেখান থেকে মেলা লাইনগুলো রাখে, আর `count()` গুনে দেয়। কোনো `Vec` বানাতে হয় না।

```rust
fn count_matches(query: &str, text: &str) -> usize {
    text.lines().filter(|line| line.contains(query)).count()
}

fn main() {
    let text = "one fish\ntwo fish\nred fish\nblue bird";
    println!("fish: {}", count_matches("fish", text));
    println!("cat: {}", count_matches("cat", text));
}
```

```text
fish: 3
cat: 0
```

</details>

## মনে রাখো

- `main` ছোট রাখো। argument পড়া আর ফাইল খোলা সেখানে, বাকি সব logic `lib.rs`-এ।
- argument আসে `env::args()` থেকে, প্রথমটা program-এর নাম। ভুল input হলে panic না করে `Result` দিয়ে error দাও।
- error `eprintln!` দিয়ে stderr-এ, আর ব্যর্থ হলে `process::exit(1)`।
- logic শুধু `&str` নিয়ে লিখলে ফাইল ছাড়াই test করা যায়: `#[cfg(test)]` আর `cargo test`।
- ফেরত দেওয়া `&str` যদি input text থেকে আসে, return type-এ সেই lifetime (`'a`) লাগে।
