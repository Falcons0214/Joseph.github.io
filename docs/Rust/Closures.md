## Breif 

The content arrange my understanding about Rust Closures.

## What is Closures ?

:::success
Closures in Rust are similar to functions but with some "syntactic sugar" and unique behaviors.\
The primary difference is that closures can infer parameter and return types based on how they are first called.\
Once these types are inferred during the first invocation, they become locked in for that closure instance.
:::


## Tpye inference

:::warning
Unlike functions, you don't have to type out x: i32. The compiler looks at the first time you use the closure to "lock in" the types.
:::

## The `move` keyword

:::warning
* **Without `move`:** The closure tries to be "polite." It borrows (& or &mut) the variables from the outside.
* **With `move`:** The closure is "greedy." It takes full ownership of the variables, even if it only needs to read them.
:::

## The Traits (The "Execution" Permissions)

:::warning
The :bangbang:**traits (`Fn`, `FnMut`, `FnOnce`) are actually decided by what you do inside the closure**, not just whether you use the move keyword.
:::

* `FnOnce()`: applies to closures that can be called once. All closures implement at least this trait because all closures can be called. A closure that moves captured values out of its body will only implement `FnOnce` and none of the other `Fn` traits because **it can only be called once**.
* `FnMut()`: applies to closures that don’t move captured values out of their body but might mutate the captured values. These closures can be called more than once.
* `Fn()`: applies to closures that don’t move captured values out of their body and don’t mutate captured values, as well as closures that capture nothing from their environment.

