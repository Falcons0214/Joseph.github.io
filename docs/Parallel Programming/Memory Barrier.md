## Brief

Here we arrange the content about "Compiler Barrier" & "Hardware Barrier".

## What is Memory Barrier

> A memory barrier is a mechanism used to enforce an ordering constraint on memory operations.

關鍵在於 **"存取記憶體的順序"**。

:::warning
為了加速， Compiler(Software) or Processor(Hardware) 會對 "指令" (Instruction) 進行順序調換，而 **"Memory Barrier 則是一系列的約束規則"** 讓 Compiler or Processor 知道，有哪些最佳化手段他們被准許執行。
:::

根據不同 Compiler (GCC or Clang) 與 ISA (ARM or RISC-V, x86 etc...) 會有各自的 Barrier 規則與指令。

這裡整理的為 GCC & RISC-V。

## Sequential Consistency


## Compiler Barrier

* `volatile`
* `asm volatile("" ::: "memory")`



## Hardware Barrier


### Preserved Program Order




### Multi Hart

