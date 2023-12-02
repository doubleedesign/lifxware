"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateDeviceChain = void 0;
const utils = require("../../lib/utils");
const error_1 = require("../../lib/error");
const packetErrors_1 = require("../../errors/packetErrors");
const tileErrors_1 = require("../../errors/tileErrors");
const SIZE = 882;
const MAX_TILES = 16;
//eslint-disable-next-line complexity
function toObject(buf) {
    let offset = 0;
    if (buf.length !== SIZE) {
        throw new error_1.ServiceErrorBuilder(packetErrors_1.ER_PACKET_INVALID_SIZE).build();
    }
    let obj;
    obj.start_index = buf.readUInt8(offset);
    offset += 1;
    for (let i = 0; i < MAX_TILES - 1; i++) {
        let tile;
        tile.accel_meas_x = buf.readInt16LE(offset);
        offset += 2;
        tile.accel_meas_y = buf.readInt16LE(offset);
        offset += 2;
        tile.accel_meas_z = buf.readInt16LE(offset);
        offset += 2;
        /** reserved */
        offset += 2;
        tile.user_x = buf.readFloatLE(offset);
        offset += 4;
        tile.user_y = buf.readFloatLE(offset);
        offset += 4;
        tile.width = buf.readUInt8(offset);
        offset += 1;
        tile.height = buf.readUInt8(offset);
        offset += 1;
        /** reserved */
        offset += 1;
        tile.device_version_vendor = buf.readUInt32LE(offset);
        offset += 4;
        tile.device_version_product = buf.readUInt32LE(offset);
        offset += 4;
        tile.device_version_version = buf.readUInt32LE(offset);
        offset += 4;
        tile.firmware_build = utils.readUInt64LE(buf, offset);
        offset += 8;
        /** reserved */
        offset += 8;
        tile.firmware_version_minor = buf.readUInt16LE(offset);
        offset += 2;
        tile.firmware_version_major = buf.readUInt16LE(offset);
        offset += 2;
        /** reserved */
        offset += 4;
        obj.tile_devices.push(tile);
    }
    obj.total_count = buf.readUInt8(offset);
    offset += 1;
    return obj;
}
//eslint-disable-next-line complexity
function toBuffer(obj) {
    const buf = Buffer.alloc(SIZE);
    buf.fill(0);
    let offset = 0;
    buf.writeUInt8(obj.start_index, offset);
    offset += 1;
    if (obj.tile_devices.length !== MAX_TILES) {
        throw new error_1.ServiceErrorBuilder(tileErrors_1.ER_TILE_INVALID_SIZE).build();
    }
    for (const tile of obj.tile_devices) {
        buf.writeInt16LE(tile.accel_meas_x, offset);
        offset += 2;
        buf.writeInt16LE(tile.accel_meas_y, offset);
        offset += 2;
        buf.writeInt16LE(tile.accel_meas_z, offset);
        offset += 2;
        /** reserved */
        offset += 2;
        buf.writeFloatLE(tile.user_x, offset);
        offset += 4;
        buf.writeFloatLE(tile.user_y, offset);
        offset += 4;
        buf.writeUInt8(tile.width, offset);
        offset += 1;
        buf.writeUInt8(tile.height, offset);
        offset += 1;
        /** reserved */
        offset += 1;
        buf.writeUInt32LE(tile.device_version_vendor, offset);
        offset += 4;
        buf.writeUInt32LE(tile.device_version_product, offset);
        offset += 4;
        buf.writeUInt32LE(tile.device_version_version, offset);
        offset += 4;
        utils.writeUInt64LE(buf, tile.firmware_build, offset);
        offset += 8;
        /** reserved */
        offset += 8;
        buf.writeUInt16LE(tile.firmware_version_minor, offset);
        offset += 2;
        buf.writeUInt16LE(tile.firmware_version_major, offset);
        offset += 2;
        /** reserved */
        offset += 4;
    }
    buf.writeUInt8(obj.total_count, offset);
    offset += 1;
    return buf;
}
exports.stateDeviceChain = {
    type: 702,
    name: 'stateDeviceChain',
    legacy: false,
    size: SIZE,
    tagged: false,
    toObject,
    toBuffer
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGVEZXZpY2VDaGFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wYWNrZXRzL3RpbGVzL3N0YXRlRGV2aWNlQ2hhaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseUNBQXlDO0FBR3pDLDJDQUFzRDtBQUN0RCw0REFBbUU7QUFDbkUsd0RBQStEO0FBRS9ELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUNqQixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFFckIscUNBQXFDO0FBQ3JDLFNBQVMsUUFBUSxDQUFDLEdBQVc7SUFDNUIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRWYsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRTtRQUN4QixNQUFNLElBQUksMkJBQW1CLENBQUMscUNBQXNCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUM5RDtJQUVELElBQUksR0FBNkIsQ0FBQztJQUVsQyxHQUFHLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUVaLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3ZDLElBQUksSUFBVSxDQUFDO1FBRWYsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFFWixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUMsTUFBTSxJQUFJLENBQUMsQ0FBQztRQUVaLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QyxNQUFNLElBQUksQ0FBQyxDQUFD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