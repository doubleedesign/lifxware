import { HSBK_MINIMUM_RAW, HSBK_MAXIMUM_RAW, HSBK_MINIMUM_KELVIN, HSBK_MAXIMUM_KELVIN } from '../color/colorHSBK';
import { HSBK_DEFAULT_KELVIN } from '../color/colorHSBK';
import { ZONE_INDEX_MINIMUM_VALUE, ZONE_INDEX_MAXIMUM_VALUE } from './colorZone';
import { ServiceErrorBuilder } from '../../lib/error';
import { ER_LIGHT_COLOR_RANGE } from '../../errors/lightErrors';
import { ER_PACKET_INVALID_SIZE } from '../../errors/packetErrors';
const SIZE = 10;
function toObject(buf) {
    let offset = 0;
    if (buf.length !== SIZE) {
        throw new ServiceErrorBuilder(ER_PACKET_INVALID_SIZE).build();
    }
    const count = buf.readUInt8(offset);
    offset += 1;
    const index = buf.readUInt8(offset);
    offset += 1;
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
    const obj = {
        count,
        index,
        color
    };
    return obj;
}
/**
 * Converts the given packet specific object into a packet
 * @param obj object with configuration data
 * @return packet
 */
//eslint-disable-next-line complexity
function toBuffer(obj) {
    const buf = Buffer.alloc(SIZE);
    buf.fill(0);
    let offset = 0;
    if (obj.count < ZONE_INDEX_MINIMUM_VALUE || obj.count > ZONE_INDEX_MAXIMUM_VALUE) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Invalid count value given for stateColorZone LIFX packet, must be a number between ' +
            ZONE_INDEX_MINIMUM_VALUE +
            ' and ' +
            ZONE_INDEX_MAXIMUM_VALUE)
            .build();
    }
    buf.writeUInt8(obj.count, offset);
    offset += 1;
    if (obj.index < ZONE_INDEX_MINIMUM_VALUE || obj.index > ZONE_INDEX_MAXIMUM_VALUE) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Invalid index value given for stateColorZone LIFX packet, must be a number between ' +
            ZONE_INDEX_MINIMUM_VALUE +
            ' and ' +
            ZONE_INDEX_MAXIMUM_VALUE)
            .build();
    }
    buf.writeUInt8(obj.index, offset);
    offset += 1;
    if (obj.color.hue < HSBK_MINIMUM_RAW || obj.color.hue > HSBK_MAXIMUM_RAW) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects hue to be a number between ' + HSBK_MINIMUM_RAW + ' and ' + HSBK_MAXIMUM_RAW)
            .build();
    }
    buf.writeUInt16LE(obj.color.hue, offset);
    offset += 2;
    if (obj.color.saturation < HSBK_MINIMUM_RAW || obj.color.saturation > HSBK_MAXIMUM_RAW) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects saturation to be a number between ' + HSBK_MINIMUM_RAW + ' and ' + HSBK_MAXIMUM_RAW)
            .build();
    }
    buf.writeUInt16LE(obj.color.saturation, offset);
    offset += 2;
    if (obj.color.brightness < HSBK_MINIMUM_RAW || obj.color.brightness > HSBK_MAXIMUM_RAW) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects brightness to be a number between ' + HSBK_MINIMUM_RAW + ' and ' + HSBK_MAXIMUM_RAW)
            .build();
    }
    buf.writeUInt16LE(obj.color.brightness, offset);
    offset += 2;
    if (!obj.color.kelvin) {
        obj.color.kelvin = HSBK_DEFAULT_KELVIN;
    }
    if (obj.color.kelvin < HSBK_MINIMUM_KELVIN || obj.color.kelvin > HSBK_MAXIMUM_KELVIN) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects kelvin to be a number between ' + HSBK_MINIMUM_KELVIN + ' and ' + HSBK_MAXIMUM_KELVIN)
            .build();
    }
    buf.writeUInt16LE(obj.color.kelvin, offset);
    offset += 2;
    return buf;
}
export const stateZone = {
    type: 503,
    name: 'stateColorZone',
    legacy: false,
    size: SIZE,
    tagged: false,
    toObject,
    toBuffer
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGVDb2xvclpvbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcGFja2V0cy9jb2xvclpvbmUvc3RhdGVDb2xvclpvbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVOLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsbUJBQW1CLEVBQ25CLG1CQUFtQixFQUNuQixNQUFNLG9CQUFvQixDQUFDO0FBQzVCLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3pELE9BQU8sRUFBYSx3QkFBd0IsRUFBRSx3QkFBd0IsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUU1RixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNoRSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVuRSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7QUFFaEIsU0FBUyxRQUFRLENBQUMsR0FBVztJQUM1QixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFZixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDekIsTUFBTSxJQUFJLG1CQUFtQixDQUFDLHNCQUFzQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0QsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFcEMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFcEMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFckMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNaLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFNUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNaLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFNUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNaLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFeEMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLE1BQU0sS0FBSyxHQUFjO1FBQ3hCLEdBQUc7UUFDSCxVQUFVO1FBQ1YsVUFBVTtRQUNWLE1BQU07S0FDTixDQUFDO0lBRUYsTUFBTSxHQUFHLEdBQWM7UUFDdEIsS0FBSztRQUNMLEtBQUs7UUFDTCxLQUFLO0tBQ0wsQ0FBQztJQUVGLE9BQU8sR0FBRyxDQUFDO0FBQ1osQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxxQ0FBcUM7QUFDckMsU0FBUyxRQUFRLENBQUMsR0FBYztJQUMvQixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRS9CLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFZixJQUFJLEdBQUcsQ0FBQyxLQUFLLEdBQUcsd0JBQXdCLElBQUksR0FBRyxDQUFDLEtBQUssR0FBRyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2xGLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQzthQUNqRCxxQkFBcUIsQ0FDckIscUZBQXFGO1lBQ3BGLHdCQUF3QjtZQUN4QixPQUFPO1lBQ1Asd0JBQXdCLENBQ3pCO2FBQ0EsS0FBSyxFQUFFLENBQUM7SUFDWCxDQUFDO0lBQ0QsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFFWixJQUFJLEdBQUcsQ0FBQyxLQUFLLEdBQUcsd0JBQXdCLElBQUksR0FBRyxDQUFDLEtBQUssR0FBRyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2xGLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQzthQUNqRCxxQkFBcUIsQ0FDckIscUZBQXFGO1lBQ3BGLHdCQUF3QjtZQUN4QixPQUFPO1lBQ1Asd0JBQXdCLENBQ3pCO2FBQ0EsS0FBSyxFQUFFLENBQUM7SUFDWCxDQUFDO0lBQ0QsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFFWixJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLGdCQUFnQixJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDMUUsTUFBTSxJQUFJLG1CQUFtQixDQUFDLG9CQUFvQixDQUFDO2FBQ2pELHFCQUFxQixDQUNyQiwyQ0FBMkMsR0FBRyxnQkFBZ0IsR0FBRyxPQUFPLEdBQUcsZ0JBQWdCLENBQzNGO2FBQ0EsS0FBSyxFQUFFLENBQUM7SUFDWCxDQUFDO0lBQ0QsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6QyxNQUFNLElBQUksQ0FBQyxDQUFDO0lBRVosSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hGLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQzthQUNqRCxxQkFBcUIsQ0FDckIsa0RBQWtELEdBQUcsZ0JBQWdCLEdBQUcsT0FBTyxHQUFHLGdCQUFnQixDQUNsRzthQUNBLEtBQUssRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQUNELEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDaEQsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsZ0JBQWdCLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4RixNQUFNLElBQUksbUJBQW1CLENBQUMsb0JBQW9CLENBQUM7YUFDakQscUJBQXFCLENBQ3JCLGtEQUFrRCxHQUFHLGdCQUFnQixHQUFHLE9BQU8sR0FBRyxnQkFBZ0IsQ0FDbEc7YUFDQSxLQUFLLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFDRCxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2hELE1BQU0sSUFBSSxDQUFDLENBQUM7SUFFWixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN2QixHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQztJQUN4QyxDQUFDO0lBRUQsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsRUFBRSxDQUFDO1FBQ3RGLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQzthQUNqRCxxQkFBcUIsQ0FDckIsOENBQThDLEdBQUcsbUJBQW1CLEdBQUcsT0FBTyxHQUFHLG1CQUFtQixDQUNwRzthQUNBLEtBQUssRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQUNELEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDNUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLE9BQU8sR0FBRyxDQUFDO0FBQ1osQ0FBQztBQUVELE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBc0I7SUFDM0MsSUFBSSxFQUFFLEdBQUc7SUFDVCxJQUFJLEVBQUUsZ0JBQWdCO0lBQ3RCLE1BQU0sRUFBRSxLQUFLO0lBQ2IsSUFBSSxFQUFFLElBQUk7SUFDVixNQUFNLEVBQUUsS0FBSztJQUNiLFFBQVE7SUFDUixRQUFRO0NBQ1IsQ0FBQyJ9