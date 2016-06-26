import esp8266 as mcu

import macros

# TODO: compile-time macro to determine size of objects (doesn't need to be compile time, just asserts?)
# TODO: make pack function support nested types (done?)
# TODO: make pack function support unions (it handles variants, good enough!)



proc packedSize[T](data: var T): int =
    var size: int = 0

    for value in data.fields:
        when value is object:
            size += packedSize(value)
        elif value is enum:
            size += 1
        else:
            size += sizeof(value)

    return size


# TODO: make this safe


proc pack[T](data: var T; offset: int; buf: var openArray[byte]): int {. section: ROM .} =
    var pos: int = 0

    for value in data.fields:
        when value is object:
            pos += pack(value, offset + pos, buf)
        elif value is enum:
            var val: byte = byte(value)

            copyMem(addr(buf[pos + offset]), addr(val), sizeof(val))
            pos += sizeof(val)
        else:
            copyMem(addr(buf[pos + offset]), addr(value), sizeof(value))
            pos += sizeof(value)

    return pos


proc unpack[T](data: var T; offset: int; buf: var openArray[byte]): int {. section: ROM .} =
    var pos: int = 0
    
    for value in data.fields:
        when value is object:
            pos += unpack(value, offset + pos, buf)
        elif value is enum:
            var val: byte

            copyMem(addr(val), addr(buf[pos + offset]), sizeof(val))
            value = val # TODO!!

            pos += sizeof(val)
        else:
            copyMem(addr(value), addr(buf[pos + offset]), sizeof(value))
            pos += sizeof(value)

    return pos





const
    VER : byte = 0x01
    BOM : uint16 = 0xFF00











type
    MessageFlag = enum
        Dummy = 1 shl 0


# TODO: make this safe to overflows?


proc encode[T](message: var T; dest: var openArray[byte]; channel: byte; flags: set[MessageFlag] = {}): int =
    var bom : uint16 = BOM

    if packedSize(message) == 0:
        return 0

    copyMem(addr(dest[0]), addr(bom), sizeof(bom))

    dest[1] = VER or (cast[byte](flags) shl 4)
    dest[2] = message.ident
    dest[3] = channel

    return 4 + pack(message, 4, dest)




proc header(data: var openArray[byte]): tuple[channel: byte; ident: byte; flags: set[MessageFlag]; valid: bool] =
    if data[0] != 0x00:
        return (channel: 0'u8, ident: 0'u8, flags: {}, valid: false)

    let protocol_ver : byte = data[1] and 0xF
    let flags : set[MessageFlag] = cast[set[MessageFlag]](data[1] shr 4)

    if protocol_ver != VER:
        return (channel: 0'u8, ident: 0'u8, flags: {}, valid: false)

    return (channel: data[3], ident: data[2], flags: flags, valid: true)



proc decode[T](data: var openArray[byte]; dest: var T) =
    discard unpack(dest, 4, data)








export encode, header, decode, MessageFlag