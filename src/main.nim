import gpio

proc user_rf_pre_init*() {.extern: "user_rf_pre_init".} =
    discard

proc user_init*() {.extern: "user_init".} =
    gpio.init()

    gpio.func_select(0x60000800 + 0x38, 0)

    gpio.set(1 shl 2, 0, 1 shl 2, 0)

    discard


user_init()
user_rf_pre_init()
