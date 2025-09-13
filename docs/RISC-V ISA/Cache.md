## What is Cache ?

> A cache is a hardware or software component that stores data so that future requests for that data can be served faster.

:::warning
* Cache 儲存的 data 從何而來 ？
* The data stored in a cache might be the result of an earlier computation or a copy of data stored elsewhere (usually memory).
:::

![cache_comic](https://hackmd.io/_uploads/HyDZWK031e.jpg)

:::warning
Cache 就像是你的書桌一樣，用來放你接觸頻率最高的物品，它空間有限不能無限擴大，所以每當桌子快滿時，我們就必須選出一些較少使用的物品放回櫃子，才會有空間去放最近使用頻率較高的物品。
:::

根據上述，我們需要將 **“使用頻率較低的物品移出桌子”**，並 **“移入使用頻率較高的物品”**，這兩項操作就衍生出 **Cache Mapping**。

如何精準的將未來會使用到的物品先放到桌子旁，並挑選出未來使用頻率最低的物品放回櫃子，這就是 Cache Mapping 在探討的問題。

**Four important questions:**
:bangbang:
>1. When we copy a block of data from main memory to the cache, **where exactly should we put it ?**
>2. How can we tell if a word is already in the cache, or if it has to be fetched from main memory first ?
>3. Eventually, the small cache memory might fill up. To load a new block from main RAM, we’d have to replace one of the existing blocks in the cache... which one?
>4. How can write operations be handled by the memory system?


## Cache Mapping

### direct-mapped

![image](https://hackmd.io/_uploads/ByOU8tCnJl.png)

Let Cache size be: X\
Memory Address be: Q

The cache index that is used to store the corresponding memory unit is: 

Q  %  X

or by least-significant bits

![image](https://hackmd.io/_uploads/HJECPYC21l.png)

目前為止我們已經將 memory block 與 cache line 建立映射關係，接下來就是要:

* **如何記錄需要被更新回 main memory 的 cache line ?**
* **如何記錄目前 cache line 所代表的為哪一個 memory block?**
* **如何得知 Cache line 是否在使用中（Full or Empty）？**

#### Tag

![image](https://hackmd.io/_uploads/ryr4tF0nJx.png)

:bangbang:
將 Cache line index 與 Tag 結合可以知道，當前 Cache line 所對應的 memory block 位址。


![image](https://hackmd.io/_uploads/S1jRiK0n1g.png)

既然要能夠完全表示 memory block 位址，Tag 需要花費的 Bits 就會與 Memory size & Cache size 息息相關。

* Memory Size: 2^n
* Cache Size:  2^m
* Bits in Tag: n - m

知道了 Cache line 所對應的 memory block 後，再來則是確認 Cache Line 是否有被使用(Full or Empty)?

#### the valid bit

![image](https://hackmd.io/_uploads/SJTvRFR3yg.png)


:bangbang:
**So the cache contains more than just copies of the data in memory; 
it also has bits to help us find data within the cache and verify its validity.**


### What happens on a cache hit ?

:::warning
When the CPU tries to read from memory, the address will be sent to a cache controller.
:::

**32-bits Memory Address with 2^10-bytes Cache**
![image](https://hackmd.io/_uploads/H1V7e5A3kl.png)

1. 確認 memory address 的前 32 - 10 個 Bit 與 Tag 是否相同，若一樣代表該 Cache Line 與之相應。
2. 檢查 Valid Bits 是否為 1。

### What happens on a cache miss ?

:::warning
However, a much slower main memory access is needed on a cache miss. 

The simplest thing to do is to stall the pipeline until the data from main memory can be fetched (and also copied into the cache).
:::


### Execise 1

For a byte-addressable machine with 16-bit addresses with a cache with the following characteristics:
* It is direct-mapped
* Each block holds one byte
* The cache index is the four least significant bits

:::warning
Question: How many blocks does the cache hold?
:::spoiler Answer

As we know **cache index is the four least significant bits**, so the answer is -> $2^4$

::: 


:::warning
Question: How many bits of storage are required to build the cache (e.g., for the 
data array, tags, etc.)?

:::spoiler Answer
For a Cache line we need 8-bit for stored our data, and we need 12-bit for tag value, and 1-bit for valid-bit, so totally we need 21-bit for a cache line.

:::

### Spatial locality

透過下列情境解釋何謂 Spatial locality ?

1. Panel 1: CPU Requests Data
    * The CPU character (a cute computer chip) looks at a memory grid and requests data from address X.

    Text: "Hmm, I need data from address X!"
    Concept: The CPU needs a piece of data stored in main memory.

2. Panel 2: Data is Loaded into Cache
    * The CPU fetches address X from memory and places it into the cache (a smaller, faster memory).

    Text: "Got it! Let’s put X into the cache."
    Concept: When data is loaded from memory, a whole block (including nearby addresses, e.g., X+1, X+2) is also loaded into the cache.

3. Panel 3: CPU Requests Nearby Data
    * The CPU now requests X+1 and X+2.

    Text: "Oh! I also need X+1 and X+2!"
    Concept: Since these addresses are close to X, they are already in the cache.

4. Panel 4: Cache Hit! Fast Access
    * The CPU finds the data in the cache, avoiding slow memory access.

    Text: "Thanks to spatial locality, I already have those in cache! Fast and efficient!"
    Concept: This is a cache hit, meaning the CPU doesn't have to go to main memory again, making data access much faster.

### Block addresses

![image](https://hackmd.io/_uploads/rkEhj5Rh1e.png)

![image](https://hackmd.io/_uploads/BkdSpq0nyl.png)


### Locating data in the cache

![image](https://hackmd.io/_uploads/HykVkiAnJl.png)

![image](https://hackmd.io/_uploads/ryOr1i0h1e.png)

![image](https://hackmd.io/_uploads/Hy-DJsRhkg.png)

![image](https://hackmd.io/_uploads/HJ26JjAn1g.png)


### Execise 2

![image](https://hackmd.io/_uploads/Skmvli03Jg.png)

:::spoiler Answer
* 1010 -> `0xDE`
* 1110 -> Cache miss (valid bit is 0)
* 0001 -> `0xFE`
* 1101 -> Cache miss (tag not equal)
:::


### Disadvantage of direct mapping

![image](https://hackmd.io/_uploads/S1eEziAnkx.png)

:bangbang:
> 如果對 對應到相同 Cache Line 的 memory block 輪流進行存取，這時每一次的存取都會 Cache Miss，其原因出在 Directly Mapping 的設計上，因為不同 memory block 只能載入到固定的 Cache Line 上。

### A fully associative cache

:::warning
A fully associative cache permits data to be stored in any cache block, instead of forcing each memory address into one particular block.
:::


#### The price of full associativity

:bangbang:
>* **Because there is no index field in the address anymore, the entire address must be used as the tag, increasing the total cache size.**
>* **Data could be anywhere in the cache, so we must check the tag of every cache block. That’s a lot of comparators!**

![image](https://hackmd.io/_uploads/ByPjwaC2Je.png)

### Set associativity

:::warning
Set associativity 是 fully associativity 的折衷，畢竟 fully associativity 所需的花費太高。

fully associativity 的初衷是希望 memory block 映射到的 Cache Line 能夠不受限制，但代價就是需要非常大量的硬體。

Set associativity 則是讓 memory block 能映射到一個 set 的 Cache。
:::

#### What is "set" ?

:bangbang:
>* **The cache is divided into groups of blocks, called sets.**
>* **<font color="#ff0000">Each memory address maps to exactly one set in the cache, but data may be placed in any block within that set.</font>**

![image](https://hackmd.io/_uploads/Sy_ndpAnJx.png)

![image](https://hackmd.io/_uploads/BysbkAA3yl.png)

![image](https://hackmd.io/_uploads/Hy48g003kg.png)

**n-way associativity 開頭的 `n` 表示組成一個 set 的 block 數量。**
所謂的 n-way 則是 memory block 能夠映射到 Cache Line 的數量。

### Locating a set associative block

![image](https://hackmd.io/_uploads/HkaRcTRnJe.png)

![image](https://hackmd.io/_uploads/B1kSvRR2kg.png)


:::warning
$2n$ = Cache line size

* Block Offset = $Memory Address \ mod \ 2n$
* Block Address = $Memory Address \  / \ 2n$
* Set Index = $Block Address \ mod \ 2s$
:::

:::warning
* Set Index: Cache Line 的編號。
* Block Address: 第幾個 Memory Block
* Block Offset: memory block 所在的 Set 中的位址(下圖的 way0 or way1)。
:::


### Example placement in set-associative caches






2-way set associative cache implementation

![image](https://hackmd.io/_uploads/SkWPVAR3yx.png)











## Reference

[0]。[How do caches work?](https://courses.cs.washington.edu/courses/cse378/09wi/lectures/lec15.pdf)

[1]。[Computer Organization](https://alg.manifoldapp.org/read/computer-organization/section/3d477606-2c6e-4b2f-b6dc-6c5eb9afb56a)


<!-- ## Primary Terminologies

* **Main Memory Blocks:** The main memory is divided into equal-sized partitions called the main memory blocks.
* **Cache Line:** The cache is divided into equal partitions called the cache lines.
* **Block Size:** The number of bytes or words in one block is called the block size.
* **Tag Bits:** Tag bits are the identification bits that are used to identify which block of main memory is present in the cache line.
* **Number of Cache Lines:** The number of cache lines is determined by the ratio of cache size divided by the block or line size.
* **Number of Cache Set:** The number of cache sets is determined by the ratio of several cache lines divided by the associativity of the cache. -->