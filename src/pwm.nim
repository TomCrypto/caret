import esp8266

import macros


const
    MaxChannels = 8

proc pwm_init*(period: uint32; duty: ptr uint32; channels: uint32; pins: ptr uint32) {. importc .}

proc pwm_start*() {. importc .}

proc pwm_set_duty*(duty: uint32; channel: uint8) {. importc .}

proc pwm_get_duty(channel: uint8): uint32 {. importc .}

proc pwm_set_period(period: uint32) {. importc .}

proc pwm_get_period(): uint32 {. importc .}



