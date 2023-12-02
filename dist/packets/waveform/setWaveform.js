"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWaveform = void 0;
const colorHSBK_1 = require("../color/colorHSBK");
const error_1 = require("../../lib/error");
const lightErrors_1 = require("../../errors/lightErrors");
const packetErrors_1 = require("../../errors/packetErrors");
const SIZE = 21;
function toObject(buf) {
    let offset = 0;
    if (buf.length !== SIZE) {
        throw new error_1.ServiceErrorBuilder(packetErrors_1.ER_PACKET_INVALID_SIZE).build();
    }
    offset += 1;
    const isTransient = Boolean(buf.readUInt8(offset));
    offset += 1;
    const hue = buf.readUInt16LE(offset);
    offset += 2;
    const saturation = buf.readUInt16LE(offset);
    offset += 2;
    const brightness = buf.readUInt16LE(offset);
    offset += 2;
    const kelvin = buf.readUInt16LE(offset);
    offset += 2;
    const period = buf.readUInt32LE(offset);
    offset += 4;
    const cycles = buf.readFloatLE(offset);
    offset += 4;
    const skewRatio = buf.readUInt16LE(offset);
    offset += 2;
    const waveform = buf.readUInt8(offset);
    offset += 1;
    const color = {
        hue,
        saturation,
        brightness,
        kelvin
    };
    const obj = {
        isTransient,
        period,
        cycles,
        skewRatio,
        waveform,
        color
    };
    return obj;
}
//eslint-disable-next-line complexity
function toBuffer(obj) {
    const buf = Buffer.alloc(SIZE);
    buf.fill(0);
    let offset = 0;
    //** Reserved */
    offset += 1;
    buf.writeUInt8(obj.isTransient ? 1 : 0, offset);
    offset += 1;
    if (obj.color.hue < colorHSBK_1.HSBK_MINIMUM_RAW || obj.color.hue > colorHSBK_1.HSBK_MAXIMUM_RAW) {
        throw new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects hue to be a number between ' + colorHSBK_1.HSBK_MINIMUM_RAW + ' and ' + colorHSBK_1.HSBK_MAXIMUM_RAW)
            .build();
    }
    buf.writeUInt16LE(obj.color.hue, offset);
    offset += 2;
    if (obj.color.saturation < colorHSBK_1.HSBK_MINIMUM_RAW || obj.color.saturation > colorHSBK_1.HSBK_MAXIMUM_RAW) {
        throw new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects saturation to be a number between ' + colorHSBK_1.HSBK_MINIMUM_RAW + ' and ' + colorHSBK_1.HSBK_MAXIMUM_RAW)
            .build();
    }
    buf.writeUInt16LE(obj.color.saturation, offset);
    offset += 2;
    if (obj.color.brightness < colorHSBK_1.HSBK_MINIMUM_RAW || obj.color.brightness > colorHSBK_1.HSBK_MAXIMUM_RAW) {
        throw new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects brightness to be a number between ' + colorHSBK_1.HSBK_MINIMUM_RAW + ' and ' + colorHSBK_1.HSBK_MAXIMUM_RAW)
            .build();
    }
    buf.writeUInt16LE(obj.color.brightness, offset);
    offset += 2;
    if (!obj.color.kelvin) {
        obj.color.kelvin = colorHSBK_1.HSBK_DEFAULT_KELVIN;
    }
    if (obj.color.kelvin < colorHSBK_1.HSBK_MINIMUM_KELVIN || obj.color.kelvin > colorHSBK_1.HSBK_MAXIMUM_KELVIN) {
        throw new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects kelvin to be a number between ' + colorHSBK_1.HSBK_MINIMUM_KELVIN + ' and ' + colorHSBK_1.HSBK_MAXIMUM_KELVIN)
            .build();
    }
    buf.writeUInt16LE(obj.color.kelvin, offset);
    offset += 2;
    buf.writeUInt32LE(obj.period, offset);
    offset += 4;
    buf.writeFloatLE(obj.cycles, offset);
    offset += 4;
    buf.writeInt16LE(obj.skewRatio, offset);
    offset += 2;
    if (obj.waveform < 0 || obj.waveform > 5) {
        throw new error_1.ServiceErrorBuilder(lightErrors_1.ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects waveform to be a number between 0 and 5')
            .build();
    }
    buf.writeUInt8(obj.waveform, offset);
    offset += 1;
    return buf;
}
exports.setWaveform = {
    type: 103,
    name: 'setWaveform',
    legacy: false,
    size: SIZE,
    tagged: false,
    toObject,
    toBuffer
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0V2F2ZWZvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcGFja2V0cy93YXZlZm9ybS9zZXRXYXZlZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFPNEI7QUFHNUIsMkNBQXNEO0FBQ3RELDBEQUFnRTtBQUNoRSw0REFBbUU7QUFFbkUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRWhCLFNBQVMsUUFBUSxDQUFDLEdBQVc7SUFDNUIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRWYsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRTtRQUN4QixNQUFNLElBQUksMkJBQW1CLENBQUMscUNBQXNCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUM5RDtJQUVELE1BQU0sSUFBSSxDQUFDLENBQUM7SUFFWixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRW5ELE1BQU0sSUFBSSxDQUFDLENBQUM7SUFFWixNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXJDLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFDWixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTVDLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFDWixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTVDLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFDWixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXhDLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFFWixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXhDLE1BQU0sSUFBSSxD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