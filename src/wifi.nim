# interrupt handler for UART0 receive (for now this will just post a msg when finished)

import esp8266 as mcu

import faults

import settings

type
    StationConfig = object
        ssid: array[32, byte]
        password: array[64, byte]
        bssid_set: byte
        bssid: array[6, byte]


type
    StationStatus = enum
        Idle,
        Connecting,
        WrongPassword,
        NoApFound,
        ConnectFail,
        GotIp

    ESPConnState = enum
        None,
        Wait,
        Listen,
        Connect,
        Write,
        Read,
        Close

    ESPConnType = enum
        Invalid,
        TCP = 0x10,
        UDP = 0x20

    ESPConnTCP = object
        remote_port: int
        local_port: int
        local_ip: array[4,byte]
        remote_ip: array[4,byte]
        connect_cb: pointer#proc(arg: pointer) {.cdecl.}
        reconnect_cb: pointer#proc(arg: pointer, err: int8) {.cdecl.}
        disconnect_cb: pointer#proc(arg: pointer) {.cdecl.}
        write_finish_fn: pointer#proc(arg: pointer) {.cdecl.}

    ESPConnUDP = object
        remote_port: int
        local_port: int
        local_ip: array[4,byte]
        remote_ip: array[4,byte]

    EspConnProto {.union.} = object
        tcp: ptr ESPConnTCP
        udp: ptr ESPConnUDP

    EspConn = object
        ctype: int
        state: int
        proto: EspConnProto
        recv_cb: pointer#proc(arg: pointer; data: pointer; len: uint16) {.cdecl.}
        sent_cb: pointer#proc(arg: pointer) {.cdecl.}
        link_cnt: uint8
        reverse: pointer

    IpInfo = object
        ip: uint32
        netmask: uint32
        gw: uint32

const
    STATION_MODE : byte = 0x01
    STATIONAP_MODE : byte = 0x03
    STATION_IF : byte = 0

proc system_os_post*(prio: uint8; signal: uint32; param: uint32) {.importc: "system_os_post".}

proc wifi_set_opmode(mode: byte): bool {.importc.}
proc wifi_get_ip_info(if_index: byte; info: pointer) {.importc.}

proc wifi_station_set_config(conf: ptr StationConfig) {.importc.}
proc wifi_station_set_config_current(conf: ptr StationConfig): bool {.importc.}

proc wifi_station_connect(): bool {.importc.}
proc wifi_station_disconnect(): bool {.importc.}

proc espconn_create(conn: ptr EspConn) {.importc.}
proc espconn_connect(conn: ptr EspConn) {.importc.}
proc espconn_sent(conn: ptr EspConn; buf: pointer; len: uint16) {.importc.}
proc espconn_port(): uint32 {.importc.}
proc espconn_regist_sentcb(conn: ptr EspConn; sent_cb: pointer) {.importc.}
proc espconn_regist_recvcb(conn: ptr EspConn; recv_cb: pointer) {.importc.}
proc os_delay_us(n: int) {.importc: "ets_delay_us", header: "<osapi.h>".}

proc wifi_station_get_connect_status(): int {.importc.}
proc wifi_station_set_auto_connect(set: byte): bool {. importc .}
proc wifi_station_set_reconnect_policy(set: bool): bool {. importc .}

proc wifi_station_set_hostname(name: cstring): bool {. importc .}

var conf : StationConfig


var conn : EspConn
var udp : ESPConnUDP
var created: bool = false

proc uart0_tx_buffer(data: cstring; len: uint16) {. importc: "uart0_tx_buffer" .}


proc getIP*(): uint32 =
    var info : IpInfo

    wifi_get_ip_info(STATION_IF, addr(info))

    return info.ip


proc getSize(): int =
    {.emit:"""
    return sizeof(`EspConn`);
    """.}


proc sent_cb(arg: pointer) {.exportc, section : ROM.} =
    discard


var recvBuffer* : array[512, byte]
var hasPacket* : bool


proc recv_cb(arg: pointer; data: pointer; len: uint16) {.exportc, section : ROM.} =
    debug("Received packet!")
    copyMem(addr(recvBuffer), data, len);
    hasPacket = true



proc send(buf: var openArray[byte]; length: int) {. section: ROM .} =
    var info : IpInfo

    wifi_get_ip_info(STATION_IF, addr(info))

    if (wifi_station_get_connect_status() == int(GotIp)) and (info.ip != 0):
        if not created:
            conn.ctype = 0x20 # UDP
            conn.state = 0 # None
            conn.proto.udp = addr(udp)

            conn.proto.udp.local_port = 2000
            conn.proto.udp.remote_port = 2000
            conn.proto.udp.remote_ip[0] = 192
            conn.proto.udp.remote_ip[1] = 168
            conn.proto.udp.remote_ip[2] = 100
            conn.proto.udp.remote_ip[3] = 134

            espconn_regist_sentcb(addr(conn), sent_cb)
            espconn_regist_recvcb(addr(conn), recv_cb)

            espconn_create(addr(conn))
            created = true

        espconn_sent(addr(conn), addr(buf), uint16(length))





type
    Configuration* = object
        hostName*: cstring
        ssid*: cstring
        password*: cstring
        case matchBSSID*: bool
            of true: bssid*: array[6,byte]
            of false: nil
        autoConnect*: bool
        reconnect*: bool


var
    initialized: bool = false



proc setup*(config: Configuration): Faultable[void] {. section: ROM .} =
    if initialized:
        raiseAssert("WiFi already set up!")

    if not wifi_set_opmode(STATION_MODE):
        return failure[void](ExampleFault)

    var conf : StationConfig

    copyMem(addr(conf.ssid),config.ssid, config.ssid.len)
    copyMem(addr(conf.password), config.password, config.password.len)

    if config.matchBSSID:
        conf.bssid_set = 1
        conf.bssid = config.bssid

    if config.hostName != nil:
        if not wifi_station_set_hostname(config.hostName):
            return failure[void](ExampleFault)

    if not wifi_station_set_auto_connect(0):
        return failure[void](ExampleFault)  # TODO: do this somewhere else

    if not wifi_station_set_reconnect_policy(config.reconnect):
        return failure[void](ExampleFault)

    if not wifi_station_set_config_current(addr(conf)):
        return failure[void](ExampleFault)

    if config.autoConnect:
        if not wifi_station_connect():
            return failure[void](ExampleFault)

    initialized = true
    return success[void](void)


proc connect*(): Faultable[void] {. section: ROM .} =
    if not initialized:
        raiseAssert("WiFi not set up!")

    if not wifi_station_connect():
        return failure[void](ExampleFault)
    else:
        return success[void](void)


proc disconnect*(): Faultable[void] {. section: ROM .} =
    if not initialized:
        raiseAssert("WiFi not set up!")

    if not wifi_station_disconnect():
        return failure[void](ExampleFault)
    else:
        return success[void](void)




proc status*(): StationStatus {. section: ROM .} =
    return cast[StationStatus](wifi_station_get_connect_status())


proc stop() {. section: ROM .} =
    # put modem to sleep here?
    discard




export send
