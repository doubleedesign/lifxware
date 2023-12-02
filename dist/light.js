"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Light = exports.LightEvents = void 0;
const assert = require("assert");
const eventemitter3_1 = require("eventemitter3");
const colorHSBK_1 = require("./packets/color/colorHSBK");
const colorZone_1 = require("./packets/colorZone/colorZone");
const colorHSBK_2 = require("./packets/color/colorHSBK");
const power_1 = require("./packets/power/power");
const colorInfrared_1 = require("./packets/infrared/colorInfrared");
const packets_1 = require("./packets/packets");
const colorRGBW_1 = require("./packets/colorRGBW/colorRGBW");
const color_1 = require("./lib/color");
const client_1 = require("./client");
const error_1 = require("./lib/error");
const packet_1 = require("./lib/packet");
const lightErrors_1 = require("./errors/lightErrors");
const clientErrors_1 = require("./errors/clientErrors");
var LightEvents;
(function (LightEvents) {
    LightEvents["CONECTIVITY"] = "connectivity";
    LightEvents["LABEL"] = "label";
    LightEvents["COLOR"] = "color";
    LightEvents["STATE"] = "state";
    LightEvents["POWER"] = "power";
})(LightEvents = exports.LightEvents || (exports.LightEvents = {}));
class Light extends eventemitter3_1.EventEmitter {
    constructor(params) {
        super();
        this.id = params.id;
        this.address = params.address;
        this.label = '';
        this.port = params.port;
        this.legacy = params.legacy;
        this._client = params.client;
        this._power = true;
        this._connectivity = true;
        this._color = {
            hue: 0,
            saturation: 0,
            brightness: 0,
            kelvin: 0
        };
        this._discoveryPacketNumber = params.discoveryPacketNumber;
    }
    get connectivity() {
        return this._connectivity;
    }
    set connectivity(newConnectivity) {
        try {
            assert.equal(this._connectivity, newConnectivity);
        }
        catch (e) {
            this._connectivity = newConnectivity;
            this.emit(LightEvents.CONECTIVITY, this._connectivity);
            this.emit(LightEvents.STATE, {
                connectivity: this._connectivity,
                power: this._power,
                color: this._color
            });
        }
    }
    get power() {
        return this._power;
    }
    set power(newPower) {
        try {
            assert.equal(this._power, newPower);
        }
        catch (e) {
            this._power = newPower;
            this.emit(LightEvents.POWER, this._power);
            this.emit(LightEvents.STATE, {
                connectivity: this._connectivity,
                power: this._power,
                color: this._color
            });
        }
    }
    get color() {
        return this._color;
    }
    set color(newColor) {
        try {
            assert.equal(this._color.hue, newColor.hue);
            assert.equal(this._color.saturation, newColor.saturation);
            assert.equal(this._color.brightness, newColor.brightness);
            assert.equal(this._color.kelvin, newColor.kelvin);
        }
        catch (e) {
            this._color = newColor;
            this.emit(LightEvents.COLOR, this._color);
            this.emit(LightEvents.STATE, {
                connectivity: this._connectivity,
                power: this._power,
                color: this._color
            });
        }
    }
    get discoveryPacketNumber() {
        return this._discoveryPacketNumber;
    }
    set discoveryPacketNumber(discoveryPacketNumber) {
        this._discoveryPacketNumber = discoveryPacketNumber;
    }
    setPower(power, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctx = this;
            return new Promise(function (resolve, reject) {
                if (!ctx._connectivity) {
                    return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
                }
                const cmdReq = { power: power ? power_1.POWER_MAXIMUM_RAW : power_1.POWER_MINIMUM_RAW, duration };
                const packetObj = (0, packet_1.createObject)(ctx.legacy ? packets_1.packet.setPowerLegacy.type : packets_1.packet.setPower.type, cmdReq, ctx._client.source, ctx.id);
                ctx._client.send(packetObj, (err, msg, rInfo) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(msg);
                    }
                });
            });
        });
    }
    getColor(cache, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache === true) {
                return resolve(ctx._color);
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getLight.type, {}, ctx._client.source, ctx.id);
            if (ctx.legacy) {
                ctx._client.send(packetObj);
                if (!ctx._color) {
                    return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_MISSING_CACHE).build());
                }
                return resolve(ctx._color);
            }
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateLight.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve((0, colorHSBK_1.packetToNormalisedHSBK)(data.color));
            }, sqnNumber);
        });
    }
    setColor(hue, saturation, brightness, kelvin, duration = 0, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            (0, colorHSBK_1.validateNormalisedColorHSBK)(hue, saturation, brightness, kelvin);
            const normalisedColor = {
                hue,
                saturation,
                brightness,
                kelvin
            };
            const color = (0, colorHSBK_1.normalisedToPacketHBSK)(normalisedColor);
            const cmdReq = { color, duration };
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setColor.type, cmdReq, ctx._client.source, ctx.id);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.send(packetObj, (err, msg, rInfo) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(msg);
            });
        });
    }
    setColorRgb(red, green, blue, duration = 0, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctx = this;
            (0, colorRGBW_1.validateNormalisedColorRgb)(red, green, blue);
            const hsbObj = (0, color_1.rgbToHsb)({ red, green, blue });
            return yield ctx.setColor(hsbObj.hue, hsbObj.saturation, hsbObj.brightness, colorHSBK_1.HSBK_DEFAULT_KELVIN, duration, timeout);
        });
    }
    setColorRgbHex(hexString, duration = 0, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctx = this;
            const rgbObj = (0, color_1.rgbHexStringToObject)(hexString);
            const hsbObj = (0, color_1.rgbToHsb)(rgbObj);
            return yield ctx.setColor(hsbObj.hue, hsbObj.saturation, hsbObj.brightness, colorHSBK_1.HSBK_DEFAULT_KELVIN, duration, timeout);
        });
    }
    getTime(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!this._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getTime.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateTime.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    setTime(time, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const cmdReq = { time };
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setTime.type, cmdReq, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateTime.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                else {
                    clearTimeout(timeoutHandle);
                    return resolve(data);
                }
            }, sqnNumber);
        });
    }
    getState(cache = false, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache === true) {
                return resolve({
                    connectivity: ctx._connectivity,
                    power: ctx._power,
                    color: ctx._color
                });
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getLight.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateLight.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                const PacketColor = (0, colorHSBK_1.packetToNormalisedHSBK)(data.color);
                data.color.hue = PacketColor.hue;
                data.color.saturation = PacketColor.saturation;
                data.color.brightness = PacketColor.brightness;
                ctx._power = data.power === colorHSBK_2.HSBK_MAXIMUM_RAW;
                ctx._color = {
                    hue: data.color.hue,
                    saturation: data.color.saturation,
                    brightness: data.color.brightness,
                    kelvin: data.color.kelvin
                };
                return resolve({
                    connectivity: ctx._connectivity,
                    power: ctx._power,
                    color: ctx._color
                });
            }, sqnNumber);
        });
    }
    getResetSwitchState(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getResetSwitchState.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateResetSwitch.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(!!data.switch);
            }, sqnNumber);
        });
    }
    getInfrared(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getInfrared.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateInfrared.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                const infraredColor = data;
                const irPacket = (0, colorInfrared_1.packetToNormalisedInfrared)(infraredColor);
                data.brightness = irPacket.brightness;
                return resolve(data);
            }, sqnNumber);
        });
    }
    setInfrared(brightness, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            (0, colorInfrared_1.validateNormalisedColorInfrared)(brightness);
            const infraredColor = {
                brightness
            };
            const cmdReq = {
                brightness: (0, colorInfrared_1.normalisedToPacketInfraed)(infraredColor).brightness
            };
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setInfrared.type, cmdReq, ctx._client.source, ctx.id);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.send(packetObj, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                const infraredColor = data;
                const hsbk = (0, colorHSBK_1.packetToNormalisedHSBK)(infraredColor);
                data.brightness = hsbk.brightness;
                return resolve(data);
            });
        });
    }
    getHostInfo(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getHostInfo.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateHostInfo.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    getHostFirmware(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getHostFirmware.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateHostFirmware.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    getHardwareVersion(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getVersion.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateVersion.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve({
                    vendorId: data.vendorId,
                    vendorName: data.vendorName,
                    productId: data.productId,
                    version: data.version
                });
            }, sqnNumber);
        });
    }
    getWifiInfo(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getWifiInfo.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateWifiInfo.name, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }
                    resolve({
                        signal: data.signal,
                        tx: data.tx,
                        rx: data.rx,
                        mcuTemperature: data.mcuTemperature
                    });
                }
            }, sqnNumber);
        });
    }
    getWifiFirmware(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getWifiFirmware.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateWifiFirmware.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve({
                    build: data.build,
                    install: data.install,
                    majorVersion: data.majorVersion,
                    minorVersion: data.minorVersion
                });
            }, sqnNumber);
        });
    }
    getLabel(cache = false, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache === true) {
                if (ctx.label.length > 0) {
                    return resolve(ctx.label);
                }
            }
            const cmdReq = { target: ctx.id };
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getLabel.type, cmdReq, ctx._client.source);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateLabel.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data.label);
            }, sqnNumber);
        });
    }
    setLabel(label, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (Buffer.byteLength(label.label, 'utf8') > 32) {
                return reject(new error_1.ServiceErrorBuilder(clientErrors_1.ER_CLIENT_INVALID_ARGUMENT)
                    .withContextualMessage('LIFX client setLabel method expects a maximum of 32 bytes as label')
                    .build());
            }
            if (label.label.length < 1) {
                return reject(new error_1.ServiceErrorBuilder(clientErrors_1.ER_CLIENT_INVALID_ARGUMENT)
                    .withContextualMessage('LIFX client setLabel method expects a minimum of one char as label')
                    .build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setLabel.type, label, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateLabel.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                else {
                    clearTimeout(timeoutHandle);
                    resolve(data.label);
                }
            }, sqnNumber);
        });
    }
    getGroup(cache = false, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx.connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache === true) {
                if (ctx._group) {
                    return resolve(ctx._group);
                }
            }
            const cmdReq = { target: this.id };
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getGroup.type, cmdReq, ctx._client.source);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateGroup.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve({
                    group: data.group,
                    label: data.label,
                    updatedAt: data.updatedAt
                });
            }, sqnNumber);
        });
    }
    getTags(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (!ctx.legacy) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const cmdReq = { target: ctx.id };
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getTags.type, cmdReq, ctx._client.source);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateTags.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                else {
                    clearTimeout(timeoutHandle);
                    resolve(data.tags);
                }
            }, sqnNumber);
        });
    }
    setTags(tags, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (!ctx.legacy) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setTags.type, tags, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateTags.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                else {
                    clearTimeout(timeoutHandle);
                    return resolve(data.tags);
                }
            }, sqnNumber);
        });
    }
    getTagLabels(tagLabels, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (!ctx.legacy) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getTagLabels.type, tagLabels, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateTagLabels.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                resolve(data.label);
            }, sqnNumber);
        });
    }
    setTagLabels(tagLabels, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (!ctx.legacy) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setTagLabels.type, tagLabels, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateTagLabels.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data.label);
            }, sqnNumber);
        });
    }
    getAmbientLight(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getAmbientLight.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateAmbientLight.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data.flux);
            }, sqnNumber);
        });
    }
    getPower(cache = false, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache) {
                return resolve(ctx._power);
            }
            if (ctx.legacy) {
                const packetObj = (0, packet_1.createObject)(packets_1.packet.getPowerLegacy.type, {}, ctx._client.source, ctx.id);
                this._client.send(packetObj);
                return resolve(ctx._power);
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getPower.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.statePower.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                if (data.power === colorHSBK_2.HSBK_MAXIMUM_RAW) {
                    ctx._power = true;
                    return resolve(true);
                }
                ctx._power = false;
                return resolve(false);
            }, sqnNumber);
        });
    }
    getColorZones(startIndex, endIndex) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            (0, colorZone_1.validateColorZoneIndex)(startIndex);
            (0, colorZone_1.validateColorZoneIndexOptional)(endIndex);
            if (ctx.legacy) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const cmdReq = { startIndex, endIndex };
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getColorZone.type, cmdReq, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            if (!endIndex || startIndex === endIndex) {
                ctx._client.addMessageHandler(packets_1.packet.stateZone.name, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    const hsbk = (0, colorHSBK_1.packetToNormalisedHSBK)(data.color);
                    data.color.hue = hsbk.hue;
                    data.color.saturation = hsbk.saturation;
                    data.color.brightness = hsbk.brightness;
                    return resolve(data);
                }, sqnNumber);
            }
            else {
                ctx._client.addMessageHandler(packets_1.packet.stateMultiZone.name, (error, data) => {
                    if (error) {
                        return reject(error);
                    }
                    /** Convert HSB values to readable format */
                    data.color.forEach(function (color) {
                        const hsbk = (0, colorHSBK_1.packetToNormalisedHSBK)(data.color);
                        color.hue = hsbk.hue;
                        color.saturation = hsbk.saturation;
                        color.brightness = hsbk.brightness;
                    });
                    return resolve(data.color);
                }, sqnNumber);
            }
        });
    }
    setColorZones(startIndex, endIndex, hue, saturation, brightness, kelvin, duration, apply) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            (0, colorZone_1.validateColorZoneIndex)(startIndex);
            (0, colorZone_1.validateColorZoneIndex)(endIndex);
            (0, colorHSBK_1.validateNormalisedColorHSBK)(hue, saturation, brightness, kelvin);
            const hsbk = {
                hue,
                saturation,
                brightness,
                kelvin
            };
            const PacketColor = (0, colorHSBK_1.normalisedToPacketHBSK)(hsbk);
            const appReq = apply === false ? colorZone_1.ApplyRequest.NO_APPLY : colorZone_1.ApplyRequest.APPLY;
            const cmdReq = {
                startIndex: startIndex,
                endIndex: endIndex,
                color: {
                    hue: PacketColor.hue,
                    saturation: PacketColor.saturation,
                    brightness: PacketColor.brightness,
                    kelvin: PacketColor.kelvin
                },
                duration: duration,
                apply: appReq
            };
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setColorZone.type, cmdReq, ctx._client.source, ctx.id);
            ctx._client.send(packetObj, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(undefined);
            });
        });
    }
    setWaveform(waveform) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            let packetObj;
            if (waveform.setHue || waveform.setSaturation || waveform.setBrightness || waveform.setKelvin) {
                packetObj = (0, packet_1.createObject)(packets_1.packet.setWaveformOptional.type, waveform, ctx._client.source, ctx.id);
            }
            else {
                packetObj = (0, packet_1.createObject)(packets_1.packet.setWaveform.type, waveform, ctx._client.source, ctx.id);
            }
            ctx._client.send(packetObj, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(undefined);
            });
        });
    }
    getDeviceChain(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getDeviceChain.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateDeviceChain.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    getTileState64(timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.getTileState64.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateTileState64.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    setTileState64(setTileState64Request, timeout = client_1.DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setTileState64.type, setTileState64Request, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packets_1.packet.stateTileState64.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    setUserPosition(setUserPositionRequest) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = (0, packet_1.createObject)(packets_1.packet.setUserPosition.type, setUserPositionRequest, ctx._client.source, ctx.id);
            ctx._client.send(packetObj, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(undefined);
            });
        });
    }
}
exports.Light = Light;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlnaHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGlnaHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQ0EsaUNBQWlDO0FBQ2pDLGlEQUE2QztBQUM3Qyx5REFPbUM7QUFDbkMsNkRBS3VDO0FBQ3ZDLHlEQUE2RDtBQUM3RCxpREFBMkY7QUFDM0Ysb0VBTTBDO0FBQzFDLCtDQUEyQztBQUczQyw2REFBMkU7QUFHM0UsdUNBQTZEO0FBRTdELHFDQUE2RDtBQUU3RCx1Q0FBa0Q7QUFDbEQseUNBQTRDO0FBQzVDLHNEQUs4QjtBQUM5Qix3REFBbUU7QUFJbkUsSUFBWSxXQU1YO0FBTkQsV0FBWSxXQUFXO0lBQ3RCLDJDQUE0QixDQUFBO0lBQzVCLDhCQUFlLENBQUE7SUFDZiw4QkFBZSxDQUFBO0lBQ2YsOEJBQWUsQ0FBQTtJQUNmLDhCQUFlLENBQUE7QUFDaEIsQ0FBQyxFQU5XLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBTXRCO0FBV0QsTUFBYSxLQUFNLFNBQVEsNEJBQVk7SUE4RXRDLFlBQW1CLE1BQW9CO1FBQ3RDLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNuQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsTUFBTSxHQUFHO1lB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