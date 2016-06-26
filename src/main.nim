# Main logic module

import esp8266 as mcu

import macros
import typeinfo

import communications as com

import gpio

type
    TTestStruct2 = object
        z: uint32
        sz: int16

    TMyEnum = enum
        a,
        b

    TTestStruct = object
        x: uint32
        y: uint16
        case tag: TMyEnum
            of a: fieldA: float64
            of b: fieldB: uint32  # TODO: for now, same size
        num: float32
        num2: float64
        nested: TTestStruct2


proc ident*(x: var TTestStruct): int =
    2


# TODO: ask about export vs asterisk in IRC
# TODO: work on packing function, size function, unpacking function, and test
# (improve python decode script too?)
# TODO: continue working on GPIO and Serial interfaces
# TODO: investigate why main() is not GC-safe?

# NODE.getType.repr => gives you the name of the type (or even the type?)



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
    var x: TTestStruct = TTestStruct(tag: a, fieldA: 42.11223344)
    var buf: array[150,byte]

    x.x = 1943754307
    x.y = 64612
    x.num = 4.4521
    x.num2 = -0.25451
    x.nested.z = 123
    x.nested.sz = int16(count)

    let bufLen = encode(x, buf, channel = 5)

    # TODO: implement this in serial communication interface?

    var delim : array[4,byte] = [0x5A'u8, 0x4E'u8, 0x5C'u8, 0x1C'u8]

    uart0_tx_buffer(addr(delim), uint16(len(delim)))
    uart0_tx_buffer(addr(buf), uint16(bufLen))

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
    NimMain() # is this needed?
    main()

proc unused() {. section: ROM, exportc: "user_rf_pre_init" .} =
    discard