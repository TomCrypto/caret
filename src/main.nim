# Main logic module

import esp8266 as mcu

import macros

import gpio

type
    TTestStruct2 = object
        z: uint32
        sz: int16

    TTestStruct = object
        x: uint32
        y: uint16
        nested: TTestStruct2


# NODE.getType.repr => gives you the name of the type (or even the type?)

# TODO: compile-time macro to determine size of objects (doesn't need to be compile time, just asserts?)
# TODO: make pack function support nested types (done?)
# TODO: make pack function support unions (not needed?)


#proc pack[T](data: var T, buf: var array[fsize(data), byte]) =
proc pack[T](data: var T; offset: int; buf: var openArray[byte]): int {. section: ROM .} =
    when data is not object:
        copyMem(addr(buf[offset]), addr(data), sizeof(data))
        return sizeof(data)
    else:
        var written: int = 0

        for value in data.fields:
            written += pack(value, offset + written, buf)

        return written


    # VARIANT which doesn't allow proc(non-object)
    # (this one also generates less functions?)

    #var pos: int = 0

    #for value in data.fields:
    #    when value is object:
    #        pos += pack(value, offset + pos, buf)
    #    else:
    #        copyMem(addr(buf[pos + offset]), addr(value), sizeof(value))
    #        pos += sizeof(value)

    #return pos







# quick and hackish port of the "Blinky" example from the ESP8266 SDK

type
  ETSHandle* = uint32
  ETSTimerFunc* = proc (timer_arg: pointer)
  ETSTimer* = object
    timer_next*: ref ETSTimer
    timer_expire*: uint32
    timer_period*: uint32
    timer_func*: ptr ETSTimerFunc
    timer_arg*: pointer


proc os_timer_disarm(timer: pointer) {.importc: "ets_timer_disarm", header: "<ets_sys.h>".}

proc os_timer_setfn(timer: pointer; fn: ETSTimerFunc; x: pointer) {.importc: "ets_timer_setfn", header: "<ets_sys.h>".}

proc os_timer_arm(timer: pointer; a, b, x: int) {.importc: "ets_timer_arm_new", header: "<ets_sys.h>".}

proc os_delay_us(n: int) {.importc: "ets_delay_us", header: "<osapi.h>".}


proc uart_init(x, y: int) {. importc: "uart_init" .}

proc uart0_tx_buffer(data: pointer; len: uint16) {. importc: "uart0_tx_buffer" .}


type
  ETSSignal* = uint32
  ETSParam* = uint32
  ETSEvent* = ETSEventTag
  ETSEventTag* = object
    sig*: ETSSignal
    par*: ETSParam

  ETSTask* = proc (e: ptr ETSEvent)


proc system_os_task(task: pointer; prio: uint8; queue: pointer; qlen: uint8) {.importc: "system_os_task", header: "<user_interface.h>".}



var event : ETSEvent

var count {.volatile.} : int = 0

var timer {.volatile.} : ETSTimer

proc timer_func(timer_arg: pointer) {. section: ROM, exportc: "timer_func".} =
    if count mod 2 == 0:
        gpio.set(1 shl 2, 0, 1 shl 2, 0)
    else:
        gpio.set(0, 1 shl 2, 1 shl 2, 0)

    count += 1

proc user_procTask(events: pointer) {. section: ROM, exportc: "user_procTask".} =
    var x: TTestStruct
    var buf: array[12,byte]

    x.x = 1943754307
    x.y = 64612
    x.nested.z = 123

    x.nested.sz = cast[int16](pack(x, 0, buf))
    discard pack(x, 0, buf)

    uart0_tx_buffer(addr(buf), 12)

    os_delay_us(1000 * 100)


proc main() {. section: ROM .} =
    uart_init(9600, 9600)

    gpio.init()

    gpio.func_select(0x60000800 + 0x38, 0)

    gpio.set(1 shl 2, 0, 1 shl 2, 0)

    os_timer_disarm(addr(timer))

    os_timer_setfn(addr(timer), timer_func, nil)

    os_timer_arm(addr(timer), 100, 1, 1)

    system_os_task(user_procTask, 0, addr(event), 1)



# TODO: remove below eventually

proc NimMain() {.importc.}

proc sdkMain() {. section: ROM, exportc: "user_init" .} =
    NimMain()
    main()

proc unused() {. section: ROM, exportc: "user_rf_pre_init" .} =
    discard