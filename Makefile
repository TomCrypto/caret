SOURCES = src/main.nim $(shell find src/ -name '*.nim' -a ! -name 'main.nim')

default: bin/image.elf

bin/image.elf: $(SOURCES)
	nim c --path:src --gc:none -d:release --cpu:xtensa --os:standalone --noMain --nimcache:obj --out:$@ $<

bin/0x00000.bin bin/0x40000.bin: bin/image.elf
	esptool.py elf2image -o bin/ $<

.PHONY: upload
upload: bin/0x00000.bin bin/0x40000.bin
	esptool.py --port /dev/ttyUSB0 write_flash 0x00000 bin/0x00000.bin 0x40000 bin/0x40000.bin

.PHONY: clean
clean:
	rm -rf obj/* bin/*
