import { HSBK_MAXIMUM_RAW, HSBK_MINIMUM_RAW, HSBK_MINIMUM_KELVIN, HSBK_MAXIMUM_KELVIN } from '../color/colorHSBK';
import { HSBK_DEFAULT_KELVIN } from '../color/colorHSBK';
import { ZONE_INDEX_MINIMUM_VALUE, ZONE_INDEX_MAXIMUM_VALUE } from './colorZone';
import { ServiceErrorBuilder } from '../../lib/error';
import { ER_LIGHT_COLOR_RANGE } from '../../errors/lightErrors';
import { ER_PACKET_INVALID_SIZE } from '../../errors/packetErrors';
const SIZE = 10;
function toObject(buf) {
    let offset = 0;
    if (buf.length < SIZE) {
        throw new ServiceErrorBuilder(ER_PACKET_INVALID_SIZE)
            .withContextualMessage('Invalid length for LIFX packet, expected minimum 10 but received ' + buf.length)
            .build();
    }
    const count = buf.readUInt8(offset);
    offset += 1;
    const index = buf.readUInt8(offset);
    offset += 1;
    const colors = [];
    while (buf.length - offset >= 8) {
        const hue = buf.readUInt16LE(offset);
        offset += 2;
        const saturation = buf.readUInt16LE(offset);
        offset += 2;
        const brightness = buf.readUInt16LE(offset);
        offset += 2;
        const kelvin = buf.readUInt16LE(offset);
        offset += 2;
        const color = {
            hue,
            saturation,
            brightness,
            kelvin
        };
        colors.push(color);
    }
    const obj = {
        count,
        index,
        color: colors
    };
    return obj;
}
function toBuffer(obj) {
    const buf = Buffer.alloc(SIZE);
    buf.fill(0);
    let offset = 0;
    if (obj.count < ZONE_INDEX_MINIMUM_VALUE || obj.count > ZONE_INDEX_MAXIMUM_VALUE) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Invalid count value given for stateColorMultiZone LIFX packet, must be a number between ' +
            ZONE_INDEX_MINIMUM_VALUE +
            ' and ' +
            ZONE_INDEX_MAXIMUM_VALUE)
            .build();
    }
    buf.writeUInt8(obj.count, offset);
    offset += 1;
    if (obj.index < ZONE_INDEX_MINIMUM_VALUE || obj.index > ZONE_INDEX_MAXIMUM_VALUE) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Invalid index value given for stateColorMultiZone LIFX packet, must be a number between ' +
            ZONE_INDEX_MINIMUM_VALUE +
            ' and ' +
            ZONE_INDEX_MAXIMUM_VALUE)
            .build();
    }
    buf.writeUInt8(obj.index, offset);
    offset += 1;
    if (obj.color.length < 1 || obj.color.length > 8) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Invalid set of color values given for stateColorMultiZone LIFX packet, must be an array of 1 to 8 objects')
            .build();
    }
    //eslint-disable-next-line complexity
    obj.color.forEach(function (colorObj, index) {
        if (colorObj.hue < HSBK_MINIMUM_RAW || colorObj.hue > HSBK_MAXIMUM_RAW) {
            throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
                .withContextualMessage('Invalid color hue given at index ' +
                index +
                ', must be a number between ' +
                HSBK_MINIMUM_RAW +
                ' and ' +
                HSBK_MAXIMUM_RAW)
                .build();
        }
        buf.writeUInt16LE(colorObj.hue, offset);
        offset += 2;
        if (colorObj.saturation < HSBK_MINIMUM_RAW || colorObj.saturation > HSBK_MAXIMUM_RAW) {
            throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
                .withContextualMessage('Invalid color saturation given at index ' +
                index +
                ', must be a number between ' +
                HSBK_MINIMUM_RAW +
                ' and ' +
                HSBK_MAXIMUM_RAW)
                .build();
        }
        buf.writeUInt16LE(colorObj.saturation, offset);
        offset += 2;
        if (colorObj.brightness < HSBK_MINIMUM_RAW || colorObj.brightness > HSBK_MAXIMUM_RAW) {
            throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
                .withContextualMessage('Invalid color brightness given at index ' +
                index +
                ', must be a number between ' +
                HSBK_MINIMUM_RAW +
                ' and ' +
                HSBK_MAXIMUM_RAW)
                .build();
        }
        buf.writeUInt16LE(colorObj.brightness, offset);
        offset += 2;
        if (!colorObj.kelvin) {
            colorObj.kelvin = HSBK_DEFAULT_KELVIN;
        }
        if (colorObj.kelvin < HSBK_MINIMUM_KELVIN || colorObj.kelvin > HSBK_MAXIMUM_KELVIN) {
            throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
                .withContextualMessage('Invalid color kelvin given at index ' +
                index +
                ', must be a number between ' +
                HSBK_MINIMUM_RAW +
                ' and ' +
                HSBK_MAXIMUM_RAW)
                .build();
        }
        buf.writeUInt16LE(colorObj.kelvin, offset);
        offset += 2;
    });
    return buf;
}
export const stateMultiZone = {
    type: 506,
    name: 'stateColorMultiZone',
    legacy: false,
    size: SIZE,
    tagged: false,
    toObject,
    toBuffer
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGVDb2xvck11bHRpWm9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wYWNrZXRzL2NvbG9yWm9uZS9zdGF0ZUNvbG9yTXVsdGlab25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFFTixnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQixtQkFBbUIsRUFDbkIsTUFBTSxvQkFBb0IsQ0FBQztBQUM1QixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQWEsd0JBQXdCLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFNUYsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDdEQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDaEUsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFbkUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRWhCLFNBQVMsUUFBUSxDQUFDLEdBQVc7SUFDNUIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRWYsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxzQkFBc0IsQ0FBQzthQUNuRCxxQkFBcUIsQ0FBQyxtRUFBbUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO2FBQ3ZHLEtBQUssRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFcEMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFcEMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLE1BQU0sTUFB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