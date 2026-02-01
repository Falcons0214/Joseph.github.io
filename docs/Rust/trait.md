## Brief 

The content arrange my understand arrange Rust trait.


## The Philosophy

The **"`triat`"** is **"interface-oriented"**.

### Example

```rust
// First, we define what a Point is
pub struct Point {
    pub x: f64,
    pub y: f64,
}

pub trait Area_Calculate {
    fn get_area(&self) -> f64;
}

// Struct names should be Capitalized (PascalCase)
pub struct Rectangle {
    pub points: Vec<Point>, // We tell Vec it contains Points using < >
}

impl Area_Calculate for Rectangle {
    fn get_area(&self) -> f64 {
        // ...
    }
}

pub struct Triangle {
    pub points: Vec<Point>,
}

impl Area_Calculate for Triangle {
    fn get_area(&self) -> f64 {
       // ... 
    }
}

fn print_area<T: Area_Calculate>(shape: T) {
    println!("Area: {}", shape.get_area());
}
```


As we can see, both the `Triangle` and `Rectangle` structs need to calculate their area. Since calculating the area is a shared behavior between these two structs, we can define a trait called `Area_Calculate`. Inside this trait, we define a `get_area()` method to handle the calculation.

### Trait could be a parameter

```rust
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

## Trait Object

> **"I don't care exactly what type this is, as long as it has these specific 'powers' (methods)."**

OR

> **"The concrete data type matters at the moment of implementation and execution, even if it is hidden by the trait interface."**


How to think about it (The Remote Control Analogy)\
Think of a Trait Object like a Universal Remote Control.

The Trait is the buttons: "Power," "Volume," "Channel."

The Data Type is the actual device: A Sony TV, a Bose Speaker, or a Projector.

When you press "Power," you don't care which device it is (the type is unimportant to you). But the signal sent (the implementation) must be exactly right for a Sony TV vs. a Bose Speaker, or it won't work. The "data type" is what determines which signal the remote actually sends.

:::warning
:bangbang: **物件的資訊(data type size) 在 methods 被實現後才揭曉。**
:::

```rust
trait Speak {
    fn say_hello(&self);
}

struct Dog;
struct Cat;

impl Speak for Dog { fn say_hello(&self) { println!("Woof!"); } }
impl Speak for Cat { fn say_hello(&self) { println!("Meow!"); } }

fn main() {
    // This Vec can hold BOTH Dogs and Cats because they are "erased" into Trait Objects
    let creatures: Vec<Box<dyn Speak>> = vec![
        Box::new(Dog),
        Box::new(Cat),
    ];

    for creature in creatures {
        creature.say_hello(); // The program looks up the correct method at runtime
    }
}
```

`creatures` is a `Vec` where each element is a `Box` type.
We don't know the exact data type that the `Box` points to at compile time; we wait until runtime to resolve it.

以 C 的方式其實就是一個 dynamic array or link-list，其元素由兩個指標構成，一個只向物件位址，另一個指向一個 array（型態為 function pointer，物件的行為）。

## Using Traits as Parameter or Struct Member

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
where
    T: Messenger,
{
    pub fn new(messenger: &'a T, max: usize) -> LimitTracker<'a, T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger
                .send("Urgent warning: You've used up over 90% of your quota!");
        } else if percentage_of_max >= 0.75 {
            self.messenger
                .send("Warning: You've used up over 75% of your quota!");
        }
    }
}
```

先從 `LimitTracker` 開始。

```rust
pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}
```

:::warning
The `messenger` member in the `LimitTracker` struct mean that this member's data type will be whatever concrete type implements the `Messenger` trait
:::


```rust
impl<'a, T> LimitTracker<'a, T>
where
    T: Messenger,
{
// ...
}
```

:::warning
`where` 的作用在於讓 code 看起來更好讀。
:::

```rust
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 {
```
使用 `where` 撰寫後：
```rust
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
```

More !!

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

:::warning
在 `impl<T: Display + PartialOrd> Pair<T> {` 中的 methods 被要求 `Point<T>` 展開後的 data type 必須 implemented `Display` & `PartialOrd` Traits。

在 `cmd_display` 我們可以看到此段 `if self.x >= self.y {` 程式碼，由於 `x` & `y` 是 generic data type，使想一場景，假設 T 不是 primitive data type，所以 Rust 並不知道該型態如何去做 “大小的比較”，這時 data type 的建立者竟必須自行實作出 `>` or `<` operator 讓 Rust compiler 知道。  

而且 `println!("The largest member is x = {}", self.x);` 中的 `self.x` 如果今天 `x` 是複合型態 Rust 也不知道使用者到底要輸出的 member 是哪一個，所以要求該型態必須 Implemented `Display` trait.
:::


## Some questions I asked to Gemini

:::warning
**Q1**\
So, interface-oriented programming extracts shared behaviors from class methods and defines them separately (in Rust, this is done using traits). When different objects need to communicate with each other, they interact through that trait interface, right?
:::

----

:::warning
**Q2**\
Unlike C++, where a child class inherits features from a parent, interface-oriented programming extracts these behaviors into groups (called traits in Rust). If other classes want to interact with your object, they simply rely on the interface provided by the trait, and your object implements the specific logic defined in that trait, right?
:::

:::success
The transition from Vertical Architecture (Inheritance, C++) to Horizontal Architecture (Interfaces/Traits, Rust).

In C++, the logic is "I am this, therefore I can do that." In Rust, the logic is "I have signed this contract, therefore you can interact with me this way.
:::

----





