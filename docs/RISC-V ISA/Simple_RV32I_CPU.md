## Brief

使用 Verilog 搭配 [Icarus Verilog](https://steveicarus.github.io/iverilog/) Compiler 實作 RV32I Five pipeline CPU。

## 架構圖

這邊使用 5 stage的架構實現。 (應該把branch留到第三個stage)

![](https://i.imgur.com/UByyoes.jpg)

## Code
**My github:** [**click here**](https://github.com/Falcons0214/risc-v-implement)

## 各IC與對應圖

### PC

![](https://i.imgur.com/sBJUvR4.jpg)


### Instruction Cache

![](https://i.imgur.com/FWc7x1b.jpg)


### IF_ID buffer

![](https://i.imgur.com/45cDm1s.jpg)

### Decoder

![](https://i.imgur.com/IdcoZ4F.jpg)


### Control Unit (In the same file with deocder)

![](https://i.imgur.com/dxuXmjb.jpg)

### Branch Unit

![](https://i.imgur.com/ihmgcdD.jpg)

### Register File

![](https://i.imgur.com/q9S7tZx.jpg)


### DEC_ALU buffer

![](https://i.imgur.com/HHOfhGg.jpg)

### ALU

![](https://i.imgur.com/XJSh45k.jpg)

### ALU_MEM

![](https://i.imgur.com/aBYrAEQ.jpg)

### Data Cache

![](https://i.imgur.com/qBn3t9J.jpg)

### MEM_WB buffer

![](https://i.imgur.com/hkFp40H.jpg)

### Hazard detect Unit

#### Lock Unit

![](https://i.imgur.com/UxT1ztl.jpg)

#### Forwarding Unit (stage 3)

![](https://i.imgur.com/vy6azNT.jpg)

#### Forwarding Unit (stage 2)

![](https://i.imgur.com/xWjSZET.jpg)

# 指令測試

這邊沒有特別處理**control hazard**的問題一率採用**stall**，**BHT (Branch history table)** 沒時間做。

## 目前支援的指令

### R_Type_Store Word

![](https://i.imgur.com/obgQdkR.jpg)


### I_Type_Load Word

![](https://i.imgur.com/KnT4OBp.jpg)


### R_Type_Branch (condition branch)

![](https://i.imgur.com/BhEqzA4.jpg)

### J_Type_Jump (unCondition branch)

![](https://i.imgur.com/UVaJSc2.jpg)


### I_Type_Computation

![](https://i.imgur.com/KivMBN2.jpg)

### R_Type_Computation

![](https://i.imgur.com/oQZVJVm.jpg)

## 測試 (直接透過verilog中提供的function將二進位檔案讀入)

```verilog=
$readmemb("./data3", ram1.ram);
$readmemb("./data2", regF1.regs);
$readmemb("./data", rom1.rom);
```
data為instruction cache中的測試資料已二進位格式讀入。
data2為register file中的測試資料已二進位格式讀入。
data3為data cache中的測試資料已二進位格式讀入。

以下指令測試，均由上述檔案讀入指令後進行運算，並透過verilog中提供的 **$moniter**將經過運算後的儲存單元列印在終端中觀察。

----

### SW & LW

這邊將SW以及LW合併再一起測試。

**Instruction cache中的指令**

![](https://i.imgur.com/VeaJjao.jpg)

**Register file中的資料 (這邊的17行是16，因為要從0開始)**
![](https://i.imgur.com/vPoOPRx.jpg)


* 第一行為**LW**，將資料從data cache的第十六個位置讀出，讀出後將其放入register file中的第19個位置。

* 第二行為**SW**，將資料從register file中的第19個位置取出，取出後搬運至data cache中的第0個位置。

**下圖為data cache更改前的值**
![](https://i.imgur.com/T0aMEim.jpg)

**下圖為更改後**
![](https://i.imgur.com/DULWM8l.jpg)

會將SW & LW放在一起測試，是為了順便測試 SW以及LW中產生的**data hazard**，原本在先執行LW後接著執行SW會發生**data hazard**，因為SW的資料會是**舊**的資料，所以我**在lock unit中去檢查不同stage的opcode**，只要發生先LW後SW的情況就產生對應的控制訊號線，再從MEM_WB將要寫回register file中的data接回data cache，透過lock unit產生的控制訊號來選擇要寫入的值。

----

### ADD & SUB & XOR & OR & AND

**Instruction cache中的指令**

![](https://i.imgur.com/VJh5xVq.jpg)

**Register file中的資料 (這邊的16行是15，因為要從0開始)**
![](https://i.imgur.com/MnXbvzS.jpg)


* 第一行為ADD，將兩筆數值**reg[10000]** 以及**reg[10001]** 相加後存入**reg[01111]**。

* 第二行為SUB，將兩筆數值**reg[10001]** 以及**reg[01111]** 相加後存入**reg[01111]**。

* 第三行為XOR，將兩筆數值**reg[01111]** 以及**reg[01111]** 做互斥或後存入**reg[01111]**。

* 第四行為OR，將兩筆數值**reg[10000]** 以及**reg[10001]** 做或後存入**reg[01111]**。

* 第五行為AND，將兩筆數值**reg[01111]** 以及**reg[10110]** 做AND存入**reg[01111]**。

在reg[01111]中的值依序為**32'b00** -> **32'b11** -> **32'b01** -> **32'b00** -> **32'b11** -> **32'b11**

**一開始的值**
![](https://i.imgur.com/ArIwIxU.jpg)

**ADD**
![](https://i.imgur.com/XTtFn9v.jpg)

**SUB**
![](https://i.imgur.com/aysqCCE.jpg)

**XOR**
![](https://i.imgur.com/tN8ljC3.jpg)

**OR**
![](https://i.imgur.com/y2xhxXP.jpg)

**AND**
![](https://i.imgur.com/pyz1xmH.jpg)

這邊也順帶測試了**Forwarding Unit**是否能正常運作，去處理data hazard的問題，因為第一個指令會將結果寫進**reg[01111]**，但是要到第五個stage才會寫回，所以如果這邊沒有**Forwarding Unit**的話另一個處置方式就是**lock著buffer**等待資料寫回，但這樣太沒效率，所以透過**Forwarding Unit**讓指令能不需要等待。

這邊的**Forwarding Unit**比對的兩個位址分別是**ALU_MEM** & **MEM_WB**後的**write back addr**如果跟運算使用到的位址相同，會先以**ALU_MEM stage**的位址選擇再來才是**MEM_WB stage**，因為在pipline中越靠前的stage表示越新的狀態。

----

### ADDI & SLTIU(SLTU) & ORI & SLTI*(SLT) & XORI & ANDI

**Instruction cache中的指令**

![](https://i.imgur.com/TixAs8W.jpg)


**Register file中的資料 (這邊的12行是11，因為要從0開始)**
![](https://i.imgur.com/VWsdudw.jpg)

* 第一行為ADDI，將**立即值(000000111110)** 與**reg[01011]** 相加後放入**reg[01100]**。

* 第二行為SLTIU **(無號)**，比對**reg[01100]** 是否小於**立即值(000100000000)**，如果小於則將**reg[01100]** 設置為32'b1否則不做任何事。

* 第三行為ORI，將**reg[01100]** 與**立即值(100000000010)** 做**OR**後放入**reg[01100]**。

* 第四行為SLTI **(有號)**，比對**reg[01100]** 是否小於**立即值(100000000001)**，如果小於則將**reg[01100]** 設置為32'b1否則不做任何事。

* 第五行為XORI，將**reg[01100]** 與**立即值(000000001110)** 做**XOR**後放入**reg[01100]**。

* 第六行為ANDI，將**reg[01100]** 與**立即值(000000111100)** 做**AND**後放入**reg[01100]**。

**初始值**
![](https://i.imgur.com/JcyrEJ6.jpg)

**ADDI**
![](https://i.imgur.com/4rglSs5.jpg)

**SLTIU**
![](https://i.imgur.com/PulStFN.jpg)

**ORI**
![](https://i.imgur.com/ocLPqcX.jpg)

**SLTI**
![](https://i.imgur.com/B2drZe5.jpg)

**XORI**
![](https://i.imgur.com/XGZ4moO.jpg)

**ANDI**
![](https://i.imgur.com/cJ8DM5m.jpg)

這裡的六種指令都對單一暫存器單元進行運算，也順帶測試**Forwarding Unit**是否正常運作。

因為**ALU**運算單元內只有單純的**dataSource1**與**dataSource2**，透過**ALUop[4]**來決定進入**dataSource2**的資料是**rs2**還是**立即值**，所以相同模式的指令，例如**ADD**與**ADDI**，只要某一個測試通過另一個也能保證順利執行。

----

### BEQ & BNE & SLLI(SLL) & SRLI(SRL) 

問題!! verilog === and s1 ^ s2

**Instruction cache中的指令**

![](https://i.imgur.com/lZnVMrI.jpg)

* 第一行為**SLLI**，將**reg[10101] (22)**左移4bits後，存入**reg[11000] (25)**。
* 第二行為**SRLI**，將**reg[10111] (24)**右移4bits後，存入**reg[11001] (26)**。
* 第三行為**BEQ**，比對**reg[11001]**與**reg[11000]**是否相等，如果相等則**PC += 4+imm(000000001110 * 2)**，否則**PC += 4**，也就是如果相等會繼續從第四行指令執行下去，不相等則跳至第十行指令。

**Register file中的資料 (這邊的22行是21，因為要從0開始)**
![](https://i.imgur.com/3uF4sXI.jpg)


**Time 30, deocde讀到BNE指令**
![](https://i.imgur.com/lZHlouU.jpg)

有點複雜所以請先看下面兩張圖

![](https://i.imgur.com/hkpSZ06.jpg)
上圖是在Time 30時從data cache讀出的BEQ指令，還未進行解碼。

![](https://i.imgur.com/MbHw6Sj.jpg)

在Time 35時抓入BEQ的下一個指令，而這時BEQ則在下一個stage進行解碼，這時因為BEQ比較的兩個值分別為BEQ的前兩個指令（上圖的SLLI以及SRLI），這時因為SRLI就算做了**Forwarding** 也沒辦法在不**stall**的情況下完成，所以**lock unit**會去檢查，如果發生**hazard**就產生訊號去**Freeze PC & IF_ID & DEC_ALU**。

如果Branch指令比較的暫存器單元位址與前面指令寫回的位址相同就會產生一個**stall**讓**ALU**有時間將正確的值運算完。

這時，如果BEQ條件成立代表要進行**branch**，所以**branch unit**會發送一個訊號回**instruction cache**將剛剛誤抓的**指令（time 35 pcAddr = 1100）** 覆蓋掉，所以在time 45時會看到romdataout為0。

**Time 55 成功跳至目標位址繼續執行**
![](https://i.imgur.com/HcD5dtx.jpg)

----

### LW & ADD

**Instruction cache中的指令**

![](https://i.imgur.com/tpNjFvV.jpg)

**data cache中的資料**

![](https://i.imgur.com/Ttssbim.jpg)

* 第一行為**LW**，將資料從**data cache[00011]**讀出後，放到**reg[00101]**。

* 第二行為**ADD**，將**reg[00101] 與 reg[00111]** 相加後，放到**reg[00100]**。

**Register file中的資料**

![](https://i.imgur.com/2IVI5Qr.jpg)

上圖**5**為**ADD**運算完後結果的目的地，而**6**則是**LW**將資料從**data cache**搬過來的目的地。

![](https://i.imgur.com/0jJaHKO.jpg)

上圖為**lock unit**偵測到**ADD**使用的兩個資料有位址與**LW**的目的地相同，所以送出lock將**DEC_ALU & IF_ID & PC**這三個buffer先凍結，等到**LW**將正確的資料讀出後再繼續進行。

![](https://i.imgur.com/eQO6Cbu.jpg)

結果正確，如果沒有透過**lock unit**檢查，則ADD指令相加的資料就會是舊的資料，造成錯誤。
這邊比較麻煩的地方是因為**Forwarding Unit**，在選擇資料時的優先順序是**先ALU_MEM再MEM_WB**，因為正常的情況在**pipeline中越靠前的指令代表越新的狀態**，但是在**LW**這個指令卻要優先選擇**MEM_WB**的資料，因為前面的會是一個中途加入的空指令，為了等待資料從記憶體讀出來，所以正確的資料會在**MEM_WB**中。

![](https://i.imgur.com/QTAevqk.jpg)

透過**lock unit**產生相應的控制訊號送至**IF_ID**之後隨著**pipeline**前進後，進入**Forwarding unit**來決定要選擇哪一比資料。

----

### LW & Branch

**Instruction cache中的指令**

![](https://i.imgur.com/1yfkAEC.jpg)

* 第一行為**LW**，將資料從**data cache[10010]**複製至**reg[11010]**

* 第二行為**BNE**，比對**reg[11010] 與 reg[11011]**，如果不同就跳至**PC + 4 + 20(圖中的第8行)** 執行。

**data cache中的資料**

![](https://i.imgur.com/WjalLLv.jpg)

**Register file中的資料**

![](https://i.imgur.com/zOUapOe.jpg)

觀察上圖可以發現在**LW**還未將資料載入至**reg[11010] (圖中第27行)**，這時資料的值不相同，所以如果在**LW**還未將資料從**data cache**複製過來時，就進行**BNE**就會發生錯誤，因為這時候的值還不是最新的。

因為我將**Branch**系列的指令提早到**stage 2**處理，所以這邊至少需要**stall 兩個clock**，因為資料最快也要等待**stage 4**結束後才會從**data cache**讀出，所以只能等待。

![](https://i.imgur.com/1i7wF2W.jpg)


我有試過將資料一從**data cache**出來時，就透過**Forward**的方式送至**branch unit**，但是這樣必須透過**拉長單一clock的時間**才能完成，但是在衡量下後認為**stall兩個clock會比拉長單一clock時間更有效率**，所以採用**stall兩個clock**。

![](https://i.imgur.com/dC2MqTk.jpg)
這邊資料剛從**inst cache**讀出進入IF_ID。

![](https://i.imgur.com/rwRY1IL.jpg)
**lock unit**發現**hazard**，所以**stall兩個clock等待資料出來**

![](https://i.imgur.com/FuK2uUk.jpg)
比對後發現不符合**BNE**條件，所以繼續從被凍結的**PC**開始執行

如果將資料換成不一樣
![](https://i.imgur.com/9kEGbQR.jpg)

符合**BNE**條件，所以洗掉上一個誤抓的指令，跳轉至目標指令繼續執行

這邊也會遇到類似**LW & ADD**的問題，處理方也差不多。
![](https://i.imgur.com/13aaSt5.jpg)

----

### BLT & BGE & BLTU & BGEU & SRAI & SRA & JAL

待測試


## 自動化測試 (using risc-v toolchain & makefile)

先從**github**上將**risc-v toolchain**的原始碼複製一份下來，然後編譯以及設定一些相關參數。

然後就會得到可以支援**risc-v**的各式工具。

![](https://i.imgur.com/2gjOe20.jpg)

這邊主要使用**riscv64-unknow** 編譯錯誤 應該編譯32bits 版本待修改~

修改中...

