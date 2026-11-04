---
title: "প্রজেক্ট: নিজের grep বানাও"
short: "mini grep"
part: 10
order: 38
summary: "এ পর্যন্ত যা শিখেছো তা দিয়ে একটা command line tool: Config struct, Result দিয়ে error, আর logic আলাদা করে test করা।"
icon: "🔎"
minutes: 6
---

## কেন শিখবো?

এবার একটা আসল প্রজেক্ট: ছোট `grep`, যেটা ফাইল থেকে query আছে এমন লাইন দেখায় (`cargo run -- rust poem.txt -i`)।
struct, `Result`, iterator আর lifetime একসাথে কাজে লাগবে: **logic আলাদা, input/output আলাদা**।

## search: মূল কাজ

`search` শুধু `&str` নিয়ে কাজ করে, ফাইল লাগে না। ফেরত লাইনগুলো `text`-এর অংশ, তাই return type-এ lifetime `'a` লাগে। ছোট-বড় হাতের পার্থক্য এড়াতে দুই দিকেই `to_lowercase()` করে `contains` চালাও।

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

## Config আর Result

argument আসে `env::args()` থেকে; প্রথমটা program-এর নাম। ভুল হলে panic না করে `Result` দিয়ে error ফেরত দাও।

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

## main: args, ফাইল, exit

`main` শুধু args তোলে, Config বানায়, ফাইল পড়ে, `run` চালায়। error যায় `eprintln!` দিয়ে stderr-এ, আর ব্যর্থ হলে `process::exit(1)`।

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

## lib আর test

`main.rs` ছোট রাখো, সব logic `src/lib.rs`-এ (`pub`)। কারণ lib-এর function ফাইল বা terminal ছাড়াই test করা যায়। `main.rs` ডাকে `use minigrep::{Config, run};`।

```rust ignore
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ignore_case_works() {
        let config = Config { query: "RUST".to_string(), ignore_case: true };
        assert_eq!(search(&config, "I love rust"), vec!["I love rust"]);
    }
}
```

`cargo test` চালালেই test চলে।

## সাধারণ ভুল

```rust compile_fail
fn main() {
    let args: Vec<String> = vec![String::from("minigrep"), String::from("rust")];
    let query = args[1]; // error[E0507]: cannot move out of index of `Vec<String>`
    println!("{query}");
}
```

index করে move করা যায় না। `&args[1]` (borrow) বা `args[1].clone()` লেখো।

## নিজে করো

`count_matches(query: &str, text: &str) -> usize` লেখো, যেটা কতগুলো লাইনে query আছে গুনে ফেরত দেয়। `filter` আর `count` ব্যবহার করো।

<details>
<summary>সমাধান দেখো</summary>

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

- `main` ছোট রাখো; logic `lib.rs`-এ, যাতে `cargo test` দিয়ে test হয়।
- argument আসে `env::args()` থেকে, প্রথমটা program-এর নাম।
- error `eprintln!`-এ stderr-এ, আর `process::exit(1)`।
- input থেকে আসা `&str` ফেরত দিলে return type-এ lifetime `'a` লাগে।
