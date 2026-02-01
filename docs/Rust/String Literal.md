## Breif 

The content record how Rust handle string literal (`str` data type).

## Where does the text live ?

```rust
let s1: &str = "joseph";
```

When we compile our program, the string "`joseph`" is baked directly into the final binary file (the executable). This memory is "Hardcoded" and read-only.

其就如同 C string literal 被放在 read only section.

* `str`: Represents the actual sequence of characters (the data itself).
* `&`: Represents a reference (a pointer + a length).

So, `&str` is a "String Slice"—it is a small object that says: **"I don't own this text, but I know it starts at address X and is 6 bytes long."**


## Why can't we just write `let s1: str` ?

:::warning
In Rust, every variable must have a known size at compile time.
:::

Because str can be any length, it is called a Dynamically Sized Type (DST). Rust cannot allocate space for a DST directly on the stack.

However, a Reference (`&str`) has a fixed size! On a 64-bit system, a &str is always exactly 16 bytes (8 bytes for the memory address pointer + 8 bytes for the length).