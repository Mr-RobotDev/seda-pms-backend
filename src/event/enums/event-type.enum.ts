export enum EventType {
  NETWORK_STATUS = 'networkStatus',
  CONNECTION_STATUS = 'connectionStatus',
  HUMIDITY = 'humidity',
  COLD = 'cold',
  PRESSURE = 'pressure',
}

export const EventTypeValues = Object.values(EventType);
