## Brief 

Hazard Pointer 論文筆記。


## ABA problem

根據 [Wiki](https://en.wikipedia.org/wiki/ABA_problem) 範例，ABA problem 發生於:

* 多個 process 存取同一物件。
* 採用 **`CAS` atomic instruction**，判斷 share object 狀態，決定是否更新，或是 `read (lw)`


**CAS Atomic Operation:**
The core of CAS is its atomicity. As a single, indivisible hardware instruction, it performs the following steps:

1. Read: It reads the current value from the specified memory location.
2. Compare: It compares the read value with the provided expected value.
3. Conditional Write:
    * If the values match: It means the memory location has not been modified by another thread since the expected value was last observed. In this case, the new value is atomically written to the memory location. 
    * If the values do not match: It means another thread has modified the memory location in the interim. The write operation fails, and the memory location's value remains unchanged.

試想兩個 process 存取相同 stack (build by Link list)
```=
Stack initially contains:

top → A → B → C 
```

```=
Mark A
{ // Thread 1 runs pop:
  ret_ptr = A;
  next_ptr = B;
  // gets interrupted ...
```

Thread 1 gets interrupted just before the compare_exchange_weak

```=
Mark B
{ // Thread 2 runs pop:
  ret_ptr = A;
  next_ptr = B;
  top_ptr.compare_exchange_weak(A, B)  // Success, top = B
  return A;
} // Now the stack is top → B → C

Mark C
{ // Thread 2 runs pop again:
  ret_ptr = B;
  next_ptr = C;
  top_ptr.compare_exchange_weak(B, C)  // Success, top = C
  return B;
} // Now the stack is top → C

Mark D
delete B;

Mark E
{ // Thread 2 now pushes A back onto the stack:
  A->next_ptr = C;
  top_ptr.compare_exchange_weak(C, A)  // Success, top = A
}
```

:::warning

Right now, the Thread 1 context is recovery and the PC will set to the address that be interrupted.

```
Mark A
// Thread 1 runs pop:

    compare_exchange_weak(A, B)
}
```

回想一下 CAS 指令的行為，它會先檢查 `top` 是否等於 A，由於 Thread 2 修改完後的 stack top value 仍然為 A，所以 CAS 接下來會做的事，就是將 `next_ptr` 更新回 `top_ptr`，但這一步就是發生問題的地方。

來看一下 ARMv8-A CAS:
`CAS Xs, Xt, [Xn|SP,#0]`
> Compare the value in the memory location specified by the address in register `Xn` (or `SP`) with the value in register `Xs`. If the values are equal, atomically store the value in register `Xt` into the memory location. Regardless of the outcome, load the original value from the memory location back into register `Xs`.

在 Mark D 的部份，我們已將 B object free，但 CAS 只會檢查 expected value 與 primitive value (我們所指定的位址的值) 的值是否相同，但從 Mark B -> Mark E 我們知道即使 `top` 值不變，但其 "有關連性的內容" 仍有機會被修改，這就也是 ABA Problem 想表達的問題。
:::

上述中 Lock Free Stack 的 Pop 與 Push，會發生 ABA problem 就是因為 critical section 在未完全執行完畢時被中斷導致。

在設計 Lock Free data sturcture 就需可慮到此場景，避免錯誤被掩蓋掉。

## Hazard Pointer