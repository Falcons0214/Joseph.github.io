## Brief

The content help me for answer the  question: **"What is RAID ?"**

## What is RAID ?

:::info
**RAID (Redundant Array of Independent Disks)**, implemented in Linux via the MD (Multiple Devices) kernel driver, **is a "block layer virtualization service" that aggregates multiple physical storage devices into a single logical volume.** 

Its **core function is to implement redundancy (data recovery), performance (throughput), or a balance of both**, through techniques like mirroring, striping, and parity calculation, thereby abstracting the complex underlying physical topology from higher-level consumers such as the File System and Logical Volume Manager.
:::

與 LVM 的關係 ？

兩個 是不同 “服務” 由 kernel 提供。

## In Linux kernel storage stack, which level provide RAID feature ?

:::success
In the Linux kernel storage stack, RAID is provided at the **Block Layer**.

Specifically, it is **handled by a kernel driver called MD (Multiple Devices)**.
:::

**Simplified hierarchy:** 
1. **User Space Application**
    * Sends "write file" command
2. **VFS** (Virtual File System)
    * Standardizes the command
3. **File System** (ext4, XFS, Btrfs)
    * Decides which "logical blocks" to write to
4. :bangbang:**BLOCK LAYER** (The RAID Level)
    * Driver: md (Multiple Devices) or dm (Device Mapper)
    * What happens here: The kernel sees a request for "Virtual Device md0." The MD driver intercepts this, calculates where the data actually goes (e.g., split between Drive A and Drive B), and generates new requests for the physical hardware.
5. **Physical Device Drivers** (SCSI, NVMe, SATA)
    * Talks to the actual hardware controllers
6. **Physical Hardware** (HDD, SSD)

:::warning
RAID 的服務在 kernel storage stack 中的 block layer 實作，這代表 RAID 本身在乎的事情是 "Block"，對於 file 更 high level 的概念是不理解的。

既然 RAID 是在 block level 被實作，代表 RAID 要解決的問題會圍繞在 Block 與 Block 所存放的 back storage。

回顧 RAID 所提供服務，可以將服務提供的功能分類為 “redundancy (data recovery)” 與 “performance (throughput)” 或是 “balance of both”，並將這些功能透過管理多個 storage devices 實踐，最後提供給使用者一個統一的 abstract device。
:::

## RAID feature that access data use block as a basic unit ?

:::success
The smallest unit of disk I/O for the Linux kernel is the block (typically 4 KiB, or sometimes 512 bytes, depending on the hardware).

However, **the unit that RAID uses to distribute data across multiple drives is called a "chunk" or "stripe" unit.**
:::


## What is `md` (Multiple Devices) ?

:::info
RAID service provider.

It is a kernel driver, that working in kernel-space.
:::

```=
user-space
            mdadm tools
               |
-------------------------------
kernel-space   |
               |
            md driver
```


