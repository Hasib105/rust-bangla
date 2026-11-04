# Content guide (lessons + quizzes)

Every lesson is two files that share one id (`NN-slug`):

- `src/content/lessons/NN-slug.md`: the short lesson in Bangla
- `src/content/quizzes/NN-slug.json`: the game: 8–12 quiz cards in Bangla

Run `npm run check:content` before you commit. It compiles and runs every Rust block and checks it.

## Who reads it

Bangladeshi students and junior developers. Many know a bit of Python, C or JS, and some know no programming at all.
Write the way a friendly senior explains things in a Dhaka coffee shop: short sentences, everyday Bangla, and English technical words kept in English
(`ownership`, `borrow`, `compile`, `trait`, `thread`). Don't make up heavy Sanskrit-style Bangla terms.

**Code is English only.** Variable names, strings, comments and output inside code blocks are all English or ASCII. All Bangla goes in the prose.

## Lesson file

```md
---
title: "Ownership: Rust-এর হৃদয়"
short: "Ownership"          # 1–2 words for the board node
part: 2                     # see src/data/parts.ts
order: 7                    # global lesson number (01..40)
summary: "একটা value-এর মালিক একজনই। মালিক চলে গেলে value-ও মুছে যায়।"
icon: "🧠"
minutes: 8
video: "V59N9xxKfoU"        # optional, Rust Bangla YouTube id
---
```

Body. Keep it short: about 500–900 Bangla words plus code. Use these sections in this order:

1. `## কেন শিখবো?`: 2–4 lines. Give the real problem this topic solves, ideally compared to C, Python or JS.
2. Two to four idea sections (`## ...`). Each has **one idea**: one short explanation, one small complete program, then its output.
3. `## সাধারণ ভুল`: the compiler error beginners hit. Show it as a `compile_fail` block, give the error in one line, then show the fix.
4. `## নিজে করো`: a small task, then the full solution inside
   `<details><summary>সমাধান দেখো</summary> ... </details>`. Put a blank line after `<summary>` and before `</details>` so the markdown inside renders.
5. `## মনে রাখো`: 3–5 bullet takeaways.

### Code fences (important: the checker uses these)

