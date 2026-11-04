---
title: "Advanced trait: associated type, supertrait, newtype"
short: "Adv Traits"
part: 5
order: 24
summary: "Associated type, supertrait, newtype pattern আর fully-qualified syntax: trait নিয়ে পেশাদারদের কিছু কৌশল।"
icon: "🧩"
minutes: 10
---

## কেন শিখবো?

std-এর কোডে `Iterator`, `Add`, `Deref` দেখলে এমন কিছু লেখা চোখে পড়ে, যা এতদিনে শেখা trait-এর মতো নয়: `type Item`, `trait A: B`, `<Dog as Animal>::name()`।
এগুলো কঠিন কিছু নয়। প্রতিটা একটা নির্দিষ্ট সমস্যার সমাধান। চারটা কৌশল এক এক করে দেখি।

## Associated type: trait-এর ভেতরের type-এর নাম

ধরো একটা trait বলে "আমি একটা একটা করে জিনিস দিই", কিন্তু জিনিসটা কী type-এর, তা implement করা type ঠিক করে। এটা trait-এর ভেতরে `type Item;` লিখে বলা হয়। `Iterator` ঠিক এভাবেই বানানো: `type Item`, আর `next()` ফেরত দেয় `Option<Self::Item>`।

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
    let c = Countdown { n: 3 };
    for x in c {
        println!("{x}");
    }
}
```

```text
3
2
1
```

`type Item = u32;` মানে `Countdown`-এর element হলো `u32`। `for` loop আসলে `next()` বারবার ডাকে, `None` এলে থামে। (iterator-এর বিস্তারিত ২৬ নম্বর পাঠে।)

generic trait `trait Foo<T>` দিয়েও এটা করা যেতো, কিন্তু তখন একটা type-এর জন্য একাধিক `impl Foo<A>`, `impl Foo<B>` সম্ভব হতো, আর ব্যবহারের সময় `T` বারবার লিখতে হতো। associated type-এ একটা type-এর জন্য উত্তর একটাই, তাই লেখা সহজ।

## Supertrait: trait-এর ওপর trait

কখনো একটা trait-এর method নিজে আরেকটা trait-এর method চায়। যেমন `Describe` চায় `Display` দিয়ে নিজেকে print করতে পারা। তখন লিখি `trait Describe: Display`। মানে "Describe মানতে হলে আগে Display মানতে হবে"।

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
    let t = Tag(String::from("rust"));
    println!("{}", t.describe());
}
```

```text
<<rust>>
```

`describe`-এর body-তে `self` ছাপা গেল, কারণ supertrait বলে দিয়েছে `Self: Display`। `Tag` যদি `Display` implement না করে `Describe` করতে যেতো, compile error হতো।

## Newtype pattern: নিজের wrapper type

orphan rule বলে, নিজের crate-এর trait বা নিজের crate-এর type, এই দুটোর অন্তত একটা না হলে `impl` লেখা যায় না। তাই `Vec<String>`-এ (দুটোই বাইরের) সরাসরি `Display` implement করা যায় না।
সমাধান: একটা field-ওয়ালা tuple struct দিয়ে মুড়ে নাও। এটা এখন তোমার নিজের type। একে বলে **newtype pattern**, আর এতে runtime খরচ নেই।

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
    println!("count = {}", w.0.len());
}
```

```text
[a, b]
count = 2
```

newtype-এর আরেক কাজ হলো ভুল মিশে যাওয়া আটকানো। `struct Meters(f64)` আর `struct Feet(f64)` দুটো আলাদা type, তাই ভুলে একটার জায়গায় আরেকটা দেওয়া compile error।

## Fully-qualified syntax: নাম মিলে গেলে

দুটো trait-এ একই নামের method থাকলে, বা type-এর নিজের method-এর নামও একই হলে, `x.name()` লিখে compiler কোনটা বুঝবে? সাধারণ `x.name()` type-এর নিজের method ধরে। অন্যটা চাইলে নাম পরিষ্কার করে বলতে হয়: `<Type as Trait>::method(...)`।

```rust
trait Pilot {
    fn fly(&self) -> String;
}

trait Wizard {
    fn fly(&self) -> String;
}

struct Human;

impl Pilot for Human {
    fn fly(&self) -> String {
        String::from("captain speaking")
    }
}

impl Wizard for Human {
    fn fly(&self) -> String {
        String::from("up!")
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
    println!("{}", Pilot::fly(&h));
    println!("{}", <Human as Wizard>::fly(&h));
}
```

```text
*waves arms*
captain speaking
up!
```

`Trait::method(&x)` লিখলেও চলে (যেমন `Pilot::fly(&h)`)। যেসব function-এ `self` নেই, সেখানে `<Type as Trait>::function()` লাগে।

## Operator overloading: ছোট রিক্যাপ

২১ নম্বর পাঠে `Add` দেখেছো। এখানে `type Output` আসলে একটা associated type। এর সুবিধা হলো, `+`-এর দুই পাশের type আর ফলাফলের type আলাদা হতে পারে।

```rust
use std::ops::Add;

struct Meters(f64);
struct Feet(f64);

impl Add<Feet> for Meters {
    type Output = Meters;

    fn add(self, other: Feet) -> Meters {
        Meters(self.0 + other.0 * 0.3)
    }
}

fn main() {
    let total = Meters(10.0) + Feet(10.0);
    println!("{}", total.0);
}
```

```text
13
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

আগে `impl Display for Tag` লিখতে হবে, তারপর `Describe`।

## নিজে করো

`Celsius(f64)` নামে একটা newtype বানিয়ে তার জন্য `Display` implement করো, যাতে `Celsius(36.5)` print হলে `36.5 C` দেখায়। তারপর `Hot: Display` নামে একটা supertrait বানাও, যার default method `warning(&self) -> String` হবে `"HOT: <display>"`। `Celsius`-এর জন্য `Hot` implement করে `warning()` ডাকো।

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

- associated type (`type Item;`) trait-এর ভেতরে type-এর নাম রাখে। `Iterator` আর `Add` এভাবেই বানানো।
- supertrait `trait A: B` মানে A মানতে হলে আগে B মানতে হবে, আর A-এর body-তে B-র method চলে।
- newtype (`struct Wrapper(Vec<T>)`) দিয়ে বাইরের type-এ বাইরের trait implement করা যায়, runtime খরচ ছাড়াই।
- নাম মিলে গেলে `Trait::method(&x)` বা `<Type as Trait>::method(&x)` লিখে পরিষ্কার করে বলো।
