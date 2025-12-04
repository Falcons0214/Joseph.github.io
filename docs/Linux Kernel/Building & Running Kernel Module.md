## What Is A Kernel Module?

>**A Linux kernel module is precisely defined as a code segment capable of dynamic loading and unloading within the kernel as needed.**
>
>摘錄自 lkmpg 1.3

列出目前已載入的 modules

```
sudo lsmod
```

這些已載入的 modules 記錄在 `/proc/modules` 之下。

insmod: 載入
rmmod: 卸除

## Why Kernel Modules Are Needed ?

* **For extending the operating system's functionality without requiring a system reboot.**
* **Feasibility of Writing and Dynamically Loading Every Driver.**

### The Disadvantage of Monolithic kernel

If a system relies on a monolithic kernel, **any new functionality must be directly integrated into the kernel image**

This integration results in:
* Larger kernels.
* The necessity of kernel rebuilding when new features are desired.
* A subsequent system rebooting after the kernel rebuild to apply the changes.

:::warning
The developers have the option to compile certain drivers directly into the kernel image (making them built-in) rather than compiling them as dynamically loadable modules.
:::

個人理解，Kernel 為了全面性兼容，所以傾向提供更多選擇給開發者 (Built-in or modular) ，根據使用者需求 (應用場景) 選擇各自所需。

## Kernel Modules Versus Applications

> **A module, on the other hand, is linked only to the kernel, and the only functions it can call are the ones exported by the kernel; there are no libraries to link to.**
> 
> 摘錄自 LDD3

## Compiling & Loading

如何前述提到，在編譯 Kernel module 時，相較一般 user level application 有著非常大的差別，在編譯 user level application 時我只需要 include 會在程式中使用到的 function 的 .h檔 gcc 就會將一切都打包好。

而 kernel module 是運行在 Kernel space 中，所以在編譯時必須根據該 module 是要運行在哪一版本的 kernel 進行編譯，甚至會檢查編譯 module 時 gcc的版本是否與編譯運行中的 kernel 的版本相符，相比一般程式就需要更多的 “東西”。

