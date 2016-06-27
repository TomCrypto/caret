import esp8266 as mcu

import macros



# Possible extensions to the communication protocol:
#
# MessageFlag.HasTime flag: if set, the first four bytes of the message represent the time the message
#                           was sent from the microcontroller, in seconds since 2016
#                           (this should not be set when sending messages to the microcontroller, it doesn't care)
#
# MessageFlag.Auth flag: if set, the last eight bytes of the message are a fingerprint of the entire packet
#                        with the microcontroller's embedded key
#                        (this should be set probably for all transport modes except satellite, which we trust)
#
# also need some kind of ID to prevent accidental or malicious replay too


# TODO: make this into a compile-time macro (but this is probably constexpr to the compiler anyway)

proc packedSize*[T](data: T): int =
    var size: int = 0

    for value in data.fields:
        when value is object:
            size += packedSize(value)
        else:
            size += sizeof(value)

    return size

# TODO: make this safe


proc pack[T](data: T; offset: int; buf: var openArray[byte]): int {. section: ROM .} =
    var pos: int = 0

    for value in data.fields:
        when value is object:
            pos += pack(value, offset + pos, buf)
        else:
            var val = value  # make a value copy (if necessary only)
            copyMem(addr(buf[pos + offset]), addr(val), sizeof(value))
            pos += sizeof(value)

    return pos


proc unpack[T](data: var T; offset: int; buf: var openArray[byte]): int {. section: ROM .} =
    var pos: int = 0
    
    for value in data.fields:
        when value is object:
            pos += unpack(value, offset + pos, buf)
        else:
            copyMem(addr(value), addr(buf[pos + offset]), sizeof(value))
            pos += sizeof(value)

    return pos





const
    VER : byte = 0x01
    BOM : uint16 = 0xFF00











type
    Transport = enum
        WiFi      = 0x00
        GPRS      = 0x01
        Satellite = 0x02
        Radio     = 0x03

    MessageFlag = enum
        Emergency = 1 shl 0
        Reserved1 = 1 shl 1
        Reserved2 = 1 shl 2
        Reserved3 = 1 shl 3


# TODO: make this safe to overflows?


proc encode[T](message: T; dest: var openArray[byte]; channel: byte; transport: Transport; flags: set[MessageFlag] = {}): int =
    var bom : uint16 = BOM

    if packedSize(message) == 0:
        return 0

    copyMem(addr(dest[0]), addr(bom), sizeof(bom))

    dest[1] = VER or (cast[byte](transport) shl 2) or (cast[byte](flags) shl 4)
    dest[2] = message.ident # TODO: use macro magic to look up an enum here instead?
    dest[3] = channel

    return 4 + pack(message, 4, dest)




proc header(data: var openArray[byte]): tuple[channel: byte; ident: byte; flags: set[MessageFlag]; valid: bool] =
    if data[0] != 0x00:
        return (channel: 0'u8, ident: 0'u8, flags: {}, valid: false)

    let protocol_ver : byte = data[1] and 0x3
    let transport : byte = (data[1] shr 2) and 0x3
    # TODO: check/return transport?
    let flags : set[MessageFlag] = cast[set[MessageFlag]](data[1] shr 4)

    if protocol_ver != VER:
        return (channel: 0'u8, ident: 0'u8, flags: {}, valid: false)

    return (channel: data[3], ident: data[2], flags: flags, valid: true)



proc decode[T](data: var openArray[byte]; dest: var T) =
    discard unpack(dest, 4, data)








export pack, unpack, encode, header, decode, Transport, MessageFlag