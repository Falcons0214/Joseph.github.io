
## Brief 

The contents record the Rust `Enum`.

## `enum`

### How to understand it ?

* It is a data type.
* It holds only one variant defined in this enum data type at a time.
* It support method define.

在 Rust 中，Enum 與其他語言不一樣的地方在於，每一個 Enum varient 能夠宣告不同的型態，且能夠使用 impl 定義該 Enum 的 method. 

如下：

```rust
enum Drinks {
    Coca(String, usize),
    Spirit(String, i32),
}
```

以及 **"使用者必須透過 Rust 提供的 data fetch methods 將資料取出"。**

如下:

```rust
enum Drinks {
    Coca(String, usize),
    Spirit(String, i32),
}

fn main() {
    let drinks = Drinks::Coca(String::from("berry"), 1245);
    match drinks {
        Drinks::Coca(name, id) => {
            println!("coca: {}, {}", name, id);
        },
        Drinks::Spirit(name, id) => {
            println!("spirit: {}, {}", name, id);
        },
    }
}
```

### How to read it ?

```rust
enum Drinks {
    Coca(String, usize),
    Spirit(String, i32),
}
```

:::warning
The Drink enum is a data type, this data tpye provide two variants `Coca` and `Spirit`.\
Coca is a tuple type, combine from `String` & `usize`.\
etc...
:::

以下透過 Rust Option library 為例，去了解 Rust 的 Enum 的設計理念。


## The `Option<T>` Definition

```rust
enum Option<T> {
    None,
    Some(T),
}
```

## The `Option<T>` Philosophy

### Forced Handling

:::warning
We can't use the value inside a `Some` without first checking if it exists. The compiler forces you to **"`unwrap`"** or **"`match`"** the enum.
:::

### Clarity of Intent

:::warning
When you see a function signature like `fn find_user(id: i32) -> Option<User>`, 
the API is being honest with you. \
It is explicitly saying: "I might not find a user." You are immediately aware that you must handle the possibility of failure.
:::


### The Zero Cost Abstraction

:::warning
Rust's philosophy is also about performance. Through Null Pointer Optimization, the compiler can often represent `Option<&T>` as a simple nullable pointer at the machine level. \
This means you get all the safety of the Option type with zero memory overhead compared to a raw pointer.
:::

## Which times should I use `Option` wrapper my return value ?

:::warning
:bangbang: **Whenever "Nothing" is a valid and expected outcome.**
:::


## Example

```rust
let x: i8 = 5;
let y: Option<i8> = Some(5);

let sum = x + y;
```

**Error**
```=
--> src/main.rs:5:17
  |
5 |     let sum = x + y;
  |                 ^ no implementation for `i8 + Option<i8>`
  |
``` 

> Intense! In effect, this error message means that Rust doesn’t understand how to add an `i8` and an `Option<i8>`, because they’re different types. 
>
> When we have a value of a type like `i8` in Rust, the compiler will ensure that we always have a valid value. We can proceed confidently without having to check for null before using that value. 
>
> Only when we have an `Option<i8>` (or whatever type of value we’re working with) do we have to worry about possibly not having a value, and the compiler will make sure we handle that case before using the value.
>
> **In other words, you have to convert an `Option<T>` to a `T` before you can perform `T` operations with it. Generally, this helps catch one of the most common issues with null: assuming that something isn’t null when it actually is.**

Rust **"要求"** 使用者 **將 "value" 從 Enum 中拿出來**再使用，而 “拿出來這一步驟” 恰好就可以檢查該值 是否存在 “預期範圍內”，進而預防錯誤發生。


## How to take value from `enum` ?


### `match`

> In Rust, match is not just a "switch" statement; **it is a powerful pattern-matching engine**.

