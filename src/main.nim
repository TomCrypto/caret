# Main logic module

import esp8266 as mcu

import macros
import typeinfo

import faults

import communications as com

import gpio
import wifi

type
    TTestStruct2 = object
        z: uint32
        sz: int16

    TTestStruct = object
        x: uint32
        y: uint16
        num: float32
        num2: float64
        nested: TTestStruct2



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


proc system_os_task*(task: pointer; prio: uint8; queue: pointer; qlen: uint8) {.importc: "system_os_task".}
proc system_os_post*(prio: uint8; signal: uint32; param: uint32) {.importc: "system_os_post".}


var event : ETSEvent

var count {.volatile.} : int = 0

var timer {.volatile.} : ETSTimer

proc timer_func(timer_arg: pointer) {. section: ROM, exportc: "timer_func".} =
    #if count mod 2 == 0:
    #    gpio.set(1 shl 2, 0, 1 shl 2, 0)
    #else:
    #    gpio.set(0, 1 shl 2, 1 shl 2, 0)

    count += 1




proc wifi_station_get_connect_status(): uint8 {.importc.}


var num: int = 1




type
    Maybe[T] = object
        case has: bool
            of true: value: T
            of false: nil




proc doRiskyOperation(x: int): Faultable[int] =
    if x mod 15000 == 0:
        return failure[int](ExampleFault)
    else:
        return success[int](x)




proc user_procTask(events: ptr ETSEvent) {. section: ROM, exportc: "user_procTask".} =
    if num mod 500 == 0:
        var x: TTestStruct
        var buf: array[150,byte]

        x.x = wifi.getIP()
        x.y = if not wifi.received(): 0 else: 11111
        x.num = 4.4521
        x.num2 = -0.25451
        x.nested.z = uint32(count)
        x.nested.sz = int16(packedSize(x))

        let bufLen = encode(x, buf, transport = WiFi, channel = 5)

        # do something that might fail

        let result : Faultable[int] = doRiskyOperation(num)

        if ?result:
            wifi.send(buf, bufLen)
        else:
            #let faultLen = encode(stackTrace(result), buf, transport = Satellite, channel = 0)
            let faultLen = encode(x, buf, transport = Satellite, channel = 0)
            discard stackTrace(result)
            wifi.send(buf, faultLen)
            

    os_delay_us(1000 * 1)
    system_os_post(0, 0, 0)

    num += 1


proc main() {. section: ROM .} =
    uart_init(9600, 9600)

    debug("Hello from ESP8266!!!")

    wifi.start()

    gpio.init()

    #gpio.func_select(0x60000800 + 0x38, 0)

    #gpio.set(1 shl 2, 0, 1 shl 2, 0)

    os_timer_disarm(addr(timer))

    os_timer_setfn(addr(timer), timer_func, nil)

    os_timer_arm(addr(timer), 100, 1, 1)

    system_os_task(user_procTask, 0, addr(event), 1)
    system_os_post(0, 0, 0)



# TODO: remove below eventually

proc NimMain() {.importc.}

proc sdkMain() {. section: ROM, exportc: "user_init" .} =
    NimMain() # is this needed?
    main()

proc unused() {. section: ROM, exportc: "user_rf_pre_init" .} =
    discard