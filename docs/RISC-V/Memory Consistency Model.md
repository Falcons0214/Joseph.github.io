## Brief

筆記內容整理 RISC-V Memory Model.

## What is Memory Consistency Model ?

> A memory model defines the rules for how different threads or processors in a multi-core system interact through shared memory.

* [Wiki](https://en.wikipedia.org/wiki/Memory_ordering)

:::warning
**Define in RISC-V**

A memory consistency model **"is a set of rules" specifying the values that can be returned by loads of memory.** RISC-V uses a memory model called "RVWMO" (RISC-V Weak Memory Ordering)
:::

### Why need it ?

簡言之，加速。

:::warning
This concept is crucial because both **compilers** and **hardware** **aggressively "reorder" and "cache" memory operations to maximize performance.**
:::

* `load` & `store` reordering.
* Cache

上述兩者就是一切痛苦的開端。

當然 Compiler 除了 `load` & `store`reordering 之外，還存在著許最佳化手段，但這裡暫時忽略。

### Global Memory Order

> **A total ordering of the memory operations produced by all harts.** In general, a multithreaded program has many different possible executions, with each execution having its own corresponding global memory order


## Memory Ordering Instruction

:::warning
`FENCE` instructions are used to order device I/O and memory accesses as viewed by other RISC-V
harts and external devices or coprocessors.
:::

## Reference

[Memory Consistency Models: A Tutorial](https://jamesbornholt.com/blog/memory-models/)