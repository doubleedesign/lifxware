import { HSBK_MINIMUM_RAW, HSBK_MAXIMUM_RAW } from '../color/colorHSBK';
import { ServiceErrorBuilder } from '../../lib/error';
import { ER_LIGHT_COLOR_RANGE } from '../../errors/lightErrors';
import { ER_PACKET_INVALID_SIZE } from '../../errors/packetErrors';
const SIZE = 6;
function toObject(buf) {
    let offset = 0;
    if (buf.length !== SIZE) {
        throw new ServiceErrorBuilder(ER_PACKET_INVALID_SIZE).build();
    }
    const brightness = buf.readUInt16LE(offset);
    offset += 2;
    const fadeTime = buf.readUInt32LE(offset);
    offset += 4;
    const obj = {
        brightness,
        fadeTime
    };
    return obj;
}
function toBuffer(obj) {
    const buf = Buffer.alloc(SIZE);
    buf.fill(0);
    let offset = 0;
    if (obj.brightness !== HSBK_MINIMUM_RAW && obj.brightness !== HSBK_MAXIMUM_RAW) {
        throw new ServiceErrorBuilder(ER_LIGHT_COLOR_RANGE)
            .withContextualMessage('Light expects brightness to be ' + HSBK_MINIMUM_RAW + ' or ' + HSBK_MAXIMUM_RAW + ' only')
            .build();
    }
    buf.writeUInt16LE(obj.brightness, offset);
    offset += 2;
    /** Duration is 0 by default */
    if (obj.fadeTime) {
        buf.writeUInt32LE(obj.fadeTime, offset);
    }
    offset += 4;
    return buf;
}
export const setDimRelative = {
    type: 105,
    name: 'setDimRelative',
    legacy: false,
    size: SIZE,
    tagged: false,
    toObject,
    toBuffer
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0RGltUmVsYXRpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcGFja2V0cy9kaW1tZXIvc2V0RGltUmVsYXRpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDeEUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDdEQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDaEUsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFbkUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBRWYsU0FBUyxRQUFRLENBQUMsR0FBVztJQUM1QixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFZixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDekIsTUFBTSxJQUFJLG1CQUFtQixDQUFDLHNCQUFzQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0QsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFNUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFMUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLE1BQU0sR0FBRyxHQUF1QjtRQUMvQixVQUFVO1FBQ1YsUUFBUTtLQUNSLENBQUM7SUFFRixPQUFPLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFFRCxTQUFTLFFBQVEsQ0FBQyxHQUF1QjtJQUN4QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRS9CLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFZixJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssZ0JBQWdCLElBQUksR0FBRyxDQUFDLFVBQVUsS0FBSyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ2hGLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQzthQUNqRCxxQkFBcUIsQ0FDckIsaUNBQWlDLEdBQUcsZ0JBQWdCLEdBQUcsTUFBTSxHQUFHLGdCQUFnQixHQUFHLE9BQU8sQ0FDMUY7YUFDQSxLQUFLLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFFRCxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDMUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLCtCQUErQjtJQUMvQixJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNsQixHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUNELE1BQU0sSUFBSSxDQUFDLENBQUM7SUFFWixPQUFPLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQXNCO0lBQ2hELElBQUksRUFBRSxHQUFHO0lBQ1QsSUFBSSxFQUFFLGdCQUFnQjtJQUN0QixNQUFNLEVBQUUsS0FBSztJQUNiLElBQUksRUFBRSxJQUFJO0lBQ1YsTUFBTSxFQUFFLEtBQUs7SUFDYixRQUFRO0lBQ1IsUUFBUTtDQUNSLENBQUMifQ==