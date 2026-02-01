## Breif

The content arrange some lifetime concept.

## What is lifetime ?

> Every reference in Rust has a lifetime, which **is the scope for which that reference is valid.**

> Most of the time, **lifetimes are implicit and inferred**, just like most of the time, types are inferred.

概念類似 C compiler attributea，就是透過 lifetime annotation 告知 Rust compiler，可以依據 特定條件 為前提繼續編譯。

## When should we annotate lifetime ?

> **When the lifetimes of references could be related in a few different ways.**


## Dangling References

```rust
fn main() {
    let r;

    {
        let x = 5;
        r = &x;
    } // Mark 1

    println!("r: {r}");
}// Mark 2
```

:::warning
Above example is very straightforward, because the scope of variable `x` will end after leaving the curly brace with mark 1, so the `r` will become invalid reference,
because it refer to an invalid space.
:::



## Generic Lifetimes in Functions


```rust
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("The longest string is {result}");
}
```

**The Compiler Error**
```=
error[E0106]: missing lifetime specifier
 --> src/main.rs:9:33
  |
9 | fn longest(x: &str, y: &str) -> &str {
  |               ----     ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
help: consider introducing a named lifetime parameter
  |
9 | fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
  |           ++++     ++          ++          ++

For more information about this error, try `rustc --explain E0106`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error
```

:::warning
錯誤的原因很單純，因為 compiler 無法確定 當 function 結束前，哪一個 reference 會被回傳。 

Rust Compiler 為了確保 lifetime 正確性，會需要在 compiler-time 得知，每一個我們所使用的 "objects" 的 lifetime，但 `longest()` 的結果只能在 runtime 得知，compiler 不能在這裡做任何假設，所以報錯。
:::

## Lifetime Annotation Syntax

```=
&i32        // a reference
&'a i32     // a reference with an explicit lifetime
&'a mut i32 // a mutable reference with an explicit lifetime
```

> One lifetime annotation by itself doesn’t have much meaning, because the annotations are meant to tell Rust how generic lifetime parameters of multiple references relate to each other. 

## In Function Signatures

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

:::warning
:bangbang: We want the signature to express the following constraint: 

The **"returned reference will be valid as long as both of the parameters are valid".** This is the relationship between lifetimes of the parameters and the return value. We’ll name the lifetime 'a and then add it to each reference.

The function signature now tells Rust that for some lifetime 'a, the function takes two parameters, both of which are string slices that live at least as long as lifetime 'a. The function signature also tells Rust that the string slice returned from the function will live at least as long as lifetime 'a. In practice, **it means that the lifetime of the reference returned by the longest function is the same as the smaller of the lifetimes of the values referred to by the function arguments.** These relationships are what we want Rust to use when analyzing this code.

上述 `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str` expression 告知 compiler，無論如何 return type 的 lifetime 會是所傳入的參數中最短的，讓 compiler 根據此條件去做檢查。
:::

## In Struct Definitions

:::warning
We can define structs to hold references, **but in that case, :bangbang: "we would need to add a lifetime annotation on every reference in the struct’s definition."**
:::

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}
```

## Lifetime Elision


## The Static Lifetime

> One special lifetime we need to discuss is 'static, which denotes that the affected reference can live for the entire duration of the program. 

```rust
let s: &'static str = "I have a static lifetime.";
```

## Generic Type Parameters, Trait Bounds, and Lifetimes All in one

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement! {ann}");
    if x.len() > y.len() { x } else { y }
}
```

特別藝術啊。
