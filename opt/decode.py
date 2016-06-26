#!/usr/bin/env python

from serial import *
import binascii
import struct
import sys

if __name__ ==  '__main__':
    ser = Serial(
        port=sys.argv[1],
        baudrate=9600,
        bytesize=EIGHTBITS,
        parity=PARITY_NONE,
        stopbits=STOPBITS_ONE,
        timeout=0.1,
        xonxoff=0,
        rtscts=0,
        interCharTimeout=None
    )
    
    ser.isOpen()
    
    ser.write('!')  # get it to print stuff
    
    print "Now reading..."

    state = "waiting"
    waitBuf = ""
    bom = None
    proto_version = None
    message_flags = None
    message_ident = None

    while True:
        while ser.inWaiting() > 0:
            if state == "waiting":
                waitBuf += ser.read(1)
                if len(waitBuf) == 5:
                    waitBuf = waitBuf[1:]

                if waitBuf == chr(0x5A) + chr(0x4E) + chr(0x5C) + chr(0x1C):
                    state = "reading"
                    waitBuf = ""
            elif state == "reading":
                bomData = ser.read(1)
                if ord(bomData[0]) == 0xFF:
                    bom = "big"
                else:
                    bom = "little"

                verFlags = ord(ser.read(1))
                proto_version = verFlags and 0xF
                message_flags = verFlags >> 4

                message_ident = ord(ser.read(1))
                channel = ord(ser.read(1))

                # TODO: lookup here!

                fmt = ("<" if bom == "little" else ">") + "LHBdfdLh"

                msgLen = struct.calcsize(fmt)

                message = struct.unpack(fmt, ser.read(msgLen))

                print("MESSAGE [endian = {0}] [proto = {1}] [flags = {2}] [channel = {3}] [message = {4}]".format(bom, proto_version, message_flags, channel, message_ident))
                print(message)

                state = "waiting"