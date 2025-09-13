# Process & Program

**Process**
> **Processes are often called tasks or threads in the Linux source code.**
> 
> 摘錄自 Understanding The Linux Kernel

> **The process is the major OS abstraction of a running program. At any point in time, the process can be described by its state: "the contents of memory in its address space", "the contents of CPU registers (including the program counter and stack pointer, among others)", and "information about I/O (such as open files which can be read or written)".**
>
> 摘錄自 The Abstraction: The Process

**Program**
> The **program itself is a lifeless thing: it just sits there on the disk**, a bunch of instructions (and maybe some static data), waiting to spring into action.
> 
> 摘錄自 The Abstraction: The Process

# 與 Process 相關的議題

* context switch
* time-sharing & space-sharing
* scheduling policy

# Processes, Lightweight Processes, and Threads

**Process** 為某一 **Program（可執行檔: elf、exe）** 載入至記憶體中執行的稱呼。

根據不同系統(OS)，Process有會有不同的實作與定義，這邊將以Linux process為範例。

## Process

在 Linux 中 Process 可以想像成**一種複雜的資料結構結合體**，用來記錄與描述 Process 的狀態，

[task_structure](https://elixir.bootlin.com/linux/latest/source/include/linux/sched.h#L743) 為 Linux 中用來表示 Process的結構。

它也有親屬關係，每一個 Process 透過一位先輩節點誕生，它也可以有多個同輩節點。

>When a process is created, it is **almost identical** to its parent. **It receives a (logical) copy of the parent’s address space** and **executes the same code as the parent**, beginning at the next instruction following the process creation system call.
>
>Although the parent and child may share the pages containing the program code (text), **they have separate copies of the data (stack and heap)**, so that changes by the child to a memory location are invisible to the parent (and vice versa).
>
>摘錄自 Understanding The Linux Kernel

### 構成 Process 的元素們

**Memory**
> **Thus the memory that the process can address (called its address space) is part of the process.**
> 
> 摘錄自 The Abstraction: The Process

**Register**
> **Also part of the process’s machine state are registers; many instructions explicitly read or update registers and thus clearly they are important to the execution of the process.**
> 
> 摘錄自 The Abstraction: The Process

**I/O Device**
> **Finally, programs often access persistent storage devices too. Such I/O information might include a list of the files the process currently has open.**
> 
> 摘錄自 The Abstraction: The Process


### Differ between new process & parent

在更改資料前，除了 **PID (process ID)** 、 **PPID (parent process ID)** 等一些用來分辨 process 的 unique ID 需要不同之外其他與 parent process 無異。

在資料更改後（根據採用的實作技術會有不同情景），這邊以 **COW** 為範例。new process 會繼承父親的資料，如 **open file table** 抖，並在這之上加上自身所做的修改。

## Thread 

> **The Linux kernel does not provide any special scheduling semantics or data structures to represent threads. Instead, a thread is merely a process that shares certain resources with other processes.**
>
>摘錄自 Understanding The Linux Kernel

> **A thread, defined as a single flow of execution, is linked with a stack
and a set of CPU registers, with the stack pointer and program counter being the
most significant.**
> 
> 摘錄自 lkmpg

在Linux Kernel中最基本的執行單位就是thread (lightweight process)。

## Differ between thread & process

這裡會透過`clone()`試著去分析兩者之間的差異，因為在 Linux kernel 中，thread 與 process 兩者都是透過 `task_structure` 這一結構來表示。

這邊以 POSIX`pthread_create()` 作為建立thread的範例，而 process 則是透過 `fork()`。

**pthread_create calling flow:**
:::info
`pthread_create()` -> `create_thread()` -> `kernel_clone()`
:::

**fork calling flow:**
:::info
`fork()` -> `sys_fork()` -> `kernel_clone()`
:::

:bangbang: **對於 `clone` 而有，兩者的差別在用來建立的參數不同**

**節錄自：Linux Kernel**
```c
SYSCALL_DEFINE0(fork)
{
#ifdef CONFIG_MMU
	struct kernel_clone_args args = {
		.exit_signal = SIGCHLD,
	};

	return kernel_clone(&args);
#else
	/* can not support in nommu mode */
	return -EINVAL;
#endif
}
```

**節錄自：POSIX `pthread_create()`**
```c
  const int clone_flags = (CLONE_VM | CLONE_FS | CLONE_FILES | CLONE_SYSVSEM
			   | CLONE_SIGHAND | CLONE_THREAD
			   | CLONE_SETTLS | CLONE_PARENT_SETTID
			   | CLONE_CHILD_CLEARTID
			   | 0);

  TLS_DEFINE_INIT_TP (tp, pd);

  struct clone_args args =
    {
      .flags = clone_flags,
      .pidfd = (uintptr_t) &pd->tid,
      .parent_tid = (uintptr_t) &pd->tid,
      .child_tid = (uintptr_t) &pd->tid,
      .stack = (uintptr_t) stackaddr,
      .stack_size = stacksize,
      .tls = (uintptr_t) tp,
    };
```

這裡來做個實驗，去透過在 **/kernel/fork.c** 的 **`kernel_clone()`** 中增加一段程式碼，去秀出 `fork()` 與 `pthread_create()` 在 clone 時所使用的 flags 的差別，再去看這些 flags 的定義。

實驗環境為 Linux kernel 6.8.1

**新增的程式碼 :**
```c
#define IDN "<CLONE_FLAGS>"
static void __show_flag(u64 flags) {
	unsigned long mask = 1 << 9, limit = (unsigned long)1 << 32;
	
	for (; mask <= limit; mask <<= 1) {
		if (flags & mask)
			pr_info("%s 0x%lx is enable\n", IDN, mask);
	}
	return;
}
```

**`fork()`**
```=
[  106.814500] <CLONE_FLAGS> 0x200000 is enable
[  106.815575] <CLONE_FLAGS> 0x1000000 is enable
```

**`pthread_create()`**
```=
[   50.175439] <CLONE_FLAGS> 0x100 is enable
[   50.176710] <CLONE_FLAGS> 0x200 is enable
[   50.177968] <CLONE_FLAGS> 0x400 is enable
[   50.179192] <CLONE_FLAGS> 0x800 is enable
[   50.180385] <CLONE_FLAGS> 0x10000 is enable
[   50.181669] <CLONE_FLAGS> 0x40000 is enable
[   50.182944] <CLONE_FLAGS> 0x80000 is enable
[   50.184161] <CLONE_FLAGS> 0x100000 is enable
[   50.185443] <CLONE_FLAGS> 0x200000 is enable
Parent here !
```

在 [**/include/uapi/linux/sched.h**](https://elixir.bootlin.com/linux/latest/source/include/uapi/linux/sched.h#L10) 中定義了每一項flags，也可以參考 [clone(2) — Linux manual page](https://www.man7.org/linux/man-pages/man2/clone.2.html)

觀察上述結果，`pthread_create()` 比起 `fork()` 啟用了更多的 flags:
```=
[   50.175439] <CLONE_FLAGS> 0x100 is enable    // CLONE_VM
[   50.176710] <CLONE_FLAGS> 0x200 is enable    // CLONE_FS
[   50.177968] <CLONE_FLAGS> 0x400 is enable    // CLONE_FILES
[   50.179192] <CLONE_FLAGS> 0x800 is enable    // CLONE_SIGHAND
[   50.180385] <CLONE_FLAGS> 0x10000 is enable  // CLONE_THREAD
[   50.181669] <CLONE_FLAGS> 0x40000 is enable  // CLONE_SYSVSEM
[   50.182944] <CLONE_FLAGS> 0x80000 is enable  // CLONE_SETTLS
```

接著來一看一下這些 Flags 的含意。

**CLONE_VM**
>**The calling process and the child process run in the same memory space.**
>
> 摘錄自：Linux manual page

**共享同一個 `mm_struct` 物件**

該 flag 能讓不同“操作流”在相同位址空間下執行，這也代表了 thread 與 process 之間的其中一種關係，thread 為 process 之下的一個工作流程。

**CLONE_FS**

>**If CLONE_FS is set, the caller and the child process share the same filesystem information. This includes the root of the filesystem, the current working directory, and the umask.**

**CLONE_FILES**
> **If CLONE_FILES is set, the calling process and the child process share the same file descriptor table.**

**CLONE_SIGHAND**
> **If CLONE_SIGHAND is set, the calling process and the child process share the same table of signal handlers.**

**CLONE_THREAD**
>**Inserts the child into the same thread group of the parent, and forces the child to share the signal descriptor of the parent.**
>
>摘錄自 Understanding The Linux Kernel


上述有提到 若該flag有被設置，則會將新建立的 task 加入 parent 的 thread group。而且所有在 parent 的 thread 會共同被 signal所影響。

在 Linux manual page 中也有提到：
> When a clone call is made **without specifying `CLONE_THREAD`**, then the **resulting thread is placed in a new thread group** whose **TGID is the same as the thread's TID**. This thread is the leader of the new thread group.
> 

**以 CPU 當前在執行的 thread 與他所能存取的資源角度 :**

Process 與 Thread 在 Linux 中最大的區別，個人認為是 “位址空間” Process 擁有獨立的位址空間而 Thread 則與其它 Thraed 在同一 Process 的位址空間之下。

**對於 CPU 本身而言 :**

Process 與 Thraed 無異，構成 CPU 執行流的元素們 (如: register file 與 stack pointer 等等) 對於兩者來說是相同意義，都是透過處理器中的 register file 中的暫存器表示。 

# Process API

這裡粗略整理 process 的 API 們。

* fork()
* wait()
* exec()

`fork()` 與 `exec()` 在我們日常透過 shell 執行程式中有著密不可分的關係，而 `wait()` 則是與 process 執行完後的資源回收相關。

`fork()` 在 Linux 中是基於 `clone()` 再加上特定參數來建立新的 Process，在新的 Process 誕生後基本上與建立它的 Process 接近相同，通常建立新的 Process 是為了要執行某一個 Program ，這時需要透過 `exec()` 系列的 system call 將 Program 載入。

我們平常在 command line 中所使用的“指令”本身就是一個執行檔(Program)，shell 在我們輸入指令後 fork 出一個新的 Process 再搭配 exec 將指令的 Program 載入。

至於 wait() 則是當 Process 結束後用來將剩餘未釋放的資源，像是 PCB(在Linux中為 task_structure)釋放。

<!-- # Context Switch -->


# Reference

* [**Computer Science from the Bottom Up**](https://bottomupcs.com/index.html)
* [**不僅是個執行單元的 Process**](https://hackmd.io/@sysprog/linux-process#Linux-%E8%A8%AD%E8%A8%88%E7%9A%84-trade-off-%E5%92%8C-evolution)
* Understanding The Linux Kernel
* [The Abstraction: The Process](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf)