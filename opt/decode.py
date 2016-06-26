#!/usr/bin/env python

from serial import *
import binascii
import struct
import sys
import socket

if __name__ ==  '__main__':
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(('0.0.0.0', 2000))

    while True:
        data, _ = sock.recvfrom(256)

        bomData = data[0]

        if ord(bomData) == 0xFF:
            bom = "big"
        else:
            bom = "little"

        verFlags = ord(data[1])
        proto_version = verFlags & 0xF
        message_flags = verFlags >> 4

        message_ident = ord(data[2])
        channel = ord(data[3])

        # TODO: lookup here!

        if message_ident == 2:
            fmt = ("<" if bom == "little" else ">") + "LHBdfdLh"
        elif message_ident == 3:
            fmt = ("<" if bom == "little" else ">") + "L"

        msgLen = struct.calcsize(fmt)

        message = struct.unpack(fmt, data[4:4 + msgLen])

        print("MESSAGE [endian = {0}] [proto = {1}] [flags = {2}] [channel = {3}] [message = {4}]".format(bom, proto_version, message_flags, channel, message_ident))
        print(message)