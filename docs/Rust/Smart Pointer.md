## Brief

## `Box<T>`

> `Box<T>`, casually referred to as a ‘box’, **provides the simplest form of heap allocation in Rust.** Boxes provide ownership for this allocation, and drop their contents when they go out of scope. Boxes also ensure that they never allocate more than `isize::MAX` bytes.

* [Doc](https://doc.rust-lang.org/std/boxed/)

### Which situations should we use `Box<T>`

1. When you have a type whose size can’t be known at compile time, and you want to use a value of that type in a context that requires an exact size.
2. When you have a large amount of data, and you want to transfer ownership but ensure that the data won’t be copied when you do so.
3. When you want to own a value, and you care only that it’s a type that implements a particular trait rather than being of a specific type.

### Example for situation 3

:::warning
參透 trait object 就能理解。
:::

```rust
trait Storage {
    fn save(&self, data: &str);
}

struct CloudStorage;
impl Storage for CloudStorage {
    fn save(&self, data: &str) { println!("Saving '{}' to the cloud...", data); }
}

struct DiskStorage;
impl Storage for DiskStorage {
    fn save(&self, data: &str) { println!("Saving '{}' to local disk...", data); }
}

fn main() {
    // We want a list that OWNS these storage objects.
    // We use Box<dyn Storage> to say: 
    // "I own some heap memory containing SOMETHING that implements Storage."
    let mut savers: Vec<Box<dyn Storage>> = Vec::new();

    savers.push(Box::new(CloudStorage));
    savers.push(Box::new(DiskStorage));

    for saver in savers {
        saver.save("My Backup");
    }
}
```

### Different between "reference" & "Box"


| Feature | Reference | Box |
| -------- | -------- | -------- |
| Ownership    | Borrowed (doesn't own)   | Owned   |
| Location of Data   | Stack or Heap   | Always Heap   |
| Size of Pointer | 1 word (usually) | 1 word


### `Box<T>` is a reference-like object stay in stack and it point to the data in heap.

```rust
use std::mem;

#[allow(dead_code)]
#[derive(Debug, Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}

// A Rectangle can be specified by where its top left and bottom right
// corners are in space
#[allow(dead_code)]
struct Rectangle {
    top_left: Point,
    bottom_right: Point,
}

fn origin() -> Point {
    Point { x: 0.0, y: 0.0 }
}

fn boxed_origin() -> Box<Point> {
    // Allocate this point on the heap, and return a pointer to it
    Box::new(Point { x: 0.0, y: 0.0 })
}

fn main() {
    // (all the type annotations are superfluous)
    // Stack allocated variables
    let point: Point = origin();
    let rectangle: Rectangle = Rectangle {
        top_left: origin(),
        bottom_right: Point { x: 3.0, y: -4.0 }
    };

    // Heap allocated rectangle
    let boxed_rectangle: Box<Rectangle> = Box::new(Rectangle {
        top_left: origin(),
        bottom_right: Point { x: 3.0, y: -4.0 },
    });

    // The output of functions can be boxed
    let boxed_point: Box<Point> = Box::new(origin());

    // Double indirection
    let box_in_a_box: Box<Box<Point>> = Box::new(boxed_origin());

    println!("Point occupies {} bytes on the stack",
             mem::size_of_val(&point));
    println!("Rectangle occupies {} bytes on the stack",
             mem::size_of_val(&rectangle));

    // box size == pointer size
    println!("Boxed point occupies {} bytes on the stack",
             mem::size_of_val(&boxed_point));
    println!("Boxed rectangle occupies {} bytes on the stack",
             mem::size_of_val(&boxed_rectangle));
    println!("Boxed box occupies {} bytes on the stack",
             mem::size_of_val(&box_in_a_box));

    // Copy the data contained in `boxed_point` into `unboxed_point`
    let unboxed_point: Point = *boxed_point;
    println!("Unboxed point occupies {} bytes on the stack",
             mem::size_of_val(&unboxed_point));
}
```

```c
Point occupies 16 bytes on the stack
Rectangle occupies 32 bytes on the stack

Boxed point occupies 8 bytes on the stack
Boxed rectangle occupies 8 bytes on the stack
Boxed box occupies 8 bytes on the stack

Unboxed point occupies 16 bytes on the stack
```

### Questions ?

:::warning
Question 1:

**"So basically, the Box provides an interface for us. Instead of interacting with the stack pointer directly, we just use the variable name to access the data, right?"**

And how rust abstract the behavior like this:
```rust
fn main() {
    let b = Box::new(5);
    println!("b = {}", b);
    println!("b = {}", *b);
}

// The two print output is equivalence.
```
Why ? **"We use `b` it dereference automatically."**

How Rust handle that ?
:::

### Treating Smart Pointers Like Regular References

Why ? How Rust do that ?

**Here will answer the Question 1.**

> Implementing the `Deref` trait allows you to **"customize the behavior of the dereference operator `*`"** (not to be confused with the multiplication or glob operator). By implementing `Deref` in such a way that a smart pointer can be treated like a regular reference, you can write code that operates on references and use that code with smart pointers too.

:::warning
`Deref` trait is the key.
:::

#### Example by MyBox

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}
```

It return the instance of `MyBox` object.

```rust
fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

**Error**
```
error[E0614]: type `MyBox<{integer}>` cannot be dereferenced
  --> src/main.rs:14:19
   |
14 |     assert_eq!(5, *y);
   |                   ^^ can't be dereferenced

For more information about this error, try `rustc --explain E0614`.
error: could not compile `deref-example` (bin "deref-example") due to 1 previous error
```

:::warning
The compile error told us `y` this object can't dereference。

If you execute `rustc --explain E0614` you will saw below message:
* Attempted to dereference a variable which cannot be dereferenced.
:::


#### Implementing the Deref Trait

**For support our customize data type could be derefrence, we need implement `deref` trait.**

```rust
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

:::warning
For above code, it implement `deref` behavior from Deref trait, so we could use `*` operator for our data type.

```rust
let x = 5;
let y = MyBox::new(x);

assert_eq!(5, x);
assert_eq!(5, *y);
```

behind the scenes Rust actually ran this code:

```rust
*(y.deref())
```
:::


### "Deref Coercion" a implicit behavior


```rust
fn hello(name: &str) {
    println!("Hello, {name}!");
}
```

With Deref Coercion we could use function like this: `hello("Rust");`.

The compiler will using the `deref` method that implemented by `str` data type, so rust compiler could automatically change the argument's type to reference. 


:::warning 
**Question 2**
"Usually, for our custom data types, Rust doesn't know how to behave when we take a reference. We need to implement the Deref trait so the compiler knows how to reach the underlying data, right?"
:::


```rust
fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m);
}
```

:::danger
**This is important :bangbang: Please look carefully.**

**"Because we implemented the Deref trait for MyBox, Rust can convert a MyBox reference into a reference to its inner member. Additionally, since the Rust standard library implements Deref for String (converting it to a &str), the compiler can follow this chain of redirections to satisfy the function requirements. Is that right?"**

For above flow:

1. First we implemented `deref` method from Deref trait.
2. Them we take reference from the object(MyBox).
3. And sending it to `hello()`. 
4. The argument type define in `hello()` is `&str`.
5. The Deref Coercion occured here !!!
    * First it used `deref` method, that implemented by `MyBox`. (`&(self.0)`)
        * Your Deref: Handles `&MyBox` -> `&T`.
    * Them, the Rust complier redirect the flow to `deref` method, that implemented by string slice data type.
        * String Deref: Handles `&String` -> `&str`.
6. After above deref coercion, finally we resoloved the data type.
:::


:::warning
**Question 3: The differnce between `MyBox` and `Box`.**

"In my example, MyBox tries to mimic a Box-like data type. However, I have a question about the storage it uses. From my understanding, an instance of MyBox is stored on the stack, whereas the standard Box puts its data on the heap. Does the standard Box use a special interface within the Rust compiler or 'kernel' to achieve this?
:::


## `RefCell<T>`





## Question about Rust Philosophy

:::warning
"I've been learning Rust for two weeks, and I feel like Rust discourages the use of dynamic memory for access, right? Even though it provides Box and RefCell—especially RefCell—I feel like Rust intends for RefCell to be used mainly in a testing context. Since some production code can be hard to test, RefCell provides the convenience of modifying an object's content. Is that right?"
:::

:::success
**Reply from Gemini:**

1. Does Rust "dislike" dynamic memory?
    * It isn't that Rust doesn't want you to use dynamic memory (the heap); it's that Rust wants you to be explicit and responsible for it.
    * Rust’s philosophy is: **"Stack by default, Heap when necessary."**
2. Is RefCell just for testing?
    * You are very close to the truth here. In the Rust community, we often call RefCell a "last resort."
:::