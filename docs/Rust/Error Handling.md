## Brief

The content is note arrange from Rust Book Chapter 9.

## How Rust treat error ?

Rust 將 error 分為兩類：

* recoverable error
* unrecoveralbe error

根據不同類 error，Rust 分別提供不同的處理方式：

* recoverable -> `Result<T, E>` Enum.
* unrecoveralbe -> `panic!` Macro.


## `panic!`

### How to use it ?

```rust
panic!("crash and burn");
```

Once the process reach the `panic!()`, it will exit and show the message you send to panic.

## `Result`


```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

### What is `Result` ?

**Is a enum provided by Rust, it wrapper `Err(E)` and `Ok(T)` in it as its variants.**


### How to use it ?

```rust
fn build(list: &Vec<String>) -> Result<Config, &'static str> {
    if list.len() < 3 {
        return Err("Not enough arguments");
    }

    let obj: Config = Config {
        query: list[1].clone(),
        file_path: list[2].clone(),
    };
    
    Ok(obj)
}
```

Is a return type, it wrappered **"The result of your function"**.

Above example we wrappered `Config` & `&'static str` in Result, `Config` for correctly return type and `&'static` for errorly return type.


### How to fetch the "result" from `Result` ?

#### `metch`

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => panic!("Problem opening the file: {error:?}"),
    };
}
```

:::warning
The ownership will be take by the `greeting_file_result` variable and after unwrappered by each pattern, 
it will assign the final unwrappered object to `greeting_file` variable.
:::

#### `unwrap_or_else`

```rust
let config = Config::build(&args).unwrap_or_else(|err| {
    println!("Problem parse arguments: {err}");
    process::exit(1);
});
```


#### `if let`

```rust
if let Err(e) = run(config) {
    println!("Application error: {e}");
    process::exit(1);
}
```

:::warning
使用場境，當你只在乎特定一個 pattern 時。
:::

## The `?` Operator Shortcut

**Version used `match`:**
```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let username_file_result = File::open("hello.txt");

    let mut username_file = match username_file_result {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut username = String::new();

    match username_file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}
```

**Version used `?`:**
```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}
```

:::warning
The `?` placed after a Result value is defined to work in almost the same way as the match expressions that we defined to handle the Result values.
 
* If the value of the Result is an `Ok`, **the value inside the `Ok` will get returned from this expression**, and the program will continue. 
* If the value is an `Err`, **the `Err` will be returned from the whole function as if we had used the return keyword so that the error value gets propagated to the calling code.**
:::

## Some questions, I asked to Gemini

### Question 1: How to understand `Result` ?

:::warning
From my understanding, it is an enum provided by Rust used to propagate a result back to the caller—even if that result is an error. Is that right?

Also, since the definition of Result has two variants, Ok(T) and Err(E), is it fair to explain it like this: Result is a data type that allows for two different outcomes. These variants use generic data types because we can't know in advance what the Ok or Err types will be across different application scenarios. Does that sound correct?"
:::


<!-- ## Unrecoverable Errors with `panic!`


## Recoverable Errors with Result




## `panic!` or Not `panic!` ?

 -->
