# Module gpio

import esp8266 as mcu

const
    BIT0 = 1
    BIT1 = 2
    BIT2 = 4

proc init() {.importc: "gpio_init", header: "<gpio.h>".}

proc set(set_mask, clear_mask, enable_mask, disable_mask: uint32) {.importc: "gpio_output_set", header: "<gpio.h>".}

proc func_select(pin, fn: uint32) =
    var reg {.volatile.} : ptr uint32 = cast[ptr uint32](pin)

    reg[] = reg[] and (not ( cast[uint32](0x13) shl cast[uint32](4) )) or ((((fn and BIT2) shl cast[uint32](2) ) or (fn and cast[uint32](0x3) )) shl cast[uint32](4) )


export init, set, func_select