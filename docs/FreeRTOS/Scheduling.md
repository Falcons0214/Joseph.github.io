## Breif

整理 FreeRTOS TCB(Task Control Block) 如何被 FreeRTOS Schedular 管理。

## Task & Task Control Block

下方為 FreeRTOS 中的 Task Control Block（省略部分程式碼）。

```c
/*
 * Task control block.  A task control block (TCB) is allocated for each task,
 * and stores task state information, including a pointer to the task's context
 * (the task's run time environment, including register values)
 */
typedef struct tskTaskControlBlock       /* The old naming convention is used to prevent breaking kernel aware debuggers. */
{
    volatile StackType_t * pxTopOfStack; /**< Points to the location of the last item placed on the tasks stack.  THIS MUST BE THE FIRST MEMBER OF THE TCB STRUCT. */

    //...

    ListItem_t xStateListItem;                  /**< The list that the state list item of a task is reference from denotes the state of that task (Ready, Blocked, Suspended ). */
    ListItem_t xEventListItem;                  /**< Used to reference a task from an event list. */
    UBaseType_t uxPriority;                     /**< The priority of the task.  0 is the lowest priority. */
    StackType_t * pxStack;                      /**< Points to the start of the stack. */
    #if ( configNUMBER_OF_CORES > 1 )
        volatile BaseType_t xTaskRunState;      /**< Used to identify the core the task is running on, if the task is running. Otherwise, identifies the task's state - not running or yielding. */
        UBaseType_t uxTaskAttributes;           /**< Task's attributes - currently used to identify the idle tasks. */
    #endif
    char pcTaskName[ configMAX_TASK_NAME_LEN ]; /**< Descriptive name given to the task when created.  Facilitates debugging only. */

    //...
} tskTCB;

/* The old tskTCB name is maintained above then typedefed to the new TCB_t name
 * below to enable the use of older kernel aware debuggers. */
typedef tskTCB TCB_t;
```

:::info
不外乎結構中的成員圍繞在組成 Task 的基本元素:

* Task Name
* Task Stack & stack top pointer
* Task Priority
* Task State list
:::

:::warning
在 TCB 中的第一位成員 (`volatile StackType_t * pxTopOfStack`) 的註解中提到:
* THIS MUST BE THE FIRST MEMBER OF THE TCB STRUCT.

主要是因為可以結接透過對 指向 TCB 的 pointer casting 成該型態便可以取得 Task stack top.
:::

## Task Creation

> Each task requires two blocks of RAM: **one to hold its Task Control Block (TCB)** and **one to store its stack.** \
> FreeRTOS API functions with "Static" in their names use pre-allocated blocks of RAM passed into the functions as parameters. \
> Conversely, API functions without "Static" in their names allocate the required RAM dynamically at runtime from the system heap.

上述總結了 Task 所需要的空間配置，**"儲存 TCB 的空間" 與 "Task Stack"**。

## Task Priorities

### Range of Priority

:::warning
The application-defined `configMAX_PRIORITIES` **"compile-time configuration constant"** sets the number of available priorities.

So valid priorities range from `0` to `(configMAX_PRIORITIES – 1)`.
:::

### The Way to set or modify Task Priority

* `uxPriority` parameter in `xTaskCreate()` Function.
* `vTaskPrioritySet()` for changes a task's priority after its creation.

### Scheduling Policy

:::warning
* **Preemptive:** If a task with a higher priority becomes ready (e.g., due to an interrupt, a task notification, or a semaphore release), the scheduler immediately interrupts the currently running, lower-priority task and switches context to the higher-priority task.
* **Priority-Based:** Tasks are assigned a priority level. The scheduler's fundamental rule is: 
    * :bangbang:  **"the highest-priority task that is ready to run will always be the task that is running."**
:::

### Summary

FreeRTOS 透過 `xTaskCreate()` 建立 Task，且該 Task 的 Priority 必須在一建立時決定好。

在制定 Task Priority 時，需謹慎考慮該 Task 使用場景，因為擁有 Higher Priority 的 Task 除非進入 Blocked State 否則將會持續佔有 CPU。

## Task State

> To make these tasks useful, they must be re-written to be event-driven. \
> An event-driven task only has work (processing) to perform after an event triggers it and cannot enter the Running state before that time. \
> The scheduler always selects the highest priority task that can run. \
> If a high-priority task cannot be selected because it is waiting for an event, the scheduler must, instead, select a lower-priority task that can run. \
> Therefore, writing event-driven tasks means tasks can be created at different priorities without the highest priority tasks starving all the lower priority tasks of processing time.

其實在使用過 `Notify` 與一些 FreeRTOS 的 IPC Mechanism 後，就覺得這些 IPC 在設計初時，應該是希望使用者在撰寫時，是使用 **Event-Driven** 的思維。

:::warning
**High Priority Task always trigger by some event, and after finished it directly go to the block state wait event again.**
:::

### The Blocked State

> **A task waiting for an event is said to be in the 'Blocked' state, a sub-state of the Not Running state.**

:::warning
Tasks can enter the Blocked state to wait for two different types of events:

* **Temporal (time-related) events**: For example, a task may enter the Blocked state to wait for 10 milliseconds to pass.
* **Synchronization events**: These events originate from another task or interrupt. For example, a task may enter the Blocked state to wait for data to arrive on a queue. Synchronization events cover a broad range of event types.
    * FreeRTOS queues, binary semaphores, counting semaphores, mutexes, recursive mutexes, event groups, stream buffers, message buffers, and direct to task notifications can all create synchronization events. 
:::

### The Suspended State

Tasks in the Suspended state are not available to the scheduler.

The only way to enter the Suspended state is through a call to the vTaskSuspend() API function, and\
the only way out is through a call to the vTaskResume() or xTaskResumeFromISR() API functions. 

### The Ready State

Tasks that are in the Not Running state and are not Blocked or Suspended are said to be in the Ready state.

### State Transition Diagram

![alt text](image-1.png)

### Summary

FreeRTOS 的 Task State 相對 Linux kernel 單純好幾個檔次，個人認為是 FreeRTOS 在設計之初，是被設計來解決 可透過\
“有限狀態機” 表示的問題，且這些問題是被侷限在問題都已確定的情況下，所以才能夠將設計做到最簡化。


## Time Measurement and the Tick Interrupt

這裡就先提到 "Time slicing" 的概念，在 FreeRTOS 中， `configUSE_TIME_SLICING` 預設是被啟用的，其功能就是\
允許相同 priority Task 可以共享 CPU time。

:::warning
那 FreeRTOS 是如何 “決定” 與 “測量” Task 到底可以佔用 CPU 多長呢？

Answer: **A periodic interrupt, called the 'tick interrupt', is used for this purpose.**

在 FreeRTOSConfig.h 中有兩個 Compile time configure 來決定每一個 Task 可以佔用 CPU 的時間:
```c
#define configCPU_CLOCK_HZ	CONFIG_CPU_CLOCK_HZ
#define configTICK_RATE_HZ	(TickType_t)CONFIG_TICK_RATE_HZ 
```

`configCPU_CLOCK_HZ`: This macro defines the frequency (speed) of the processor core that is running the FreeRTOS kernel.\
`configTICK_RATE_HZ`: This macro defines the frequency of the RTOS tick interrupt.

* Timer Reload Value = `configCPU_CLOCK_HZ` / `configTICK_RATE_HZ`
:::

