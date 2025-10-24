## Brief 

The content talk about **"Building a UART Log System with FreeRTOS on Multi-core single UART env"**.

## System Structure

![LOG_SYSTEM](Log_system.png)

* Task A: A FreeRTOS Task, that use to fetch log from "Buffer" and push log in UART TXFIFO.
* Task B: A FreeRTOS Task, that use to receive log from Node buffer.
* Node (1 ~ n) Buffer: In the core that running embedded process.
* Buffer: In the core that running FreeRTOS.

## Data Structure We Would Use

