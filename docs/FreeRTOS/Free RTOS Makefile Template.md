## Brief

Record Makefile for building FreeRTOS.

## Makefile

```Makefile
TC_PATH = /project_sw/toolchain/install/riscv-gcc-14.2.0-newlib/bin
OBJDUMP = $(TC_PATH)/llvm-objdump
OBJCOPY = $(TC_PATH)/riscv64-unknown-elf-objcopy

XLEN   ?= 64
CROSS   = $(TC_PATH)/riscv$(XLEN)-unknown-elf-
CC      = $(CROSS)gcc
CPP     = $(CROSS)g++
ARCH    = $(CROSS)ar

# llvm objdump for RV trace log
DEBUG ?= 1

# Build Binary for FPGA 
BUILD_FPGA ?=

# CONFIG NEED SEND IN FREERTOS
CONFIG_CPU_CLOCK_HZ := 0
CONFIG_TICK_RATE_HZ := 0


ifeq ($(BUILD_FPGA),1)
ENV_DEFINES += -DBUILD_FPGA=1
CONFIG_CPU_CLOCK_HZ = 25000000UL
CONFIG_TICK_RATE_HZ = 1000
else
CONFIG_CPU_CLOCK_HZ = 150000000UL
CONFIG_TICK_RATE_HZ = 50000
endif

# C Compiler arch setting
ifeq ($(XLEN), 64)
    MARCH = rv64gc_zfh
    MABI = lp64d
else
    MARCH = rv32ima
    MABI = ilp32
endif

ASFLAGS = -march=$(MARCH) -mabi=$(MABI) -mcmodel=medany -g

CFLAGS = $(ASFLAGS) \
	-O2 -g3 \
	-fno-tree-vectorize \
	-ffast-math -fno-common -fno-builtin-printf \
	-DCONFIG_CPU_CLOCK_HZ=$(CONFIG_CPU_CLOCK_HZ) \
	-DCONFIG_TICK_RATE_HZ=$(CONFIG_TICK_RATE_HZ)

ifeq ($(BUILD_C1) , 1)
	CFLAGS += -DBUILD_C1
endif

LDFLAGS ?= -static -nostartfiles -lm -lgcc $(CFLAGS)

BUILD_DIR       = build
RTOS_SOURCE_DIR = $(abspath ../../Source)
TOOLS_DIR       = $(abspath ../tools)
RTOS_HAL_DIR    = $(abspath ../hal)
SIM_ENV_DIR     = $(abspath ../sim)
DRIVER_DIR      = $(abspath ../driver)
INIT_DIR        = $(abspath ../init)
LIB_DIR         = $(abspath ../lib)
LOG_DIR         = $(abspath ../log)
FX3_DIR         = $(abspath ../fx3)

CPPFLAGS = \
	-DSPIKE=0 \
	-D__riscv_float_abi_soft \
	$(ENV_DEFINES) \
	-I . \
	-I $(LOG_DIR) \
	-I $(LIB_DIR) \
	-I $(INIT_DIR) \
	-I $(DRIVER_DIR) \
	-I $(SIM_ENV_DIR) \
	-I $(FX3_DIR)/inc \
	-I $(RTOS_HAL_DIR) \
	-I ../Common/include \
	-I $(RTOS_SOURCE_DIR)/include \
	-I $(RTOS_SOURCE_DIR)/portable/GCC/RISC-V \
	-I $(RTOS_SOURCE_DIR)/portable/GCC/RISC-V/chip_specific_extensions/RISCV_no_extensions \
	-I $(CURDIR)/../../../../../en_bsp/gen_headers/generated_headers/ # For fx3

#
# entry.c is entry point for FreeRTOS.
#
# main.c is entry point for test case.
#
SRCS = \
	$(RTOS_SOURCE_DIR)/event_groups.c \
	$(RTOS_SOURCE_DIR)/list.c \
	$(RTOS_SOURCE_DIR)/queue.c \
	$(RTOS_SOURCE_DIR)/stream_buffer.c \
	$(RTOS_SOURCE_DIR)/tasks.c \
	$(RTOS_SOURCE_DIR)/timers.c \
	$(RTOS_SOURCE_DIR)/portable/MemMang/heap_5.c \
	$(RTOS_SOURCE_DIR)/portable/GCC/RISC-V/port.c \
	$(wildcard *.c) \
	$(wildcard $(RTOS_HAL_DIR)/*.c) \
	$(wildcard $(SIM_ENV_DIR)/*.c) \
	$(wildcard $(DRIVER_DIR)/*.c) \
	$(wildcard $(INIT_DIR)/*.c) \
	$(wildcard $(LIB_DIR)/*.c) \
	$(wildcard $(LOG_DIR)/*.c) \
	$(PRJ_ROOT)/main.c # Simulation Entry point.

SRCS_CPP = \
	$(wildcard $(FX3_DIR)/src/*.cpp) \

ASMS = \
	rvc0_start.S \
	$(RTOS_SOURCE_DIR)/portable/GCC/RISC-V/portASM.S

OBJS = $(SRCS:%.c=$(BUILD_DIR)/%.o) $(SRCS_CPP:%.cpp=$(BUILD_DIR)/%.o) $(ASMS:%.S=$(BUILD_DIR)/%.o)


# Building Part.
# Compile each .c or .cpp or .S code and generate object file,
# And linking them by link_script.lds generate target file.
# Also convert target file to different format.
$(BUILD_DIR)/RTOSDemo$(XLEN): $(OBJS) link_script.lds Makefile
	$(CC) $(LDFLAGS) $(OBJS) -T link_script.lds -o $@
	$(OBJDUMP) -h -x -d -S $(BUILD_DIR)/RTOSDemo$(XLEN) > $(BUILD_DIR)/RTOSDemo$(XLEN).dump
	$(OBJCOPY) -O binary $(BUILD_DIR)/RTOSDemo$(XLEN) $(BUILD_DIR)/RTOSDemo$(XLEN).bin
	$(TOOLS_DIR)/run64.sh $(BUILD_DIR)/RTOSDemo$(XLEN) $(TOOLS_DIR)
	$(TOOLS_DIR)/run32.sh $(BUILD_DIR)/RTOSDemo$(XLEN) $(TOOLS_DIR)
	cp $(BUILD_DIR)/RTOSDemo$(XLEN)_32.dat $(PRJ_ROOT)/bin_32.dat
	cp $(BUILD_DIR)/RTOSDemo$(XLEN)_64.dat $(PRJ_ROOT)/bin_64.dat
	cp $(BUILD_DIR)/RTOSDemo$(XLEN).dump $(PRJ_ROOT)/bin.dump
	@echo "----- BUILD RTOS DONE -----"

# For compile CPP code
$(BUILD_DIR)/%.o: %.cpp Makefile
	@mkdir -p $(@D)
	$(CPP) $(CPPFLAGS) $(CFLAGS) -MMD -MP -c $< -o $@

# For compile C code
$(BUILD_DIR)/%.o: %.c Makefile
	@mkdir -p $(@D)
	$(CC) $(CPPFLAGS) $(CFLAGS) -MMD -MP -c $< -o $@

# For compile ASM code
$(BUILD_DIR)/%.o: %.S Makefile
	@mkdir -p $(@D)
	$(CC) $(CPPFLAGS) $(ASFLAGS) -MMD -MP -c $< -o $@
```