import { Equipment, TimeRange } from "../types";

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getDefaultTimeRange = (): TimeRange => {
  const end = new Date();
  const start = new Date();
  start.setHours(end.getHours() - 1);
  return { start, end };
};


export const sortDataByTime = (data: Equipment[]): Equipment[] => {
  return [...data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};