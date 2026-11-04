---
title: ইনস্টলেশন গাইড
description: Windows, macOS আর Linux-এ rustup দিয়ে Rust ইনস্টল।
sidebar:
  order: 1
---

Rust বসানোর অফিশিয়াল টুলের নাম **rustup**। এটা compiler (`rustc`), প্যাকেজ ম্যানেজার (`cargo`) আর স্ট্যান্ডার্ড লাইব্রেরি একসাথে বসিয়ে দেয়।

## Linux / macOS

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

## Windows

1. [rustup.rs](https://rustup.rs) থেকে `rustup-init.exe` নামাও আর চালাও।
2. Visual Studio C++ Build Tools চাইলে সেটাও বসিয়ে নাও (installer নিজেই বলে দেবে)।
3. নতুন একটা টার্মিনাল খোলো।

## ঠিকমতো বসেছে কিনা দেখো

```bash
rustc --version
cargo --version
```

## প্রথম প্রজেক্ট

```bash
cargo new hello
cd hello
cargo run
```

## আপডেট আর এডিটর

```bash
rustup update            # update Rust
rustup component add clippy rustfmt
```

এডিটর হিসেবে **VS Code + rust-analyzer** extension সবচেয়ে জনপ্রিয়। RustRover বা Zed-ও ভালো।

:::note
কিছু বসাতে না চাইলে কোর্সের প্রতিটা পাঠে **▶ চালাও** বাটন আছে। কোড সরাসরি ব্রাউজারেই চলে।
:::
