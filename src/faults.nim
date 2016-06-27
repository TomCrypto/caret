import esp8266 as mcu

import settings

import macros

type
    TFaultMsg = object
        file*: array[4, uint8]
        line*: array[4, uint16]
        err*:  array[4, uint16]
        levels*: uint8
        overflow*: uint8

proc ident*(x: TFaultMsg): byte =
    return 4

type
    TFault = enum
        TestFault = 0x00


# /!\ need to sort out strutils issue, or reimplement an allocation-free string library /!\

proc capitalize(c: char): char =
    case c
        of 'a': return 'A'
        of 'b': return 'B'
        of 'c': return 'C'
        of 'd': return 'D'
        of 'e': return 'E'
        of 'f': return 'F'
        of 'g': return 'G'
        of 'h': return 'H'
        of 'i': return 'I'
        of 'j': return 'J'
        of 'k': return 'K'
        of 'l': return 'L'
        of 'm': return 'M'
        of 'n': return 'N'
        of 'o': return 'O'
        of 'p': return 'P'
        of 'q': return 'Q'
        of 'r': return 'R'
        of 's': return 'S'
        of 't': return 'T'
        of 'u': return 'U'
        of 'v': return 'V'
        of 'w': return 'W'
        of 'x': return 'X'
        of 'y': return 'Y'
        of 'z': return 'Z'
        else: return c



# this function might belong in settings.nim?

macro fileID(file: static[string]): uint8 =
    result = newNimNode(nnkCall)
    result.add(newIdentNode("uint8"))

    var name = $parseExpr(file)[0] & "ID"
    name[0] = capitalize(name[0])

    result.add(newDotExpr(newIdentNode("settings"), newIdentNode(name)))


template fault(fault: TFault): expr =
    const ctx = instantiationInfo()

    TFaultMsg(file: [fileID(ctx.filename), 0'u8,  0'u8,  0'u8 ],
              line: [uint16(ctx.line),     0'u16, 0'u16, 0'u16],
              err:  [uint16(fault),        0'u16, 0'u16, 0'u16],
              levels: 1, overflow: 0)


template fault(fault: TFault; rec: var TFaultMsg): expr =
    const ctx = instantiationInfo()

    if rec.levels == uint8(rec.file.len):
        rec.overflow = 1
        rec.levels -= 1

    rec.file[rec.levels] = fileID(ctx.filename)
    rec.line[rec.levels] = uint16(ctx.line)
    rec.err[rec.levels]  = uint16(fault)
    rec.levels += 1

    rec


export TFault, TFaultMsg, fault