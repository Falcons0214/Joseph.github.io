## Brief

:::warning
This Note arrange work flow about:
**"How to use FreeRTOS stream buffer build a simple cross core message buffer."**
:::

## Stream Buffer Control Block

In FreeRTOS, Stream Buffer use `StreamBuffer_t` type as a control block type, **"All of control information will stay in same structure"**.

:::warning
This structure only could be access in kernel, because the structure itself define in `.c` file not `.h`.

The author don't want user directly access task control block.

**So how do we use it or calculate the size of the structure ?**
:::

Define [FreeRTOS-Kernel/stream_buffer.c](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/0030d609a4b99118d9a400340d88c3c3c4816f2b/stream_buffer.c#L232)
```c=
typedef struct StreamBufferDef_t
{
    volatile size_t xTail;                       /* Index to the next item to read within the buffer. */
    volatile size_t xHead;                       /* Index to the next item to write within the buffer. */
    size_t xLength;                              /* The length of the buffer pointed to by pucBuffer. */
    size_t xTriggerLevelBytes;                   /* The number of bytes that must be in the stream buffer before a task that is waiting for data is unblocked. */
    volatile TaskHandle_t xTaskWaitingToReceive; /* Holds the handle of a task waiting for data, or NULL if no tasks are waiting. */
    volatile TaskHandle_t xTaskWaitingToSend;    /* Holds the handle of a task waiting to send data to a message buffer that is full. */
    uint8_t * pucBuffer;                         /* Points to the buffer itself - that is - the RAM that stores the data passed through the buffer. */
    uint8_t ucFlags;

    #if ( configUSE_TRACE_FACILITY == 1 )
        UBaseType_t uxStreamBufferNumber; /* Used for tracing purposes. */
    #endif

    #if ( configUSE_SB_COMPLETED_CALLBACK == 1 )
        StreamBufferCallbackFunction_t pxSendCompletedCallback;    /* Optional callback called on send complete. sbSEND_COMPLETED is called if this is NULL. */
        StreamBufferCallbackFunction_t pxReceiveCompletedCallback; /* Optional callback called on receive complete.  sbRECEIVE_COMPLETED is called if this is NULL. */
    #endif
    UBaseType_t uxNotificationIndex;                               /* The index we are using for notification, by default tskDEFAULT_INDEX_TO_NOTIFY. */
} StreamBuffer_t;
```

Previous we mention the `StreamBuffer_t` only use in kernel code, so here the `StaticStreamBuffer_t` provide a way let us could use this "type" get the struct size.

Like: `sizeof()`

Define: [FreeRTOS-Kernel/include/FreeRTOS.h](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/0030d609a4b99118d9a400340d88c3c3c4816f2b/include/FreeRTOS.h#L3348)
```c=
typedef struct xSTATIC_STREAM_BUFFER
{
    size_t uxDummy1[ 4 ];
    void * pvDummy2[ 3 ];
    uint8_t ucDummy3;
    #if ( configUSE_TRACE_FACILITY == 1 )
        UBaseType_t uxDummy4;
    #endif
    #if ( configUSE_SB_COMPLETED_CALLBACK == 1 )
        void * pvDummy5[ 2 ];
    #endif
    UBaseType_t uxDummy6;
} StaticStreamBuffer_t;
```

Right now we already know the structure use to control stream buffer, all of control infomation will stay in it.

:::warning
**"So, first we make sure the object will stay in a share memory that could be accessable from different core."** 

**How to do that ?**
:::

## Make sure the Control block in a share memory

Here, I have two way for implement it.

### First: Casting
:::warning
**Determined an address and casting the address by `StreamBufferHandle_t` type.**
:::

The `StreamBufferHandle_t` type is a typedef type provide from [FreeRTOS-Kernel/include/stream_buffer.h](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/0030d609a4b99118d9a400340d88c3c3c4816f2b/include/stream_buffer.h#L79), it provide a way that us could use it casting an object to the structure.

**Second: Link-Script with GNU attribute**

:::success
As we know, the **"Link-Script"** decided the final mapping between the object we see in code and the physical address, so here we could do this:
:::

### Second: Link-Script with attribute
```=
MEMORY {
    ...
    SHARE_MEM: ORIGIN = 0x80000000, LENGTH = 24k
    ...
}
```

```=
.shareMem (NOLOAD) : ALIGN(16) {
    PROVIDE( __shareMem_start = .);
    *(.shareMem .shareMem.*)
    PROVIDE( __shareMem_start = .);
} >SHARE_MEM
```

**C code:**
```c
<type> __attribute__(section(".shareMem")) control_block = {
    .<member> = 0x...,
};
```

Above is an example for demo **"how to declare a global variable, let could be access between different core."**

:::warning
If we don't use GNU-attribute told the linker put this variable into the `.shareMem` section, by default it will be put into `.data` section.

Because by usually different core have it own "DLM", when compiler see the variable it will see the variable as a variable that would be put in itself "DLM", but for cross-core communicate, we need the control block share between each core, so the modify will be see by each other, and that is why we need link-script arrange a space and use GNU-attribute told the linker put this variable in the section we want.

So the fianl global variable have same name and both use GNU-attribute put it in the section will have same instance.
:::

## Thed Send & Recv Mechanism about Stream Buffer

### Send state diagram

```c=
 ┌───────────────┐
 │ Start / Assert│
 └──────┬────────┘
        │
        ▼
 ┌───────────────┐
 │ Check Buffer  │
 │ Type          │
 └──────┬────────┘
        │
        ├───[Message Buffer & Too Big]───► (Force xTicksToWait=0)
        │
        ▼
 ┌───────────────────┐
 │ Wait for Space?   │◄───────────────┐
 │ (xTicksToWait > 0)│                │
 └──────┬────────────┘                │
        │Yes                          │ Timeout
        ▼                             │
 ┌───────────────────────┐            │
 │ Check Available Space │            │
 └──────┬────────────────┘            │
        │Enough                       │
        ▼                             │
 ┌───────────────┐  Not enough        │
 │ Write to Buf  │────────────────────┘
 └──────┬────────┘
        │
        │ Success (xReturn > 0)
        ▼
 ┌───────────────────────┐
 │ Trigger recv if ready │
 └──────┬────────────────┘
        │
        ▼
  (Return xReturn)

        │``
        │ Failure (xReturn == 0)
        ▼
 ┌───────────────┐
 │ Trace Failed  │
 └──────┬────────┘
        ▼
  (Return 0)
```

### Recv state diagram

```c=
 ┌───────────────┐
 │ Start / Assert│
 └──────┬────────┘
        ▼
 ┌───────────────────────────┐
 │ Decide xBytesToStoreMsgLen│
 └──────┬────────────────────┘
        │
        ▼
 ┌───────────────────────┐
 │ Wait for Data?        │
 │ (xTicksToWait > 0)    │
 └──────┬────────────────┘
        │Yes
        ▼
 ┌───────────────────────────┐
 │ Check Available Bytes     │
 └──────┬────────────────────┘
        │Enough bytes
        ▼
 ┌───────────────────────────┐
 │ Read From Buffer          │
 └──────┬────────────────────┘
        │
        │ Success
        ▼
 ┌───────────────────────────┐
 │ Trace + Wake Sender       │
 └──────┬────────────────────┘
        │
        ▼
   (Return xReceivedLength)

        │
        │ Failure (not enough bytes or read=0)
        ▼
 ┌───────────────────────────┐
 │ Trace Receive Failed      │
 └──────┬────────────────────┘
        ▼
   (Return 0)
```

Basically, when buffer have enough space the send function will put message in buffer and trigger interrupt by `PLIC` signal the other core, if buffer already full or the space dosen't enough, this situation will depend on the timeout you specify, if timeout value unequal to zero, it will waiting until timeout.

Recv same as send.


## The Structure of Cross-core Message Buffer 

![CtcMessageBuffer.drawio](https://hackmd.io/_uploads/BJvnfpP5ll.svg)

:::success
**Behavior Description**

**Send**: 
* If Buffer have enough space it will copy message from local memory to share buffer, and trigger interrupt for notify other core receive message.
* If buffer dosen't have space it will return directly.

**Recv:**
* If Buffer have message it will copy the message from share buffer to the local buffer you specified.
* If buffer dosen't have message it will check the timeout value, if it more than zero, it will waiting until timeout, or just return directly.
:::

Next we will looking how to implement all of that.

## Implement

First, we need list all of problem need solve:

:::warning
**Problem we need solve:**

1. **The Buffer Control Block should stay in a "memory region", that could be access from each other core.**
2. **How to notify other core, when data already put in buffer ?**
:::

The first we already told above, so we start from second.

## Code we need modified

According this ["post"](https://www.freertos.org/Community/Blogs/2020/simple-multicore-core-to-core-communication-using-freertos-message-buffers) we know, the key component for `send` & `receive` are `sbSEND_COMPLETED()` & `sbRECEIVE_COMPLETED()` and the FreeRTOS message buffer is base on stream buffer mechanism, so if we search above functions in the source file, we could find:

**sbSEND_COMPLETED()**
```c
#ifndef sbSEND_COMPLETED
    #define sbSEND_COMPLETED( pxStreamBuffer )                                  \
vTaskSuspendAll();                                                              \
{                                                                               \
    if( ( pxStreamBuffer )->xTaskWaitingToReceive != NULL )                     \
    {                                                                           \
        ( void ) xTaskNotifyIndexed( ( pxStreamBuffer )->xTaskWaitingToReceive, \
                                     ( pxStreamBuffer )->uxNotificationIndex,   \
                                     ( uint32_t ) 0,                            \
                                     eNoAction );                               \
        ( pxStreamBuffer )->xTaskWaitingToReceive = NULL;                       \
    }                                                                           \
}                                                                               \
( void ) xTaskResumeAll()
#endif /* sbSEND_COMPLETED */

#if ( configUSE_SB_COMPLETED_CALLBACK == 1 )
    #define prvSEND_COMPLETED( pxStreamBuffer )                                           \
do {                                                                                      \
    if( ( pxStreamBuffer )->pxSendCompletedCallback != NULL )                             \
    {                                                                                     \
        ( pxStreamBuffer )->pxSendCompletedCallback( ( pxStreamBuffer ), pdFALSE, NULL ); \
    }                                                                                     \
    else                                                                                  \
    {                                                                                     \
        sbSEND_COMPLETED( ( pxStreamBuffer ) );                                           \
    }                                                                                     \
} while( 0 )
#else /* if ( configUSE_SB_COMPLETED_CALLBACK == 1 ) */
    #define prvSEND_COMPLETED( pxStreamBuffer )    sbSEND_COMPLETED( ( pxStreamBuffer ) )
#endif /* if ( configUSE_SB_COMPLETED_CALLBACK == 1 ) */
```

If we define `configUSE_SB_COMPLETED_CALLBACK` in **FreeRTOSConfig.h** it will compile with callback option, but right now we just focue on the general option.

:::warning
Because the original FreeRTOS is use for **"single core"** processor, it could base on the **"notify mechanism"** for send signal for the task block by receive function.
:::

:::warning
:bangbang: But right now in **"multi-core" communication**, **"two tasks are running on the different core and each them manage by separate FreeRTOS kernel"**, so we can't use notify mechanism provide by FreeRTOS.
:::


**Version for Cross-core communication**
```c
#ifndef sbSEND_COMPLETED
#define sbSEND_COMPLETED( pxStreamBuffer )                                      \
vTaskSuspendAll();                                                              \
{
/*
 *  Put PLIC trigger procedure in here ! (On RISC-V)
 */
}                                                                               \
( void ) xTaskResumeAll()
#endif /* sbSEND_COMPLETED */
```

:::warning
至於，是否需要 **"暫停 FreeRTOS scheduler"**，我的觀點是 "不用"。

Single-core 要暫停的原因在於 notify mechanism 會需要修改 Task Control Block 中的資料，而 `vTaskSuspendAll()` 要做的事是 **"確保修改的原子性"**，若不暫停 scheduler，可能導致 Task 狀態在切換的途中 scheduler 觸發 interrupt 打斷修改流程，進而導致 Task Control Block 發生 race condition 的問題。

要保護的是在 Share memory 中，會被多顆核心存取的資料結構，當然這取決於該資料結構的設計。
:::

**sbRECEIVE_COMPLETED()**

The idea same as send, skip ~

## Notify by interrupt

The **"interrupt structure"** will depend on different **"ISA"**, so in here we will use pseudo code.

[entry.S](https://github.com/FreeRTOS/FreeRTOS/blob/main/FreeRTOS/Demo/RISC-V_RV32_SiFive_HiFive1-RevB_FreedomStudio/freedom-metal/src/entry.S)


以 RISC-V PLIC 為例 會透過 對 Target panding bit 寫入 1 產生該 Target output wire 所連接到的 Core 的 MEIP or MSIP：
```=
PLIC_Trigger_function()
```

## Share Memory for identify the Interrupt event.

Interrupt Wire 在只有一條線的情況下，若要將 FreeRTOS 中的功能全部支援 Cross-core 就需要一個額外的 “訊息” 來表示是 “誰 (Message-buffer、Notify、Queue)” 產生中斷。