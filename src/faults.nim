import esp8266 as mcu

import settings

import macros


const
    StackTraceLength = 6


type
    Faultable*[T] = object
        case failed: bool
            of true: result: T
            of false: nil

    StackTrace = object
        file*: array[StackTraceLength, uint16]
        line*: array[StackTraceLength, uint16]
        code*: array[StackTraceLength, uint16]
        deep*: uint8

    Fault* = enum
        ExampleFault = 0x00


var
    trace : StackTrace


template failure*[T](flt: Fault): Faultable[T] =
    const ctx = instantiationInfo()  # filename & line
    let index = min(int(trace.deep), len(trace.code))
    trace.file[index] = fileID(ctx.filename)
    trace.line[index] = uint16(ctx.line)
    trace.code[index] = uint16(flt)
    trace.deep += 1

    Faultable[T](failed: true)


template success*[T](value: T): Faultable[T] =
    when value is void:
        Faultable[T](failed: false)
    else:
        Faultable[T](failed: false, result: value)


proc stackTrace*[T](src: Faultable[T]): StackTrace =
    var copy = trace
    trace.deep = 0
    return copy


proc `?`*[T](obj: Faultable[T]): bool =
    return not obj.failed


proc `^`*[T](obj: Faultable[T]): T =
    return obj.result






export settings