#!/usr/bin/env python

from serial import *
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

    while True:
        while ser.inWaiting() > 0:
            # read the first byte to get a version number
            #version = ser.read(1)

            out = struct.unpack('<LHLH', ser.read(12))

            #print ord(version)
            print(out)

    
