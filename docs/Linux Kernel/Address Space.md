## Brief

在 Kernel Programming 中，時常需要與不同型態的 **Address** 打交道，所以清楚知道當下在使用的 **Address** 型態非常重要。

## 環境

* Linux kernel 6.8.1
* Virtual memory map with 4 level page tables

## Address Type

**Virtual Memory Map**
```=
Virtual memory map with 4 level page tables:

0000000000000000 - 00007fffffffffff (=47 bits) user space, different per mm
hole caused by [47:63] sign extension
ffff800000000000 - ffff87ffffffffff (=43 bits) guard hole, reserved for hypervisor
ffff880000000000 - ffffc7ffffffffff (=64 TB) direct mapping of all phys. memory
ffffc80000000000 - ffffc8ffffffffff (=40 bits) hole
ffffc90000000000 - ffffe8ffffffffff (=45 bits) vmalloc/ioremap space
ffffe90000000000 - ffffe9ffffffffff (=40 bits) hole
ffffea0000000000 - ffffeaffffffffff (=40 bits) virtual memory map (1TB)
... unused hole ...
ffffec0000000000 - fffffbffffffffff (=44 bits) kasan shadow memory (16TB)
... unused hole ...
				    vaddr_end for KASLR
fffffe0000000000 - fffffe7fffffffff (=39 bits) cpu_entry_area mapping
fffffe8000000000 - fffffeffffffffff (=39 bits) LDT remap for PTI
ffffff0000000000 - ffffff7fffffffff (=39 bits) %esp fixup stacks
... unused hole ...
ffffffef00000000 - fffffffeffffffff (=64 GB) EFI region mapping space
... unused hole ...
ffffffff80000000 - ffffffff9fffffff (=512 MB)  kernel text mapping, from phys 0
ffffffffa0000000 - [fixmap start]   (~1526 MB) module mapping space (variable)
[fixmap start]   - ffffffffff5fffff kernel-internal fixmap range
ffffffffff600000 - ffffffffff600fff (=4 kB) legacy vsyscall ABI
ffffffffffe00000 - ffffffffffffffff (=2 MB) unused hole
```

```=
0xffffffffffffffff  +-----------+
                    |           |
                    |           | Kernel-space
                    |           |
0xffff800000000000  +-----------+
                    |           |
                    |           |
                    |   hole    |
                    |           |
                    |           |
0x00007fffffffffff  +-----------+
                    |           |
                    |           |  User-space
                    |           |
0x0000000000000000  +-----------+
```

## User

### User Virtual Address 

觀察上面 Virtual Memory Map 可以看到第三行 `0000000000000000 - 00007fffffffffff (=47 bits)` 的虛擬地址是分配給 User Level process 執行的，也就是說在 user level 底下執行的 process 位址只會出現該範圍內。

## Kernel

Kernel 則是被映射到 `ffff800000000000 - ffffffffffffffff` 的虛擬地址，在這位址中又再根據用途細分出不同區段。


