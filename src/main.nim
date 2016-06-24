import gpio

# quick and hackish port of the "Blinky" example from the ESP8266 SDK

type
  ETSHandle* = uint32
  ETSTimerFunc* = proc (timer_arg: pointer) {.cdecl.}
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


type
  ETSSignal* = uint32
  ETSParam* = uint32
  ETSEvent* = ETSEventTag
  ETSEventTag* = object
    sig*: ETSSignal
    par*: ETSParam

  ETSTask* = proc (e: ptr ETSEvent) {.cdecl.}


proc system_os_task(task: pointer; prio: uint8; queue: pointer; qlen: uint8) {.importc: "system_os_task", header: "<user_interface.h>".}



var event : ETSEvent

var count {.volatile.} : int = 0

var timer {.volatile.} : ETSTimer

proc timer_func(timer_arg: pointer) {.cdecl, exportc: "timer_func".} =
    if count mod 2 == 0:
        gpio.set(1 shl 2, 0, 1 shl 2, 0)
    else:
        gpio.set(0, 1 shl 2, 1 shl 2, 0)

    count += 1


proc user_procTask(events: pointer) {.cdecl, exportc: "user_procTask".} =
    os_delay_us(10)


proc run() =
    gpio.init()

    gpio.func_select(0x60000800 + 0x38, 0)

    gpio.set(0, 1 shl 2, 1 shl 2, 0)

    os_timer_disarm(addr(timer))

    os_timer_setfn(addr(timer), timer_func, nil)

    os_timer_arm(addr(timer), 100, 1, 1)

    system_os_task(user_procTask, 0, addr(event), 1)



# TODO: remove below eventually

proc user_rf_pre_init*() {.exportc: "user_rf_pre_init", codegenDecl: "$# __attribute__((section(\".irom0.text\"))) $#$#".} =
    discard

proc user_init*() {.exportc: "user_init".} =
    run()