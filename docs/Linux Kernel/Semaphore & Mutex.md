# Semaphore & Mutex

## Brief 

Talk about difference between Semaphore & Mutex.

## What is Semaphore ?

> **semaphore 是為了保護 process 的執行同步正確，或著說管理執行流。** \
> 摘錄自：Linux 核心設計: 淺談同步機制

至於為什麼網路上總是會或說 “Semaphore 是 Resource counter” 或 “Semaphore 用來管理資源” ?

並不是只上述的說法有問題，只是這樣的解釋其實將 Semaphore 給退化了。

“Semaphore 是 Resource counter” 或 “Semaphore 用來管理資源” 其實只是一種 Semaphore 特性的運用。

將 控制 與 管理 執行流 實踐在 Resource counter 與 Resource Manager.


## What is Mutex ?

> **Mutex 就像是資源的一把鎖：解鈴還須繫鈴人。** \
> 摘錄自：Linux 核心設計: 淺談同步機制

確保在同一時間內，critical section 只存在一位操作者。



## Reference

* [Mutexes and Semaphores Demystified](https://barrgroup.com/blog/mutexes-and-semaphores-demystified)
* [Linux 核心設計: 淺談同步機制](https://hackmd.io/@sysprog/linux-sync?type=view)