---
title: "Advanced trait: associated type, supertrait, newtype"
short: "Adv Traits"
part: 5
order: 24
summary: "Associated type, supertrait, newtype pattern আর fully-qualified syntax: trait নিয়ে পেশাদারদের কিছু কৌশল।"
minutes: 6
---

## কেন শিখবো?

std-এর কোডে `type Item`, `trait A: B`, `<Dog as Animal>::name()` চোখে পড়ে। প্রতিটা একটা নির্দিষ্ট সমস্যার সমাধান। চারটা কৌশল দেখি।

## Associated type

trait-এর ভেতরে `type Item;` লিখলে implement করা type ঠিক করে দেয় `Item` কী। `Iterator` এভাবেই বানানো। `Add`-এর `type Output`-ও associated type, তাই `Meters + Feet`-এর ফলাফল আলাদা type-ও হতে পারে।

```rust
struct Countdown {
    n: u32,
}

impl Iterator for Countdown {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.n == 0 {
            None
        } else {
            self.n -= 1;
            Some(self.n + 1)
        }
    }
}

fn main() {
    for x in (Countdown { n: 3 }) {
        println!("{x}");
    }
}
```

```text
3
2
1
```

## Supertrait

`trait Describe: Display` মানে "Describe মানতে হলে আগে Display মানতে হবে", তাই body-তে `self` ছাপা যায়।

```rust
use std::fmt;

trait Describe: fmt::Display {
    fn describe(&self) -> String {
        format!("<<{}>>", self)
    }
}

struct Tag(String);

impl fmt::Display for Tag {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Describe for Tag {}

fn main() {
    println!("{}", Tag(String::from("rust")).describe());
}
```

```text
<<rust>>
```

## Newtype pattern

orphan rule: trait বা type, অন্তত একটা নিজের crate-এর না হলে `impl` লেখা যায় না। তাই `Vec<String>`-এ `Display` সরাসরি হয় না। tuple struct দিয়ে মুড়ে নিলে সেটা তোমার নিজের type, আর runtime খরচ নেই। `Meters(f64)` আর `Feet(f64)` আলাদা newtype হলে ভুলে মিশিয়ে ফেলাও আটকায়।

```rust
use std::fmt;

struct Words(Vec<String>);

impl fmt::Display for Words {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Words(vec![String::from("a"), String::from("b")]);
    println!("{}", w);
}
```

```text
[a, b]
```

## Fully-qualified syntax

একই নামের method থাকলে `x.fly()` type-এর নিজের method ধরে। অন্যটা চাইলে `Trait::method(&x)` বা `<Type as Trait>::method(&x)` লিখতে হয়।

```rust
trait Pilot {
    fn fly(&self) -> String;
}

struct Human;

impl Pilot for Human {
    fn fly(&self) -> String {
        String::from("captain speaking")
    }
}

impl Human {
    fn fly(&self) -> String {
        String::from("*waves arms*")
    }
}

fn main() {
    let h = Human;
    println!("{}", h.fly());
    println!("{}", <Human as Pilot>::fly(&h));
}
```

```text
*waves arms*
captain speaking
```

## সাধারণ ভুল

supertrait না মেনে implement করা:

```rust compile_fail
use std::fmt::Display;

trait Describe: Display {
    fn describe(&self) -> String {
        format!("<<{}>>", self)
    }
}

struct Tag;

impl Describe for Tag {} // error[E0277]: `Tag` doesn't implement `std::fmt::Display`

fn main() {
    println!("{}", Tag.describe());
}
```

আগে `impl Display for Tag` লেখো, তারপর `Describe`।

## নিজে করো

`Celsius(f64)` newtype-এ `Display` implement করো, যাতে `Celsius(36.5)` print হলে `36.5 C` দেখায়। তারপর `Hot: Display` supertrait বানাও, যার default method `warning(&self) -> String` হবে `"HOT: <display>"`। `Celsius`-এর জন্য implement করে `warning()` ডাকো।

<details>
<summary>সমাধান দেখো</summary>

```rust
use std::fmt;

struct Celsius(f64);

impl fmt::Display for Celsius {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} C", self.0)
    }
}

trait Hot: fmt::Display {
    fn warning(&self) -> String {
        format!("HOT: {}", self)
    }
}

impl Hot for Celsius {}

fn main() {
    let t = Celsius(36.5);
    println!("{}", t);
    println!("{}", t.warning());
}
```

```text
36.5 C
HOT: 36.5 C
```

</details>

## মনে রাখো

- associated type (`type Item;`) trait-এর ভেতরে type-এর নাম রাখে। `Iterator` আর `Add` এভাবে বানানো।
- supertrait `trait A: B` মানে A মানতে আগে B মানতে হবে।
- newtype দিয়ে বাইরের type-এ বাইরের trait implement করা যায়।
- নাম মিললে `<Type as Trait>::method(&x)` লেখো।
