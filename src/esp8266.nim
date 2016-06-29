# TODO: section pragma for variables

import macros

const
    ROM = ".irom0.text"


macro section(param: string, body: untyped): stmt =
    let sectionName = strVal(if param.kind == nnkSym: param.symbol.getImpl else: param)
    let codegenAttr = "$# __attribute__((section(\"" & sectionName & "\"))) $#$#"

    let pragma = body.findChild(it.kind == nnkPragma)

    pragma.add(newNimNode(nnkExprColonExpr).add(newIdentNode("codegenDecl"),
                                                newStrLitNode(codegenAttr)))

    return body


proc os_printf(fmt: cstring) {. importc: "os_printf_plus", varargs .}

proc debug(fmt: cstring) =
    os_printf(cstring(fmt))
    os_printf("\x0D\x0A\0")



proc disableInterrupts() {. importc: "ets_intr_lock" .}
proc enableInterrupts() {. importc: "ets_intr_unlock" .}

proc reboot*() {. importc: "system_restart" .}


proc printMemInfo*() {. importc: "system_print_meminfo" .}
proc getVCC*(): uint16 {. importc: "readvdd33" .}

proc updateFrequency*(freq: byte): bool {. importc: "system_update_cpu_freq" .}


proc interrupts(disable: static[bool]) =
    when disable:
        disableInterrupts()
    else:
        enableInterrupts()



proc rawoutput(s: string) {. section: ROM, exportc: "rawoutput" .} =
    debug(s)


proc panic(s: string) {. section: ROM, exportc: "panic" .} =
    debug("\r\n\r\n=== ESP8266 PANIC ===\r\n")
    debug(s)
    debug("\r\n")
    debug("Now rebooting...")

    reboot()







export debug, section, interrupts, ROM