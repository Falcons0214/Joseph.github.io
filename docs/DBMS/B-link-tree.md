## The Storage model

:::info
The disk is partitioned into sections of a fixed size“(physical pages; **in this paper, these will correspond to logical nodes of the tree).**

These are the only units that can be read or written by a process. Further, a process is considered to have a fixed amount of primary memory at its disposal, and can therefore only examine a fixed number of pages simultaneously.

This primary memory is not shared with other processes. 
:::

## Some Notation we need know

:::info
Lowercase symbols (x, t, current, etc.) are used to refer to variables (including pointers) in the primary storage of a process.

**Uppercase symbols (A, B, C) are used to refer to blocks of primary storage.** It is these blocks which are used by the process for reading and writing pages on the disk.
:::

:::info
* **lock(x)** denotes the operation of locking the disk page to which x points. If the page is already locked by another process, the operation waits until it is possible to obtain the lock.

* **unlock(x)** similarly denotes the operation of releasing a held lock.

* **A get(x)** denotes the operation of reading into memory block A, the contents of the disk page to which x points. (將page載入至記憶體)

* **put(A, x)** similarly denotes the operation of writing onto the page to which x points, the contents of memory block A. The procedures must enforce the restriction that a process must hold the lock for that page before performing this operation. (將page寫回至硬碟)
:::