More detail about how to write pattern -> [Rust Book Chapter 19](https://doc.rust-lang.org/book/ch19-00-patterns.html)

#### Example

```rust
enum Heros {
    V1(String),
    V2(String),
    V3(String),
}

fn main() {
    let x1 = Heros::V1(String::from("Joseph1"));
    let mut s1: String = String::new();
    
    // Mark 1
    match x1 {
        // We 'bind' the internal String to a variable name (like 'name')
        Heros::V1(name) => {
            println!("v1: {}", name);
            s1 = String::from(name);
        },
        Heros::V2(name) => {
            println!("v2: {}", name);
        },
        Heros::V3(name) => {
            println!("v3: {}", name);
        },
    }

    println!("s1: {}", s1);
    // Mark 2
    // match x1 {
    //     // We 'bind' the internal String to a variable name (like 'name')
    //     Heros::V1(name) => {
    //         println!("v1: {}", name);
    //         s1 = String::from(name);
    //     },
    //     Heros::V2(name) => {
    //         println!("v2: {}", name);
    //     },
    //     Heros::V3(name) => {
    //         println!("v3: {}", name);
    //     },
    // }
}
```

1. The "Container" Analogy:
    Think of `Heros` as a sealed box that can only be one of three shapes: `V1`, `V2`, or `V3`.
    Regardless of which shape it takes, this specific box is designed to carry a String inside it.
    You don't know which "hero type" it is until you open the box (using match).
2. Breakdown of the Components
    `enum Heros`: This defines a new type. Any variable of type Heros can be exactly one of the variants at any given time.
    `V1(String)`: This is a Tuple Variant. It means the variant V1 acts like a constructor that "wraps" a String.


**Mark 1** 透過 `match` 比對傳入的變數 `x` 是否與 `Heros` enum 中其中一個 enum varient 相同，若相同就執行 `{}` 內行為。

:::warning 
**但這裡需要注意 ownership 得轉移！**

由於我們是使用 `name` 這在 Rust 中意味著 **"Move"**，若該 function or scope 不會修改資料，應該使用 **"borrow"** 即 match `&<name>`。

沿用上述程式碼，將其修改為 borror 形式:

```rust
//...
    match &x1 {
        // We 'bind' the internal String to a variable name (like 'name')
        Heros::V1(name) => {
            println!("v1: {}", name);
            s1 = String::from(name);
        },
        Heros::V2(name) => {
            println!("v2: {}", name);
        },
        Heros::V3(name) => {
            println!("v3: {}", name);
        },
    }
```

:::


### `if let`

> The `if let` syntax lets you combine `if` and `let` into a less verbose way to handle values that match one pattern while ignoring the rest.

當我們只需要取得 Enum 中其中一個 Enum varient 時，若使用 `match` 如下：

```rust
match x1 {
    // We 'bind' the internal String to a variable name (like 'name')
    Heros::V1(name) => {
        println!("v1: {}", name);
        s1 = String::from(name);
    },
    // Do nothing.
    _ => {},
}
```

有點冗長對吧？ 所以 Rust 提供另一種語法 `if let`

```rust
if let Heros::V1(name) = x1 {
    println!{"x1: {}", name};
}else{
    // This part same as `_ => {}`
}
```

:::warning
:bangbang: **當然任何的 assign 發生(如同上述 `let Heros::V1(name) = x1`)，都伴隨著 ownership 的轉移。**

So for borrow version

```rust
if let Heros::V1(ref name) = x1 {
    println!{"x1: {}", name};
}
```

**OR**

```rust
if let Heros::V1(name) = &x1 {
    println!{"x1: {}", name};
}
```
:::

俐落多了。

### `let else`

```rust
#[derive(Debug)] // so we can inspect the state in a minute
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

//...

impl UsState {
    fn existed_in(&self, year: u16) -> bool {
        match self {
            UsState::Alabama => year >= 1819,
            UsState::Alaska => year >= 1959,
            // -- snip --
        }
    }
}

fn describe_state_quarter(coin: Coin) -> Option<String> {
    if let Coin::Quarter(state) = coin {
        if state.existed_in(1900) {
            Some(format!("{state:?} is pretty old, for America!"))
        } else {
            Some(format!("{state:?} is relatively new."))
        }
    } else {
        None
    }
}
```

上述透過 `if let` 取得 coin，並在 if scope 中做操作，可想而知若我們不斷將操作 push 進 if condition 中，程式碼的可讀性與修改性會變糟。

```rust
fn describe_state_quarter(coin: Coin) -> Option<String> {
    let state = if let Coin::Quarter(state) = coin {
        state
    } else {
        return None;
    };

    if state.existed_in(1900) {
        Some(format!("{state:?} is pretty old, for America!"))
    } else {
        Some(format!("{state:?} is relatively new."))
    }
}
```

將 操作 “flat” 至同一 Level，但語法看起來有點冗長了。

這時就是 `let else` 上場的時候！

```rust
fn describe_state_quarter(coin: Coin) -> Option<String> {
    let Coin::Quarter(state) = coin else {
        return None;
    };

    if state.existed_in(1900) {
        Some(format!("{state:?} is pretty old, for America!"))
    } else {
        Some(format!("{state:?} is relatively new."))
    }
}
```

將 coin 的 ownership 轉移至 state 後，在 `describe_state_quarter()` first level(padding level) 直接進行操作。

### `as_ref()` &  `.unwrap_or()` for `Option` Enum

:::warning
**The Philosophy about `.unwrap_or()` and `.as_ref()`**:\
`.unwrap_or()` and `.as_ref()` are often used together to solve the problem of: **"I want a value (or a default), but I don't want to destroy my original Enum."**
:::




