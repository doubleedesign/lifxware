import * as assert from 'assert';
import { validateNormalisedColorHSBK, packetToNormalisedHSBK, normalisedToPacketHBSK, HSBK_DEFAULT_KELVIN } from './packets/color/colorHSBK';
import { ApplyRequest, validateColorZoneIndex, validateColorZoneIndexOptional } from './packets/colorZone/colorZone';
import { HSBK_MAXIMUM_RAW } from './packets/color/colorHSBK';
import { POWER_MINIMUM_RAW, POWER_MAXIMUM_RAW } from './packets/power/power';
import { validateNormalisedColorInfrared, normalisedToPacketInfraed, packetToNormalisedInfrared } from './packets/infrared/colorInfrared';
import { packet } from './packets/packets';
import { validateNormalisedColorRgb } from './packets/colorRGBW/colorRGBW';
import { rgbToHsb, rgbHexStringToObject } from './lib/color';
import { DEFAULT_MSG_REPLY_TIMEOUT } from './client';
import { ServiceErrorBuilder } from './lib/error';
import { createObject } from './lib/packet';
import { ER_LIGHT_OFFLINE, ER_LIGHT_CMD_NOT_SUPPORTED, ER_LIGHT_CMD_TIMEOUT, ER_LIGHT_MISSING_CACHE } from './errors/lightErrors';
import { ER_CLIENT_INVALID_ARGUMENT } from './errors/clientErrors';
import EventEmitter from 'events';
export var LightEvents;
(function (LightEvents) {
    LightEvents["CONECTIVITY"] = "connectivity";
    LightEvents["LABEL"] = "label";
    LightEvents["COLOR"] = "color";
    LightEvents["STATE"] = "state";
    LightEvents["POWER"] = "power";
})(LightEvents || (LightEvents = {}));
export class Light extends EventEmitter {
    id;
    address;
    label;
    port;
    legacy;
    _discoveryPacketNumber;
    _client;
    _connectivity;
    _group;
    _power;
    _color;
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
    async setPower(power, duration) {
        const ctx = this;
        return new Promise(function (resolve, reject) {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const cmdReq = { power: power ? POWER_MAXIMUM_RAW : POWER_MINIMUM_RAW, duration };
            const packetObj = createObject(ctx.legacy ? packet.setPowerLegacy.type : packet.setPower.type, cmdReq, ctx._client.source, ctx.id);
            ctx._client.send(packetObj, (err, msg, rInfo) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(msg);
                }
            });
        });
    }
    getColor(cache, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache === true) {
                return resolve(ctx._color);
            }
            const packetObj = createObject(packet.getLight.type, {}, ctx._client.source, ctx.id);
            if (ctx.legacy) {
                ctx._client.send(packetObj);
                if (!ctx._color) {
                    return reject(new ServiceErrorBuilder(ER_LIGHT_MISSING_CACHE).build());
                }
                return resolve(ctx._color);
            }
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateLight.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(packetToNormalisedHSBK(data.color));
            }, sqnNumber);
        });
    }
    setColor(hue, saturation, brightness, kelvin, duration = 0, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            validateNormalisedColorHSBK(hue, saturation, brightness, kelvin);
            const normalisedColor = {
                hue,
                saturation,
                brightness,
                kelvin
            };
            const color = normalisedToPacketHBSK(normalisedColor);
            const cmdReq = { color, duration };
            const packetObj = createObject(packet.setColor.type, cmdReq, ctx._client.source, ctx.id);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
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
    async setColorRgb(red, green, blue, duration = 0, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        validateNormalisedColorRgb(red, green, blue);
        const hsbObj = rgbToHsb({ red, green, blue });
        return await ctx.setColor(hsbObj.hue, hsbObj.saturation, hsbObj.brightness, HSBK_DEFAULT_KELVIN, duration, timeout);
    }
    async setColorRgbHex(hexString, duration = 0, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        const rgbObj = rgbHexStringToObject(hexString);
        const hsbObj = rgbToHsb(rgbObj);
        return await ctx.setColor(hsbObj.hue, hsbObj.saturation, hsbObj.brightness, HSBK_DEFAULT_KELVIN, duration, timeout);
    }
    getTime(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!this._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getTime.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateTime.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    setTime(time, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const cmdReq = { time };
            const packetObj = createObject(packet.setTime.type, cmdReq, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateTime.name, (err, data) => {
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
    getState(cache = false, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache === true) {
                return resolve({
                    connectivity: ctx._connectivity,
                    power: ctx._power,
                    color: ctx._color
                });
            }
            const packetObj = createObject(packet.getLight.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateLight.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                const PacketColor = packetToNormalisedHSBK(data.color);
                data.color.hue = PacketColor.hue;
                data.color.saturation = PacketColor.saturation;
                data.color.brightness = PacketColor.brightness;
                ctx._power = data.power === HSBK_MAXIMUM_RAW;
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
    getResetSwitchState(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getResetSwitchState.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateResetSwitch.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(!!data.switch);
            }, sqnNumber);
        });
    }
    getInfrared(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getInfrared.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateInfrared.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                const infraredColor = data;
                const irPacket = packetToNormalisedInfrared(infraredColor);
                data.brightness = irPacket.brightness;
                return resolve(data);
            }, sqnNumber);
        });
    }
    setInfrared(brightness, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            validateNormalisedColorInfrared(brightness);
            const infraredColor = {
                brightness
            };
            const cmdReq = {
                brightness: normalisedToPacketInfraed(infraredColor).brightness
            };
            const packetObj = createObject(packet.setInfrared.type, cmdReq, ctx._client.source, ctx.id);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.send(packetObj, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                const infraredColor = data;
                const hsbk = packetToNormalisedHSBK(infraredColor);
                data.brightness = hsbk.brightness;
                return resolve(data);
            });
        });
    }
    getHostInfo(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getHostInfo.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateHostInfo.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    getHostFirmware(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getHostFirmware.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateHostFirmware.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    getHardwareVersion(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getVersion.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateVersion.name, (err, data) => {
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
    getWifiInfo(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getWifiInfo.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateWifiInfo.name, (err, data) => {
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
    getWifiFirmware(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getWifiFirmware.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateWifiFirmware.name, (err, data) => {
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
    getLabel(cache = false, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache === true) {
                if (ctx.label.length > 0) {
                    return resolve(ctx.label);
                }
            }
            const cmdReq = { target: ctx.id };
            const packetObj = createObject(packet.getLabel.type, cmdReq, ctx._client.source);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateLabel.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data.label);
            }, sqnNumber);
        });
    }
    setLabel(label, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (Buffer.byteLength(label.label, 'utf8') > 32) {
                return reject(new ServiceErrorBuilder(ER_CLIENT_INVALID_ARGUMENT)
                    .withContextualMessage('LIFX client setLabel method expects a maximum of 32 bytes as label')
                    .build());
            }
            if (label.label.length < 1) {
                return reject(new ServiceErrorBuilder(ER_CLIENT_INVALID_ARGUMENT)
                    .withContextualMessage('LIFX client setLabel method expects a minimum of one char as label')
                    .build());
            }
            const packetObj = createObject(packet.setLabel.type, label, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateLabel.name, (err, data) => {
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
    getGroup(cache = false, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx.connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache === true) {
                if (ctx._group) {
                    return resolve(ctx._group);
                }
            }
            const cmdReq = { target: this.id };
            const packetObj = createObject(packet.getGroup.type, cmdReq, ctx._client.source);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateGroup.name, (err, data) => {
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
    getTags(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (!ctx.legacy) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const cmdReq = { target: ctx.id };
            const packetObj = createObject(packet.getTags.type, cmdReq, ctx._client.source);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateTags.name, (err, data) => {
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
    setTags(tags, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (!ctx.legacy) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const packetObj = createObject(packet.setTags.type, tags, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateTags.name, (err, data) => {
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
    getTagLabels(tagLabels, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (!ctx.legacy) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const packetObj = createObject(packet.getTagLabels.type, tagLabels, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateTagLabels.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                resolve(data.label);
            }, sqnNumber);
        });
    }
    setTagLabels(tagLabels, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (!ctx.legacy) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const packetObj = createObject(packet.setTagLabels.type, tagLabels, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateTagLabels.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data.label);
            }, sqnNumber);
        });
    }
    getAmbientLight(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getAmbientLight.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateAmbientLight.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data.flux);
            }, sqnNumber);
        });
    }
    getPower(cache = false, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            if (cache) {
                return resolve(ctx._power);
            }
            if (ctx.legacy) {
                const packetObj = createObject(packet.getPowerLegacy.type, {}, ctx._client.source, ctx.id);
                this._client.send(packetObj);
                return resolve(ctx._power);
            }
            const packetObj = createObject(packet.getPower.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.statePower.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                if (data.power === HSBK_MAXIMUM_RAW) {
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
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            validateColorZoneIndex(startIndex);
            validateColorZoneIndexOptional(endIndex);
            if (ctx.legacy) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_CMD_NOT_SUPPORTED).build());
            }
            const cmdReq = { startIndex, endIndex };
            const packetObj = createObject(packet.getColorZone.type, cmdReq, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            if (!endIndex || startIndex === endIndex) {
                ctx._client.addMessageHandler(packet.stateZone.name, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    const hsbk = packetToNormalisedHSBK(data.color);
                    data.color.hue = hsbk.hue;
                    data.color.saturation = hsbk.saturation;
                    data.color.brightness = hsbk.brightness;
                    return resolve(data);
                }, sqnNumber);
            }
            else {
                ctx._client.addMessageHandler(packet.stateMultiZone.name, (error, data) => {
                    if (error) {
                        return reject(error);
                    }
                    /** Convert HSB values to readable format */
                    data.color.forEach(function (color) {
                        const hsbk = packetToNormalisedHSBK(data.color);
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
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            validateColorZoneIndex(startIndex);
            validateColorZoneIndex(endIndex);
            validateNormalisedColorHSBK(hue, saturation, brightness, kelvin);
            const hsbk = {
                hue,
                saturation,
                brightness,
                kelvin
            };
            const PacketColor = normalisedToPacketHBSK(hsbk);
            const appReq = apply === false ? ApplyRequest.NO_APPLY : ApplyRequest.APPLY;
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
            const packetObj = createObject(packet.setColorZone.type, cmdReq, ctx._client.source, ctx.id);
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
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            let packetObj;
            if (waveform.setHue || waveform.setSaturation || waveform.setBrightness || waveform.setKelvin) {
                packetObj = createObject(packet.setWaveformOptional.type, waveform, ctx._client.source, ctx.id);
            }
            else {
                packetObj = createObject(packet.setWaveform.type, waveform, ctx._client.source, ctx.id);
            }
            ctx._client.send(packetObj, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(undefined);
            });
        });
    }
    getDeviceChain(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getDeviceChain.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateDeviceChain.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    getTileState64(timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.getTileState64.type, {}, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateTileState64.name, (err, data) => {
                if (err) {
                    return reject(err);
                }
                clearTimeout(timeoutHandle);
                return resolve(data);
            }, sqnNumber);
        });
    }
    setTileState64(setTileState64Request, timeout = DEFAULT_MSG_REPLY_TIMEOUT) {
        const ctx = this;
        return new Promise((resolve, reject) => {
            if (!ctx._connectivity) {
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.setTileState64.type, setTileState64Request, ctx._client.source, ctx.id);
            const sqnNumber = ctx._client.send(packetObj);
            const timeoutHandle = setTimeout(() => {
                reject(new ServiceErrorBuilder(ER_LIGHT_CMD_TIMEOUT).withContextualMessage(`Id: ${ctx.id}`).build());
            }, timeout);
            ctx._client.addMessageHandler(packet.stateTileState64.name, (err, data) => {
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
                return reject(new ServiceErrorBuilder(ER_LIGHT_OFFLINE).withContextualMessage(`Id: ${ctx.id}`).build());
            }
            const packetObj = createObject(packet.setUserPosition.type, setUserPositionRequest, ctx._client.source, ctx.id);
            ctx._client.send(packetObj, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(undefined);
            });
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlnaHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGlnaHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDakMsT0FBTyxFQUdOLDJCQUEyQixFQUMzQixzQkFBc0IsRUFDdEIsc0JBQXNCLEVBQ3RCLG1CQUFtQixFQUNuQixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFDTixZQUFZLEVBRVosc0JBQXNCLEVBQ3RCLDhCQUE4QixFQUM5QixNQUFNLCtCQUErQixDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQzdELE9BQU8sRUFBZ0IsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUMzRixPQUFPLEVBR04sK0JBQStCLEVBQy9CLHlCQUF5QixFQUN6QiwwQkFBMEIsRUFDMUIsTUFBTSxrQ0FBa0MsQ0FBQztBQUMxQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFHM0MsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFHM0UsT0FBTyxFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUU3RCxPQUFPLEVBQVUseUJBQXlCLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFFN0QsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ2xELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDNUMsT0FBTyxFQUNOLGdCQUFnQixFQUNoQiwwQkFBMEIsRUFDMUIsb0JBQW9CLEVBQ3BCLHNCQUFzQixFQUN0QixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBR25FLE9BQU8sWUFBWSxNQUFNLFFBQVEsQ0FBQztBQUVsQyxN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