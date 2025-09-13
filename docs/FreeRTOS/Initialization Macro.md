## Brief

整理如何 "優雅" 的 Initialization.

## Tools We Need

* Link-Script
* C code

## Init Macro

```c
typedef void (*PINITCALL_T)(void);

#define __DEFINE_INITCALL(fn, level) \
	PINITCALL_T __initcall_##fn \
	__attribute__((__unused__)) \
	__attribute__((__section__(".__init." level))) = (PINITCALL_T)fn

#define DRIVER_INIT(x)         __DEFINE_INITCALL(x, "driver")
```
## Link-Script Code

```
.__init.driver : {
    __initcall_driver_start = .;
    *(__init.driver)
    __initcall_driver_end = .;
}
```

:::warning
將所有 Driver 的 Init function 的 function pointer 集中在 `.__init.driver` section 中。
:::

## C code for Calling driver Initialization function

```c
extern PINITCALL_T __initcall_driver_start[];
extern PINITCALL_T __initcall_driver_end[];

void do_driver_init(void) {
    PINITCALL_T *call;
    for (call = __initcall_driver_start; call < __initcall_driver_end; call++) {
        (*call)();
    }
}
```

:::warning
`.__init.driver` section 中的資料皆為 指向特定 driver init function 的 function pointer，所以直接透過一個迴圈呼叫即可。
:::

## Driver Init dependency