> **Modules must use kbuild to stay compatible with changes in the build infrastructure and to pick up the right flags to "gcc."**
> 
> 摘錄自 [Building External Modules 1. intro](https://github.com/torvalds/linux/blob/master/Documentation/kbuild/modules.rst#1-introduction)

[**Linux Kernel Makefile (kbuild makefiles)**](https://github.com/torvalds/linux/blob/master/Documentation/kbuild/makefiles.rst)

## How to Build External Modules ?

>**To build external modules, you must have a prebuilt kernel available that contains the configuration and header files used in the build. Also, the kernel must have been built with modules enabled.**

## Creating a Kbuild File for an External Module

在當前撰寫 module 的目錄底下建立 Makefile。

```
<Your working directory>
    |
    |-- Makefile
    |-- other
```

**Example:**
```cmake=
CONFIG_HELLO := m
obj-$(CONFIG_HELLO) += hello-1.o

PWD := $(CURDIR)

all:
    make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
    make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
```

**Another Example:**
```cmake=
# If KERNELRELEASE is defined, we've been invoked from the
# kernel build system and can use its language.
ifneq ($(KERNELRELEASE),)
# kbuild part of makefile
obj-m  := 8123.o
8123-y := 8123_if.o 8123_pci.o 8123_bin.o

else
# normal makefile
KDIR ?= /lib/modules/`uname -r`/build

default:
        $(MAKE) -C $(KDIR) M=$$PWD

# Module specific targets
genbin:
        echo "X" > 8123_bin.o_shipped

endif
```

**`obj-$(CONFIG_HELLO) += <Your module name.o>`** 是 module 編譯後的.o 檔(還未 Link)。

若 module 是由不止一個檔案構成: **`<module_name>-y := <src1>.o <src2>.o ...`**， `y` 就是告知 make 要將這些來源一起連結進最後的 `module_name`.ko。

### `-C`

>  -C dir, --directory=dir
>  **Change to directory dir before reading the makefiles or doing anything else.**
>  
>  摘錄自 man make

### `M=`

> The M= option causes that makefile to move back into your module source directory before trying to build the modules target.
> 
> 摘錄自 LDD3

### $(CONFIG_HELLO)

> **$(CONFIG_HELLO) evaluates to either y (for built-in) or m (for module).**
> 
> 摘錄自 [Goal Definitions](https://github.com/torvalds/linux/blob/master/Documentation/kbuild/makefiles.rst#goal-definitions)

[**Example**](https://github.com/torvalds/linux/blob/master/drivers/char/Makefile)

### `PWD := $(CURDIR)` & `M=$(PWD)`

:::danger
Why need this `PWD := $(CURDIR)` ?
:::

**Ans:**
>**Because some environment variables are specified by the security policy, they can’t be inherited.**
>
>摘錄自 lkmpg

**About** [**CURDIR**](https://www.gnu.org/software/make/manual/make.html#Recursion)

> **Recursive use of make means using make as a command in a makefile. This technique is useful when you want separate makefiles for various subsystems that compose a larger system.**
> 
> 摘錄自 GNU Make 5.7

### Separate Kbuild File and Makefile

[**Link**](https://github.com/torvalds/linux/blob/master/Documentation/kbuild/modules.rst#32-separate-kbuild-file-and-makefile)

**Kbuild:**
```cmake=
CONFIG_HELLO := m
obj-$(CONFIG_HELLO) += hello-1.o
```

**Makefile**
```cmake=
PWD := $(CURDIR)

all:
    make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
    make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
```

## Loading and Unloading Modules

**Some basic command:**

* lsmod: list module
* insmod: install module
* rmmod: remove module

## Entry Point & Exit Point


```c=
int init_module(void)
{
    // ...
}
void cleanup_module(void)
{
    // ...
}
```

**Another way**


```c=
static int __init your_module_init_name(void)
{
    // ...
}
static void __exit your_module_exit_name(void)
{
    // ...
}

module_init(your_module_init_name);
module_exit(your_module_exit_name);
```

### __init & __exit

**`__init`**
> **The __init macro causes the init function to be discarded and its memory freed once the init function finishes for built-in drivers, "but not loadable modules."**
> 
> 摘錄自 lkmpg

**__exit**
> **The __exit macro causes the omission of the function when the module is built into the kernel, and like __init, has no effect for loadable modules.**
>
>摘錄自 lkmpg

**`__initdata`**: 跟 `__init` 很像，差別在`__init`是給 function，`__initdata`是給變數。

省略 exit function 對於 built-in module 來說很直覺，因為 built-in 會隨著 Kernel 的生命週期。

## Passing Command Line Arguments to a Module

[**/include/linux/moduleparam.h**](https://github.com/torvalds/linux/blob/master/include/linux/moduleparam.h)

> **The variable declarations and macros should be placed at the beginning of the module for clarity.**
> 
> 摘錄自 lkmpg

```c
static short int myshort = 1;
static int myint = 420;
static long int mylong = 9999;
static char *mystring = "blah";
static int myintarray[2] = { 420, 420 };
static int arr_argc = 0;

/* module_param(foo, int, 0000)
 * The first param is the parameters name.
 * The second param is its data type.
 * The final argument is the permissions bits,
 * for exposing parameters in sysfs (if non-zero) at a later stage.
 */
module_param(myshort, short, S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP);
MODULE_PARM_DESC(myshort, "A short integer");
module_param(myint, int, S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH);
MODULE_PARM_DESC(myint, "An integer");
module_param(mylong, long, S_IRUSR);
MODULE_PARM_DESC(mylong, "A long integer");
module_param(mystring, charp, 0000);
MODULE_PARM_DESC(mystring, "A character string");

/* module_param_array(name, type, num, perm);
 * The first param is the parameter's (in this case the array's) name.
 * The second param is the data type of the elements of the array.
 * The third argument is a pointer to the variable that will store the number
 * of elements of the array initialized by the user at module loading time.
 * The fourth argument is the permission bits.
 */
module_param_array(myintarray, int, &arr_argc, 0000);
MODULE_PARM_DESC(myintarray, "An array of integers");
```

## Preliminaries

### Functions available to modules

> **Modules are object files whose symbols get resolved upon running insmod or modprobe. The definition for the symbols comes from the kernel itself; the only external functions you can use are the ones provided by the kernel.**
> 
> 摘錄自 lkmpg

在 **/proc/kallsyms** 中列出 Kernel export 的所有 Symbol。

### User space vs. Kernel space

簡略來說 CPU 提供了不同的 "操作等級"，根據等級的不同對系統能做的操作也會有不同限制。

### Name space

> Any global variables you have are part of a community of other peoples’ global variables; some of the variable names can clash. **When a program has lots of global variables which aren’t meaningful enough to be distinguished, you get namespace pollution.**
> 
> 摘錄自 lkmpg

在大型程式的開發中，會需要一套命名規則去避免符號名稱的衝突。

### Code space

> The kernel has its own space of memory as well. Since a module is code which can be dynamically inserted and removed in the kernel, **it shares the kernel’s codespace rather than having its own.** Therefore, if your module segfaults, the kernel segfaults.
> 
> 摘錄自 lkmpg

## Device Driver

> **One class of module is the device driver, which provides functionality for hard- ware like a serial port.**
> 
> 摘錄自 lkmpg

不同的硬體會透過各自的 device driver 將硬體所提供的功能，透過符合 Kernel 規範介面的方式以模組的形式載入進 kernel。

### Major & Minor

```
                          major  minor
brw-rw----   1 root disk      8,     0  一   5 04:06 sda
brw-rw----   1 root disk      8,     1  一   5 04:06 sda1
brw-rw----   1 root disk      8,     2  一   5 04:06 sda2
brw-rw----   1 root disk      8,     3  一   5 04:06 sda3
```

**Major**
> **The major number tells you "which driver" is used to access the hardware.** Each driver is assigned a unique major number; all device files with the same major number are controlled by the same driver.
> 
> 摘錄自 lkmpg

**Minor**
> **The minor number is used by the driver to distinguish between the various hardware it controls.** 
> All three devices are handled by the same driver they have unique minor numbers because the driver sees them as being different pieces of hardware.
> 
> 摘錄自 lkmpg

### Block & Character

> **Devices are divided into two types: character devices and block devices.** The difference is that block devices have a buffer for requests.
> 
> Another difference is that **block devices can only accept input and return output in blocks** (whose size can vary according to the device), whereas character devices are allowed to use as many or as few bytes as they like.
> 
> 摘錄自 lkmpg


:::warning
:bangbang: "hardware" 一詞在 kernel 中不全然代表著 “硬體”。
```
$ ls -l /dev/sda /dev/sdb
brw-rw---- 1 root disk 8,  0 Jan  3 09:02 /dev/sda
brw-rw---- 1 root disk 8, 16 Jan  3 09:02 /dev/sdb
```

> **Sometimes two device files with the same major but different minor number can actually represent the same piece of physical hardware.**
> **So just be aware that the word “hardware” in our discussion can mean something very abstract.**
>
> 摘錄自 lkmpg

:::