![](https://hackmd.io/_uploads/ry7lBeqO3.png)

## The Data Structure

這邊都是對將要使用的 B-Tree 的定義

### Structure

![](https://hackmd.io/_uploads/rkuTBl5uh.png)

:::info
* Each path from the root to any leaf has the same length, h.
* The root is a leaf or has at least two sons.
* **Each node has at most 2k + 1 sons.**
* ***The keys for all of the data in the B*-tree are stored in the leaf nodes, which also contain pointers to the records of the database.** (Each record is associated with a key.) Nonleaf nodes contain pointers and the key values to be used in following those pointers.
* **Each node except the root and the leaves has at least k + 1 sons.** (k is a tree parameter; 2k is the maximum number of elements in a node, neglecting the “high key,” which is explained below.)
:::

**Example:**

![](https://hackmd.io/_uploads/HJRZvlnd3.png)


上圖 “K(i)” are instances of the key domain, “P(i)” 在internel node為指向 node 的指標，在 leaf node為指向資料的指標。

![](https://hackmd.io/_uploads/rJ_jdl5d2.png)

:::info
**"M" is a marker that indicates a leaf node and occupies the same position as the first pointer in a nonleaf node.**
:::

### Sequence

![](https://hackmd.io/_uploads/BJcxNQod2.png)

:::info
* Within each node, the keys are in ascending order. 
* In the B*-tree an additional value, called the **“high key,”** is sometimes appended to nonleaf nodes (Figure 3).
:::

這邊的 **“high key”** 就是以此 “high key” 所在的節點為root的子樹的upper-bound。

### Insertion Rule

![](https://hackmd.io/_uploads/SyErUQs_2.png)

:::warning
注意 ！！

上圖中插入前 **在leaf node的74是high key並不是entry**
:::

**Rule 1: ( < 2k)**
:::info
**If a leaf node has fewer than 2k entries**, then a new entry and the pointer to the associated record are **simply inserted into the node.**
:::

**Rule 2: ( == 2k)**
:::info
If a **leaf has 2k entries**, then the new entry is inserted by splitting the node into two nodes, each with half ofthe entries from the old node.

More specifically, **when splitting node a into a’ and b’, the (new) high key for node a’ is inserted into the parent node.** The high key for node b’ is the same as the old high key for a. A new pointer to b is also inserted. 
:::

**Rule 3 (when node is inter-node)**
:::info
Insertion into nonleaf nodes proceeds identically, except that the pointers point to son nodes, rather than to data records.
:::

### Delete Rule

這邊論文並沒有提到刪除的解法會參考這篇: [A SYMMETRIC CONCURRENT B-TREE ALGORITHM](https://dl.acm.org/doi/pdf/10.5555/324493.324589)

## Approache without link

![](https://hackmd.io/_uploads/Sy5EwvH9n.png)

這邊透過一個簡單的範例演示當 `search()` 與 `insert()` 並行時會發生得的問題。

:::info
**Consider the B-tree segment shown in Figure 5a. Suppose we have two processes: a search for the value 15 and an insertion of the value 9. The insertion should cause the modification to the tree structure shown in Figure 5b.**
:::

**Now consider the following sequence of operations:**

![](https://hackmd.io/_uploads/SyLxuDrqh.png)

不難看出，如果程式依照上述順序運作，`search()`會發生錯誤，原因在於`search()`在取得 y node 時，`15` 仍然存在該節點中，但 `insert()` 操作發生後達成 node 分裂的條件，而 `15` 剛好大於分裂點進而導致出錯。


## B_link_tree for Concurrency

**Node structure**
![](https://hackmd.io/_uploads/BkkdCXjO3.png)

**The B-link-tree is a B-tree modified by adding a single “link” pointer field to each
node (P2k+1 - see Figure 6).**

**Tree structure**
![](https://hackmd.io/_uploads/Bk1q5e2dh.png)

**可以理解成，在同一 level 的節點從左到右就像 link-list般連接著**

### About the "link"

:::info
This **link field points to the next node at the same level of the tree as the current node**, except that the link pointer of the rightmost node on a level is a null pointer.

This definition for link pointers is consistent, since all leaf nodes lie at the same level of the tree. The B-link-tree has all of the nodes at a particular level chained together into a linked list, as illustrated in Figure 7.
:::

### Purpose of the "link"

:::info
Is to **provide an additional method for reaching a node.** When a node is split because of data overflow, a single node is replaced by two new node.

When a node is split because of data overflow, a single node is replaced by two new node. The link pointer of the first new node points to the second node; the link pointer of the second node contains the old contents of the link pointer field of the first node.

Usually, the **first new node occupies the same physical page** on the disk as the old single node. 
:::

## Search Algorithm for B_link_tree

### Algorithm Sketch

:::info
If the search process examines a node and finds that **the maximum value given by that node is less than `u`, then it infers some change has taken place in the current node** that had not been indicated in the father at the time the father was examined by the search.

The current node must have been split into two (or more) new nodes. **The search must then rectify the error in its position in the tree by following the link pointer of the newly split node instead of by following a son pointer** as it would ordinarily do. 
:::

根據上述定義，可以確定要搜尋的某一值 `u` 在與任何節點中存在的值做比較時，不會超過該節點的最大值，如果超出就可以確定再搜尋時該節點發生分裂，這時就不該再往下層(子節點)走，而是透過 right-link 尋訪到符合定義的節點再繼續尋訪向下至葉子節點。

### The Algorithm

:::info
* **x scannode(u, A):** denotes the operation of examining the tree node in memory block A for value u and returning the appropriate pointer from A (into x). 
:::


```c
procedure search(u)
    
current = root; /* Get ptr to root node */

A = get(current); /* Read node into memory */

while current is not a leaf do /* Scan through tree */
begin 
    current = scannode(u, A); /* Find correct (maybe link) ptr */
    A = get(current)          /* Read node into memory */  
end; 

/* Now we have reached leaves. */

while (t = scannode(u, A)) == link ptr of A do
    /* Keep moving right if necessary */ 
begin 
    current = t ; 
    A = get(current) /* Get node */
end;

/* Now we have the leaf node in which u should exist. */

if v is in A then done “success” else done “failure” 
```

## Insertion Algorithm for B_link_tree

### Algorithm Sketch

![](https://hackmd.io/_uploads/H18zwz853.png)

### The Algorithm

:::info
* **A  node.insert (A, w, u):** denotes the operation of inserting the pointer w and the value u into the node contained in A.
* **u  allocate(2 newpage for B):** denotes the operation of allocating a new page on the disk. The node contained in B will be written onto this page, using the pointer u. 
:::

```c
procedure insert(v)
    
initialize stack; /* For remembering ancestors */

current = root; 
A = get(current); 
 
while current is not a leaf do /* Scan down tree */
begin 
    t = current; 
    current = scannode(v, A); 
    if new current was not link pointer in A then 
        push(t);     /* Remember node at that level */
    A = get(current) 
end; 

lock(current); /* We have a candidate leaf */
A = get(current); 
move.right; /* If necessary */

if v is in A then stop “v already exists in tree” /* And t points to its record */ 
w = pointer to pages allocated for record associated with v; 

Doinsertion:
if A is safe then 
begin 
    A = node.insert(A, w, v); /* Exact manner depends if current is a leaf */
    put(A, current); 
    unLock(current); /* Success-done backtracking */
end else begin       /* Must split node */
    u = allocate(1 new page for B); 
    A, B = rearrange old A, adding v and w, to make 2 nodes, 
        where (link ptr of A, link ptr of B) = (u, link ptr of old A); 
    y = max value stored in new A; /* For insertion into parent */
    put(B, u); /* Insert B before A */
    put(A, current); /* Instantaneous change of 2 nodes */
    
    /* Now insert pointer in parent */
    oldnode = current;
    v = y; 
    w = u; 
    current = pop(stack); /* Backtrack */
    lock(current); /* WeII ordered */
    A = get(current); 
    move.right; /* If necessary */
    unlock(oldnode); 
    goto Doinsertion /* And repeat procedure for parent */ 
end;

/* Move.right. This procedure, which is called by insert,
   follows link pointers at a given level, if necessary. */   
procedure move.right 
while (t = scannode(u, A)) is a link pointer of A do 
begin         /* Move right if necessary */
    lock(t);  /* Note left-to-right locking */
    unlock(current); 
    current = t; 
    A = get(current); 
end;
```