![螢幕擷取畫面 2024-03-29 003507](https://hackmd.io/_uploads/rk183fXyC.png)

### Kernel Logical Address

![螢幕擷取畫面 2024-03-30 112625](https://hackmd.io/_uploads/HJ7_Ubrk0.png)

> These make up the normal address space of the kernel. **These addresses map some portion (perhaps all) of main memory and are often treated as if they were physical addresses (they are a fixed offset from
their physical addresses).** Logical addresses use the hardware’s native pointer size and, therefore, may be unable to address all of physical memory on heavily equipped 32-bit systems. **Logical addresses are usually stored in variables of type `unsigned long` or `void *`.**

### Low & High Memory

詳細內容: [**LDD chapter 15 High and Low Memory**](https://static.lwn.net/images/pdf/LDD3/ch15.pdf)

在 32 位元架構下，超出 4GB 的記憶體無法 "直接" 透過 32 bits 的暫存器表示，所以那些無法直接取到的記憶體就會被歸類為 **"High Memory"**。

> **Low memory**
Memory for which logical addresses exist in kernel space. On almost every system you will likely encounter, all memory is low memory.

> **High memory**
Memory for which logical addresses do not exist, because it is beyond the address range set aside for kernel virtual addresses.

![image](https://hackmd.io/_uploads/ryAVbHBJ0.png)

:::warning
**如何存取 High-memoy region ?**

透過動態映射的方式，將要存取的 Page 暫時映射至 Kernel-Address-Space 中。
:::


### Kernel Virtual Address 

![image](https://hackmd.io/_uploads/rJ7nWrHJA.png)

![image](https://hackmd.io/_uploads/HkLvtjsx0.png)


> **Kernel Virtual Addresses are addresses in the region above the kernel logical address mapping.**

在底下實驗章節的部分，會透過 `kmap()` 把從 user-space 傳入的 Address 映射到 Kernel Address Space 中，`kmap()` 會回傳 Address ，該 Address 則是 Kernel Virtual Address。

### But !!! In 64-bits Addresses are very enough

![image](https://hackmd.io/_uploads/BkdBzSBJA.png)

![image](https://hackmd.io/_uploads/H1tQfSSkR.png)

![image](https://hackmd.io/_uploads/Bk6bYjogA.png)

## Physical Memory Model

前面的部分在討論 Linux 中 Address 的類別，接下來的部分則是 Linux 如何管理 Physical Memory Page。

以下會將 "Physical Memory Model" 透過 "PMM" 代稱。

### Prerequisites

PMM 與硬體架構由著密不可分的關係，粗略的描述就是 Kernel 要支援不同的 “處理器與記憶題 架構 (關聯)”，所以定義了一些結構來描述 **“關聯”**。

* [**NUMA**](https://hackmd.io/@Falcons0214/NUMA)
* [**Node & Zone**](https://hackmd.io/@Falcons0214/PMM)

### Physical Memory Model

> **Physical memory in a system may be addressed in different ways.** The simplest case is when the physical memory starts at address 0 and spans a contiguous range up to the maximal address. It could be, **however, that this range contains small holes that are not accessible for the CPU. Then there could be several contiguous ranges at completely distinct addresses. And, don’t forget about NUMA, where different memory banks are attached to different CPUs.**
> 
> 摘錄自: Physical Memory Model

根據不同的 “關聯” Linux 提供 **FLATMEM** & **SPARSEMEM** 兩種架構來管理，接下來的內容只會關注 **SPARSEMEM**。




### SPARSEMEM


SPARSEMEM 將 Physical Memory 視為 多塊 **"sections"** 的集合。

`struct mem_section` 為用來表示 section 的結構。

[**/include/linux/mmzone.h**](https://elixir.bootlin.com/linux/v6.8.1/source/include/linux/mmzone.h#L1796)
```c
struct mem_section {
	/*
	 * This is, logically, a pointer to an array of struct
	 * pages.  However, it is stored with some other magic.
	 * (see sparse.c::sparse_init_one_section())
	 *
	 * Additionally during early boot we encode node id of
	 * the location of the section here to guide allocation.
	 * (see sparse.c::memory_present())
	 *
	 * Making it a UL at least makes someone do a cast
	 * before using it wrong.
	 */
	unsigned long section_mem_map;

	struct mem_section_usage *usage;
#ifdef CONFIG_PAGE_EXTENSION
	/*
	 * If SPARSEMEM, pgdat doesn't have page_ext pointer. We use
	 * section. (see page_ext.h about this.)
	 */
	struct page_ext *page_ext;
	unsigned long pad;
#endif
	/*
	 * WARNING: mem_section must be a power-of-2 in size for the
	 * calculation and use of SECTION_ROOT_MASK to make sense.
	 */
};
```

#### Some Macro About SPASEMEM

這邊會提到一些 SPARSEMEM 中會使用到的 Macro。

> The **"section size"** and **"maximal number of section"** is specified using **`SECTION_SIZE_BITS`** and **`MAX_PHYSMEM_BITS`** constants defined by each architecture that supports SPARSEMEM.

被定義在 [**/arch/x86/include/asm/sparsemem.h**](https://elixir.bootlin.com/linux/v6.8.1/source/arch/x86/include/asm/sparsemem.h)。


`SECTION_SIZE_BITS` 表示單個 section 的大小，`MAX_PHYSMEM_BITS` 則是用來存取 Physical Memory 的 bits 數量。

虛擬機處理器為 x86_64 且沒有啟用 5 level paging
```c
# define SECTION_SIZE_BITS	27 /* matt - 128 is convenient right now */
# define MAX_PHYSMEM_BITS	(pgtable_l5_enabled() ? 52 : 46)
```

**`NR_MEM_SECTIONS`** 描述 sections 的數量。

[**/include/linux/mmzone.h :: NR_MEM_SECTIONS**](https://elixir.bootlin.com/linux/v6.8.1/source/include/linux/mmzone.h#L1743)
[**/include/linux/page-flags-layout.h :: SECTIONS_SHIFT**](https://elixir.bootlin.com/linux/v6.8.1/source/include/linux/page-flags-layout.h#L31)
```c
#ifdef CONFIG_SPARSEMEM
#include <asm/sparsemem.h>
#define SECTIONS_SHIFT	(MAX_PHYSMEM_BITS - SECTION_SIZE_BITS)
#else
#define SECTIONS_SHIFT	0
#endif

#define NR_MEM_SECTIONS    (1UL << SECTIONS_SHIFT)
```

[**/mm/sparse.c :: mem_section**](https://elixir.bootlin.com/linux/v6.8.1/source/mm/sparse.c#L27)
```c
#ifdef CONFIG_SPARSEMEM_EXTREME
struct mem_section **mem_section;
#else
struct mem_section mem_section[NR_SECTION_ROOTS][SECTIONS_PER_ROOT]
	____cacheline_internodealigned_in_smp;
#endif
```

**Disable `CONFIG_SPARSEMEM_EXTREME`**

如同上述程式碼第 4 行，會以固定大小二維陣列的方式被宣告。

```c
#ifdef CONFIG_SPARSEMEM_EXTREME
#define SECTIONS_PER_ROOT       (PAGE_SIZE / sizeof (struct mem_section))
#else
#define SECTIONS_PER_ROOT	1
#endif

#define NR_SECTION_ROOTS	DIV_ROUND_UP(NR_MEM_SECTIONS, SECTIONS_PER_ROOT)
```

**Enable `CONFIG_SPARSEMEM_EXTREME`**

> The `mem_section` array is dynamically allocated. Each row contains PAGE_SIZE worth of mem_section objects and the number of rows is calculated to fit all the memory sections.

> **The architecture setup code should call `sparse_init()` to initialize the memory sections and the memory maps.**

### PFN to the corresponding `struct page`

這裡會整理 **SPARSEMEM 如何將 Page Frame Number 與 相應的 SPARSEMEM 結構建立關聯**。

**:bangbang: 注意以下程式碼中的註解:**
[**/mm/sparse.c**](https://elixir.bootlin.com/linux/v6.8.1/source/mm/sparse.c#L123)
```c
/*
 * During early boot, before section_mem_map is used for an actual
 * mem_map, we use section_mem_map to store the section's NUMA
 * node.  This keeps us from having to use another data structure.  The
 * node information is cleared just before we store the real mem_map.
 */
static inline unsigned long sparse_encode_early_nid(int nid)
{
	return ((unsigned long)nid << SECTION_NID_SHIFT);
}

static inline int sparse_early_nid(struct mem_section *section)
{
	return (section->section_mem_map >> SECTION_NID_SHIFT);
}
```

透過註解可以了解在 SPARSEMEM 初始化時，會先將 `section_mem_map` 暫時當作存放 Node ID 的容器。

目前為止，我們可以知道 SPARSEMEM 的核心結構是一個型態為 **`struct mem_section **`** 的陣列，陣列中每一項元素代表著 **"一個 Node 下的 sections 的集合"**。

> **“classic sparse”** and **“sparse vmemmap”**. The selection is made at build time and it is determined by the value of **`CONFIG_SPARSEMEM_VMEMMAP`**.

其實就是兩種管理方式，本文會專注在 sparse vmemmap。

#### classic sparse

...


### sparsemem vmemmap


從 `sparse_init(void)` 出發，負責初始化 SPARSEMEM 管理機制。

[**/mm/sparse.c :: sparse_init()**](https://elixir.bootlin.com/linux/v6.8.1/source/mm/sparse.c#L558) 
```c
// ...

// 尋訪每一個 Node 並初始化 Node 中的 sections 
for_each_present_section_nr(pnum_begin + 1, pnum_end) {
    int nid = sparse_early_nid(__nr_to_section(pnum_end));

    if (nid == nid_begin) {
        map_count++;
        continue;
    }
    /* Init node with sections in range [pnum_begin, pnum_end) */
    sparse_init_nid(nid_begin, pnum_begin, pnum_end, map_count);
    nid_begin = nid;
    pnum_begin = pnum_end;
    map_count = 1;
}

// ...
``` 

上方程式碼第 5 行，在上述中提到 **"SPARSEMEM 初始化時，會先將 section_mem_map 暫時當作存放 Node ID 的容器"**，這裡就在將 Node ID 取出後存放在 `nid`。

第 6 ~ 9 行則是去計算 Node 分配到的 section 個數，主要的初始化步驟在 `sparse_init_nid()` 中。

```=
[    0.204810] <SPARSEMEM> pnum_begin: 0
[    0.208631] <SPARSEMEM> pnum_end: ffffffffffffffff
[    0.213677] <SPARSEMEM> map_count: 40
[    0.217254] <SPARSEMEM> VMEMMAP_START: ffffea0000000000
[    0.222375] <SPARSEMEM> PAGES_PER_SECTION: 8000
[    0.226816] <SPARSEMEM> `struct page` size: 40
```

上方輸出可以知道目前只有一個 Node 且 Node 中有 0x40 個 sections 要初始化，然後一個 section 中有著 0x8000 個 pages。

[**/mm/sparse.c :: sparse_init_nid()**](https://elixir.bootlin.com/linux/v6.8.1/source/mm/sparse.c#L505)
```c
/*
 * Initialize sparse on a specific node. The node spans [pnum_begin, pnum_end)
 * And number of present sections in this node is map_count.
 */
static void __init sparse_init_nid(int nid, unsigned long pnum_begin,
				   unsigned long pnum_end,
				   unsigned long map_count)
{
	// ...
        // 尋訪每一個 section 並初始化
	for_each_present_section_nr(pnum_begin, pnum) {
		unsigned long pfn = section_nr_to_pfn(pnum);

		if (pnum >= pnum_end)
			break;

		map = __populate_section_memmap(pfn, PAGES_PER_SECTION,
				nid, NULL, NULL);
		if (!map) {
			pr_err("%s: node[%d] memory map backing failed. Some memory will not be available.",
			       __func__, nid);
			pnum_begin = pnum;
			sparse_buffer_fini();
			goto failed;
		}
		check_usemap_section_nr(nid, usage);
		sparse_init_one_section(__nr_to_section(pnum), pnum, map, usage,
				SECTION_IS_EARLY);
		usage = (void *) usage + mem_section_usage_size();
	}
	sparse_buffer_fini();
	return;
        // ...
}
```
上述程式碼第 2 行 **"[ pnum_begin, pnum_end )"** 表示從 `pnum_begin` 為起始的 page包含在該 Node 中，而 `pnum_end` 則無。

[**/mm/sparse.c :: sparse_init_one_section**](https://elixir.bootlin.com/linux/v6.8.1/source/mm/sparse.c#L300)
```c
static void __meminit sparse_init_one_section(struct mem_section *ms,
		unsigned long pnum, struct page *mem_map,
		struct mem_section_usage *usage, unsigned long flags)
{
	ms->section_mem_map &= ~SECTION_MAP_MASK;
	ms->section_mem_map |= sparse_encode_mem_map(mem_map, pnum)
		| SECTION_HAS_MEM_MAP | flags;
	ms->usage = usage;
}
```


[**/include/linux/mmzone.h**](https://elixir.bootlin.com/linux/v6.8.1/source/include/linux/mmzone.h#L1740)
```c
/*
 * PA_SECTION_SHIFT		physical address to/from section number
 * PFN_SECTION_SHIFT		pfn to/from section number
 */
#define PA_SECTION_SHIFT	(SECTION_SIZE_BITS)
#define PFN_SECTION_SHIFT	(SECTION_SIZE_BITS - PAGE_SHIFT)

static inline unsigned long pfn_to_section_nr(unsigned long pfn)
{
	return pfn >> PFN_SECTION_SHIFT;
}
static inline unsigned long section_nr_to_pfn(unsigned long sec)
{
	return sec << PFN_SECTION_SHIFT;
}
```

```=
// section 0
[    0.254571] <SPARSEMEM> pnum: 0
[    0.257588] <SPARSEMEM> pfn: 0
[    0.260933] <SPARSEMEM> start: ffffea0000000000
[    0.265014] <SPARSEMEM> end: ffffea0000200000
[    0.268876] <SPARSEMEM> node: 0

// section 1
[    0.271558] <SPARSEMEM> pnum: 1
[    0.274464] <SPARSEMEM> pfn: 8000
[    0.277574] <SPARSEMEM> start: ffffea0000200000
[    0.281943] <SPARSEMEM> end: ffffea0000400000
[    0.286152] <SPARSEMEM> node: 0
```

觀察上方輸出，`pnum` 至 `pfn` 的轉換，是將 `pnum` 向左位移 15 bits (SECTION_SIZE_BITS - PAGE_SHIFT)，再觀察更上方的輸出可以發現 **`PAGES_PER_SECTION`** 的值是 `0x8000`。

所以到目前為止可以了解 `PFN_SECTION_SHIFT` 負責處理 Index 的轉換，**從一個 Node 中的 section index 轉成 section 中的 page index。**


從 section 0 中的 `start` 起始位址是 `ffffea0000000000` 至 `end` 位址是 `ffffea0000200000`，`sizeof(struct page)` 的大小為 40 bytes 而一個 section 中有 0x8000 個 pages，相乘後可以發現等於 0x200000 再加上 **`VMEMMAP_START`** 就等於 `end`。

**Some Macro used in code**
```c
#define __page_to_pfn(pg)					\
({	const struct page *__pg = (pg);				\
	int __sec = page_to_section(__pg);			\
	(unsigned long)(__pg - __section_mem_map_addr(__nr_to_section(__sec)));	\
})

#define __pfn_to_page(pfn)				\
({	unsigned long __pfn = (pfn);			\
	struct mem_section *__sec = __pfn_to_section(__pfn);	\
	__section_mem_map_addr(__sec) + __pfn;		\
})

#define page_to_pfn __page_to_pfn
#define pfn_to_page __pfn_to_page
```

在上述中提到 **"SPARSEMEM"** 是透過一個型態為 `struct mem_section*` 的指標陣列管理不同 sections。所以在轉換時會透過上方的程式碼 `__pfn_to_page(pfn)` 與 `__page_to_pfn(pg)` 將 page frame number 或是 `struct page` address 轉換成對應的結果。

但這樣會有一個問題，在轉換時需要需要先透過 section index 找出 page 所在的 section，再透過 page index 找出 section 中的 page，這樣做勢必存取記憶體，所以為了避免這一情況 kernel 透過 **sparsemem-vmemmap** 這一方法來處理。

**sparsemem-vmemmap** 其實就是透過 Page Table 將 `struct page` 們的**記憶體位址映射到  Kernel address space 中的 Virtual Memory Map 這一區**，而 **`vmemmap`** 記錄了該區的起始位址。


[**/mm/sparse-vmemmap.c :: __populate_section_memmap**](https://elixir.bootlin.com/linux/v6.8.1/source/mm/sparse-vmemmap.c#L452)
```c
struct page * __meminit __populate_section_memmap(unsigned long pfn,
		unsigned long nr_pages, int nid, struct vmem_altmap *altmap,
		struct dev_pagemap *pgmap)
{
	unsigned long start = (unsigned long) pfn_to_page(pfn);
	unsigned long end = start + nr_pages * sizeof(struct page);
	int r;

	if (WARN_ON_ONCE(!IS_ALIGNED(pfn, PAGES_PER_SUBSECTION) ||
		!IS_ALIGNED(nr_pages, PAGES_PER_SUBSECTION)))
		return NULL;

	if (vmemmap_can_optimize(altmap, pgmap))
		r = vmemmap_populate_compound_pages(pfn, start, end, nid, pgmap);
	else
		r = vmemmap_populate(start, end, nid, altmap);

	if (r < 0)
		return NULL;

	return pfn_to_page(pfn);
}
```

上述程式碼 `__populate_section_memmap()` 中的 13 ~ 15 行會根據 `vmemmap_can_optimize()` 去呼叫，以實驗環境為例是 `vmemmap_populate()`。

而在 `vmemmap_populate()` 再呼叫 `vmemmap_populate_address()` 建立 Page Table 的映射關係。


```c
static pte_t * __meminit vmemmap_populate_address(unsigned long addr, int node,
					      struct vmem_altmap *altmap,
					      struct page *reuse)
{
	pgd_t *pgd;
	p4d_t *p4d;
	pud_t *pud;
	pmd_t *pmd;
	pte_t *pte;

	pgd = vmemmap_pgd_populate(addr, node);
	if (!pgd)
		return NULL;
	p4d = vmemmap_p4d_populate(pgd, addr, node);
	if (!p4d)
		return NULL;
	pud = vmemmap_pud_populate(p4d, addr, node);
	if (!pud)
		return NULL;
	pmd = vmemmap_pmd_populate(pud, addr, node);
	if (!pmd)
		return NULL;
	pte = vmemmap_pte_populate(pmd, addr, node, altmap, reuse);
	if (!pte)
		return NULL;
	vmemmap_verify(pte, node, addr, addr + PAGE_SIZE);

	return pte;
}
```

```c
/* memmap is virtually contiguous.  */
#define __pfn_to_page(pfn)	(vmemmap + (pfn))
#define __page_to_pfn(page)	(unsigned long)((page) - vmemmap)
```



## 實驗

新增一個 system call 接收呼叫的 Process ID 與 Process 中宣告的變數位址兩個參數，透過 `get_user_pages()` 與 `kmap()` ，將 user page 暫時映射到 Kernel Address Space 中並修改變數。

**User**
```c
#define __NR_hello 462

long hello_syscall(pid_t pid, void *addr)
{
        return syscall(__NR_hello, pid, addr);
}

char* get_page() {
        char *ptr;
        while (1) {
                ptr = (char*)memalign(4096, sizeof(char) * 4096);
                if ((unsigned long)ptr & PAGE_ALIGN_MASK) {
                        free(ptr);
                }else{
                        break;
                }
        }
        return ptr;
}

int main()
{
        long state;
        int *b;
        pid_t pid = getpid();
        char *page = get_page();

        b = (int*)page;
        *b = 5;
        printf("Before: %d\n", *b);
        state = hello_syscall(pid, page);
        printf("Address: %p\n", page);
        printf("After: %d\n", *b);
        return 0;
}
```

**Kernel**
```c
#define IDN "<SYSCALL_MSG>"

static struct task_struct *ctask;
static struct mm_struct *mm;
static pgd_t *pgd_base_addr, *pgd_entry_addr;
static p4d_t *p4d_entry_addr;
static pud_t *pud_entry_addr;
static pmd_t *pmd_entry_addr;
static pte_t *ptep;
static unsigned long page;

SYSCALL_DEFINE2(hello, int, pid, unsigned long __user, vir_address)
{
    pr_info("%s Address pass from user: %lx\n", IDN, vir_address);
    pr_info("%s Caller Process ID: %d\n", IDN, pid);

    ctask = find_task_by_vpid(pid);

    if (ctask) {
        pr_info("%s Find task_struct with pid: %d %d\n", IDN, ctask->pid, ctask->tgid);
    }else{
        pr_info("%s Process not found !\n", IDN);
    }

    mm = ctask->mm;
    pgd_base_addr = mm->pgd;
    pgd_entry_addr = pgd_offset_pgd(pgd_base_addr, vir_address);
    p4d_entry_addr = p4d_offset(pgd_entry_addr, vir_address);
    pud_entry_addr = pud_offset(p4d_entry_addr, vir_address);
    pmd_entry_addr = pmd_offset(pud_entry_addr, vir_address);
    ptep = pte_offset_kernel(pmd_entry_addr, vir_address);
    page = ptep->pte;
    
    int *p2;
    unsigned long _pfn;
    struct page *pages[1], *page2;

    pr_info("%s Address: %lx\n", IDN, (unsigned long)page);

    _pfn = pte_pfn(*ptep);
    page2 = pfn_to_page(_pfn);
    pr_info("%s VMEMMAP_START: %lx\n", IDN, VMEMMAP_START);
    pr_info("%s Address to PFN to address page2: %lx\n", IDN, (unsigned long)page2);

    ___x = 123;
    if (get_user_pages(vir_address, 1, FOLL_WRITE, pages, NULL) != 1)
        pr_info("%s ERROR\n", IDN);
    ___x = 0;
    
    pr_info("%s page address: %lx\n", IDN, (unsigned long)pages[0]);
    p2 = kmap(pages[0]);
    pr_info("%s kmap: %lx\n", IDN, (unsigned long)p2);
    *p2 = 34;
    
    kunmap_local(p2);
    pr_info("%s END\n", IDN);
    return 0;
}
```

**結果**
```=
Before: 5

[   39.453831] <SYSCALL_MSG> Address pass from user: 5631e2de7000
[   39.458450] <SYSCALL_MSG> Caller Process ID: 211
[   39.461927] <SYSCALL_MSG> Find task_struct with pid: 211 211

[   39.466719] <SYSCALL_MSG> VMEMMAP_START: ffffea0000000000
[   39.470959] <SYSCALL_MSG> PAGE_OFFSET: ffff888000000000
[   39.248434] <SYSCALL_MSG> PTE_PFN_MASK: ffffffffff000

[   39.497937] <SYSCALL_MSG> Address: 8000000117f99067
[   39.502585] <SYSCALL_MSG> Address to PFN to address page2: ffffea00045fe640

[   39.516462] <vm_normal_page vaddr:pte value> 5631e2de7000, 8000000117f99067
[   39.521552] <vm_normal_page pfn> 117f99
[   39.524789] <__get_user_pages> ffffea00045fe640

[   39.528787] <SYSCALL_MSG> page address: ffffea00045fe640
[   39.533320] <SYSCALL_MSG> kmap: ffff888117f99000
[   39.537432] <SYSCALL_MSG> END

After: 34
```

## `get_user_pages()`

其實應該要用 `get_user_pages_remote()` 比較妥當，因為:

**Descript About [`get_user_pages()`](https://elixir.bootlin.com/linux/v6.8.1/source/mm/gup.c#L2379)**
> **Where we assume that the `mm` being operated on belongs to the "current task"**。

直接呼叫 `get_user_pages()` 是有風險的，因為 Page 有可能被 Swap。

**Descript About `get_user_pages_remote()` :** [**/mm/gup.c**](https://elixir.bootlin.com/linux/v6.8.1/source/mm/gup.c#L2338)

上述 function 會呼叫 **`__get_user_pages_locked()`**，而在其中再呼叫 **`__get_user_pages()`** 來取得 user space page 並將其固定(pin) 在記憶體，在 [/mm/gup.c](https://elixir.bootlin.com/linux/v6.8.1/source/mm/gup.c#L1186) 有詳細描述。

在 **`__get_user_pages()`** 中會透過 [`follow_page_mask()`](https://elixir.bootlin.com/linux/v6.8.1/source/mm/gup.c#L811) 取得 page address。

> **`follow_page_mask` look up a page descriptor from a user-virtual address.**

繼續朝下可以發現 `follow_page_mask()` 會依照 4-level-page-table 的順序呼叫: `follow_p4d_mask()` -> `follow_pud_mask()` -> `follow_pmd_mask()` -> `follow_page_pte()`，最後在取得 `pte` 後，透過 `vm_normal_page()` 取得 page address。

> **[`vm_normal_page()`](https://elixir.bootlin.com/linux/v6.8.1/source/mm/memory.c#L582)  This function gets the "`struct page`" associated with a `pte`.**

**在 `vm_normal_page()` 中有兩個關鍵的 function， `pte_pfn()` 與 `pfn_to_page()`**，前者負責取得 `pte` 紀錄的 address 相應的 PFN，透過上述結果第九行，可以知道與 `PTE_PFN_MASK` & 後最低 12 位的位元會被歸零，再將其向右位移 12 位取得 PFN。

```c
#define PAGE_SHIFT 12

static inline unsigned long pte_pfn(pte_t pte)
{
	phys_addr_t pfn = pte_val(pte);
	pfn ^= protnone_mask(pfn);
	return (pfn & PTE_PFN_MASK) >> PAGE_SHIFT;
}
```

至於`pfn_to_page()`，在深入該 function 前，要先了解 **Physical Memory Model**。

以下內容會整理在 **Physical Memory Model** 中。

接著在取得 user page address 後的下一步就是要將其映射到 Kernel address space 中。

## `kmap()`



## Reference

* [**Introduction_to_Memory_Management_in_Linux**](https://elinux.org/images/b/b0/Introduction_to_Memory_Management_in_Linux.pdf)
* [**get_user_pages_fast**](https://www.kernel.org/doc/html/latest/core-api/mm-api.html#c.get_user_pages_fast)
* [**kmap**](https://www.kernel.org/doc/html/latest/mm/highmem.html#c.kmap)
* [**Physical Memory**](https://docs.kernel.org/mm/physical_memory.html)
* [**Physical Memory Model**](https://www.kernel.org/doc/html/latest/mm/memory-model.html)
* [static inline](https://zhuanlan.zhihu.com/p/132726037)
* [Linux内存模型](http://www.wowotech.net/memory_management/memory_model.html)