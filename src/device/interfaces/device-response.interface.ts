import { Range } from '../../alert/schema/range.schema';

interface Location {
  lat: number;
  long: number;
}

interface Alert {
  field: string;
  range: Range;
}

export interface DeviceResponse {
  oem: string;
  name: string;
  type: string;
  temperature: number;
  relativeHumidity: number;
  location: Location;
  isOffline: boolean;
  lastUpdated: string;
  signalStrength: number;
  id: string;
  alerts: Alert[];
}
