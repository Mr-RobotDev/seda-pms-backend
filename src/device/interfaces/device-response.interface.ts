import { Range } from '../../alert/schema/range.schema';
import { Device } from '../schema/device.schema';

interface Alert {
  field: string;
  range: Range;
}

export interface DeviceResponse {
  device: Device;
  alerts: Alert[];
}
