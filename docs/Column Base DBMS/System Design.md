## System Structure

[**Code Link**](https://github.com/Falcons0214/dsm_db)

### DB layout

![](https://hackmd.io/_uploads/BkGhl7fo2.png)

### Disk Layout

![](https://hackmd.io/_uploads/HkLRQpdLn.png)

### Client & Server

![](https://hackmd.io/_uploads/ryOpiEqKh.png)


### Thread Pool

![](https://hackmd.io/_uploads/r14_7yAr3.png)

### Buffer Pool Layout

![](https://hackmd.io/_uploads/S1ABWxAB3.png)

### Access Layer

**How page loading in pool.**

![](https://hackmd.io/_uploads/rkKefZDOh.png)

### Page ID Manager

![](https://hackmd.io/_uploads/BJlManT-U2.png)

### Page Scheduler



## Table Structure

### General Table

![](https://hackmd.io/_uploads/H10SYQfjn.png)

### Indexing (Implement by B-Link-Tree)

![](https://hackmd.io/_uploads/H1RLEEMi3.png)

## B_link_tree indexing

### Lock Coupling (with no right link B-tree)

**讀寫隔離**

這邊指的隔離並不是指，每當**插入**或**搜尋**發生時就將整顆樹給鎖住，而是對 **即將進行分裂的 Page 以及該 Page 的親代節點** 上鎖。

![](https://hackmd.io/_uploads/r1iRxbq3n.png)

### Lock Subtree (with no right link B-tree)

**寫寫隔離**

這裡的隔離指的是將子樹(同上)給上鎖，原因在於當分裂發生時如果父節點因為其他子樹的插入造成分裂，這時如果要插入的節點大於分裂後父節點的上限，那這時就會發生錯誤。

![](https://hackmd.io/_uploads/B1NhbG92n.png)


### Why B_link_tree can doing insert & search at same time

The key point is **"right link"**, when search operation it can't find record in original node, it can use **right link** to next node.

![](https://hackmd.io/_uploads/H1NfmMY23.png)


## B_link_tree "Remove entry"

### Difference between "Lock root" & "Lock subtree"

...

### These conditions may lead to changes in the tree structure

**:bangbang: The "change" it always occur from leaf then End in the pivot.**

:::info
* **A:** **"Remove Max entry"** from leaf node.
* **B:** Leaf node need **"merge"**.
* **C:** **"Borrow"** an entry from sibling node. (The sibling can be left or right node, but in here I always borrow frome left, unless the node it is leftmost)
:::

**Combination of condition:**

* A
* B
* C
* A & C (Only occur when "C" is not leftmost node)
* A & B (Only occur when "B" is not leftmost node)

We will describe each condition detailly in below topic.

### Remove Max entry

All **internal nodes key are referencing from "Max key" in their corresponding leaf nodes**, if we remove a key that is **max key** of leaf node, it can cause inconsistency between internal node data and leaf node data.

Therefore, we must find a **replacement value** to substitute for the removed key.

![](https://hackmd.io/_uploads/S1WkO0bJT.png)


:::info

If luckily we can find **key** from **parent node**,  the operation will be completed at this point.

If not we need update the upper bound in pivot node, until we find the key.
:::

### Borrow

As mentioned above, the borrow operation involves borrowing an entry from the left sibling node.

For left sibling node, we can **treat this operaiton as remove max.**

For "borrow" we need consider two situations:
:::info
:bangbang: We will use **"cur"** for represent the node we remove entry from it.
:::

**Here we assume "cur" will not be leftmost node**
:::info
**Case1:** If we remove max entry from cur, and it borrow an entry from left sibiling.
**Case2:** Only borrow an entry from left sibling.
:::

#### Case 1
![](https://hackmd.io/_uploads/rkcPx6eyp.png)


#### Case 2
![](https://hackmd.io/_uploads/rJlLUB3x1T.png)


#### If the key stay in high level

![](https://hackmd.io/_uploads/HyKDosWJa.png)

As you can see, we can treat borrow as an other **remove max** operation.

----
Above we assume the **cur** will not be leftmost node, and below we will discuss when **cur** is leftmost node.

**"cur" is leftmost node**
:::info
If cur is leftmost node we always borrow from right sibling.

For this situation, **remove max condition occur we can skip it**, because we will take the smallest value from right sibling, for right sibling it can treat as a general rmove then finish it, and **for cur any entry from right it always be the largest value**, so we will need update upper bound and it corresponding key in pivot node.

Another important property is **"cur" & "right node"** they can sure stay in same parent node, unless the pivot node branch factor is two.
:::

### Merge

Merge Rule:

* If cur is leftmost node: **Merge cur to right node**.
* Not: **Merge cur to left node**.

**:bangbang: We start from Cur is not leftmost node**

In this condition **Merge** will occur with **Remove max** at same time.

#### Case 1 (Merge nodes are stay in same parent)

![](https://hackmd.io/_uploads/ByEHfjM1p.png)


#### Case 2 (Merge nodes from different sub tree)

![](https://hackmd.io/_uploads/ryYNvtE1a.png)

#### The key stay in high level

![](https://hackmd.io/_uploads/B1f1cwrka.png)

----

**:bangbang: Below content will discuss cur is leftmost node**

As **borrow** we can ignore **Remove max**.

## Current provide commands

**For general table:**
* create table
* delete table
* insert an entry
* remove an entry

**For index:**
* create table
* delete table
* insert an entry
* remove an entry
* search an entry