| fence | meaning |
|---|---|
| ` ```rust ` | A complete program with `fn main`. It is compiled with `rustc --edition 2024` and run, and the page gets a ▶ Run button. If the **next** block is ` ```text `, it is the exact expected stdout. |
| ` ```rust compile_fail ` | Must **fail** to compile (it shows the mistake). It gets a ❌ badge, and Run shows the real compiler error. |
| ` ```rust ignore ` | A fragment (no `fn main`, or it needs a crate or a file). It is not run. Use it rarely. |
| ` ```text ` | Program output. Only put it directly after the `rust` block it belongs to. |
| ` ```toml `, ` ```bash ` | Cargo.toml and shell commands. |

Rules for runnable blocks: std only (no crates), deterministic output (sort HashMap output, join threads in order),
no reading stdin or files, and finish fast (well under 1 second). Warnings are fine, but avoid unused variables.

## Quiz file

```json
{ "cards": [ ... 8 to 12 cards ... ] }
```

Every card has `type`, `q` (the Bangla question), an optional `code`, and `explain` (1–2 Bangla sentences on *why*, shown after the answer).

| type | extra fields | UI |
|---|---|---|
| `choice` | `options` (2–4 strings), `answer` (0-based index) | pick one; use it for "what will this print?" |
| `truefalse` | `answer` (true/false) | সত্য / মিথ্যা |
| `order` | `lines` (3–7 strings in the **correct** order) | the learner taps the shuffled lines into order |
| `fill` | `code` with exactly one `___`, `answer` (accepted strings) | the learner types the missing piece (spaces are ignored) |
| `line` | `code`, `answer` (1-based line number) | the learner taps the line the compiler rejects |

Use a mix in every quiz: at least 3 `choice` (of which at least 2 are "what will this print?" with code), 1 `truefalse`, 1 `order`, 1 `fill`,
and 1 `line` (when the topic has a compiler error to hunt). Start easy and finish with a harder "boss" question.
**Run every code snippet you ask about through rustc yourself** and make sure the answer is right. Wrong options must be believable mistakes, not jokes.
Option and line text may contain code in backticks.

## Syllabus (40 lessons)

| id | part | topic |
|---|---|---|
| 01-why-rust | 1 | Why Rust (safe + fast, no GC, who uses it), rustup install, `cargo new`, `cargo run`, project layout, `cargo build --release` |
| 02-hello-world | 1 | `fn main`, `println!` is a macro, `{}` `{name}` `{:?}` `{:.2}` `{:>5}`, `print!`, comments |
| 03-variables | 1 | `let`, immutable by default, `mut`, shadowing (incl. changing type), `const`, naming |
| 04-data-types | 1 | integers (i32/u8/i64/usize), overflow + checked/wrapping, floats, bool, char (4 bytes, Unicode), tuples, arrays, `as` casting |
| 05-functions | 1 | params need types, `-> T`, expression vs statement (no semicolon = value), block expressions, early `return` |
| 06-control-flow | 1 | `if` as expression, `loop` + `break value`, `while`, `for` over ranges/arrays, `.rev()`, labeled breaks |
| 07-ownership | 2 | stack vs heap, `String` vs literal, the 3 rules, move, `clone`, `Copy` types, ownership into/out of functions, drop at scope end |
| 08-borrowing | 2 | `&T`, `&mut T`, many readers OR one writer, why it stops data races, dangling refs impossible, NLL |
| 09-slices | 2 | `&str` vs `String`, string slices, `first_word`, `&[i32]`, functions taking `&str` |
| 10-structs | 3 | struct, field init shorthand, update syntax, `impl`, `&self`/`&mut self`, `Self::new`, tuple structs, `#[derive(Debug)]` |
| 11-enums-match | 3 | enums with data, `match` exhaustiveness, `_`, `if let`, `matches!`, methods on enums |
| 12-option | 3 | no null, `Option<T>`, `Some/None`, `unwrap_or`, `map`, `and_then`, `if let`/`let else`, `?` on Option |
| 13-vectors | 3 | `Vec::new`, `vec!`, push/pop, `get` vs index, iterate and mutate, sort/dedup/retain, borrow rules with Vec |
| 14-strings | 3 | UTF-8, `len()` bytes vs `chars().count()` (with a non-ASCII string like `"café"` or `"🦀"`), `push_str`, `format!`, `+`, why no `s[0]`, `split_whitespace`, `trim`, `parse` |
| 15-hashmap | 3 | `HashMap` insert/get, `entry().or_insert`, word count, iterate (sorted output), `BTreeMap`, `HashSet` |
| 16-result | 4 | `panic!` vs recoverable, `Result<T,E>`, match on Result, `unwrap`/`expect`, `parse::<i32>()` errors, `unwrap_or_else` |
| 17-question-mark | 4 | `?`, custom error enum, `impl Display`, `From` conversion, `Box<dyn Error>`, `main` returning Result, note on thiserror/anyhow |
| 18-modules-cargo | 4 | `mod`, `pub`, `use`, nested modules, `self`/`super`, file layout (`src/lib.rs`, `mod x;`), Cargo.toml deps, crates.io, `cargo add` |
| 19-generics | 5 | generic fn `largest<T: PartialOrd + Copy>`, `Point<T>`, generic impl, monomorphization (zero cost) |
| 20-traits | 5 | define trait, `impl Trait for`, default methods, trait bounds, `impl Trait` params/returns, `where` |
| 21-std-traits | 5 | derive Debug/Clone/PartialEq/Eq/Hash/PartialOrd/Ord/Default, `impl Display`, `From`/`Into`, `impl Add` |
| 22-lifetimes | 5 | the dangling problem, `longest<'a>`, structs holding refs, elision rules, `'static` |
| 23-trait-objects | 5 | `dyn Trait`, `Box<dyn Shape>` in a Vec, static vs dynamic dispatch, when to choose which, object safety in one line |
| 24-advanced-traits | 5 | associated types (`Iterator::Item`), supertraits, newtype pattern, fully-qualified syntax, operator overloading recap |
| 25-closures | 6 | syntax, capture by ref/mut/move, `Fn`/`FnMut`/`FnOnce`, returning `impl Fn`, `sort_by_key` |
| 26-iterators | 6 | `Iterator` + `next`, `iter`/`iter_mut`/`into_iter`, map/filter/enumerate/zip/take/skip/fold, `collect`, laziness, a custom iterator |
| 27-box-drop | 7 | `Box<T>`, recursive enum (list/tree), `Deref`, `Drop` + drop order, `std::mem::drop` |
| 28-rc-refcell | 7 | `Rc` + `strong_count`, `RefCell` runtime borrow (`try_borrow_mut`), `Rc<RefCell<T>>`, `Weak` to break cycles, `Cell` |
| 29-patterns | 8 | destructuring struct/tuple/enum, guards, `@`, `..`, slice patterns `[first, .., last]`, `let else`, ranges `1..=5` |
| 30-macros | 8 | `macro_rules!`, designators (`expr`, `ident`), repetition `$(...),*`, a `hashmap!{}`, function vs macro, derive/proc macros (concept) |
| 31-testing | 8 | `#[cfg(test)]`, `#[test]`, `assert!`/`assert_eq!`, `#[should_panic]`, `Result` tests, `cargo test`, doc tests, `tests/` folder |
| 32-unsafe | 8 | what `unsafe` allows (raw pointers, unsafe fn, FFI, static mut), safe abstraction over unsafe, why to avoid it |
| 33-threads | 9 | `thread::spawn`, `join`, `move` closures, return values from threads, `thread::scope` |
| 34-channels | 9 | `mpsc::channel`, send/recv, multiple producers, iterate `rx`, worker results |
| 35-mutex-arc | 9 | `Mutex`, lock guard, `Arc<Mutex<T>>` counter, `RwLock`, atomics, deadlock |
| 36-send-sync | 9 | `Send`/`Sync`, why `Rc` is not Send, how the compiler blocks data races, a simple worker pool |
| 37-async-await | 9 | `Future`, `async fn`/`.await`, lazy futures, a tiny executor with std, why tokio exists, a tokio example (`ignore`) |
| 38-cli-project | 10 | build a mini `grep`: `std::env::args`, Config struct, `Result`, splitting into lib + main, tests (main logic runnable on a fixed string) |
| 39-word-counter | 10 | capstone: multi-thread word frequency with scoped threads, merge HashMaps, top-N sorted, custom error |
| 40-ecosystem | 10 | `cargo fmt`, `clippy`, `cargo doc`, workspaces, key crates (serde, tokio, axum, clap, rayon), what to build next |
