export type PlanetaryHour = {
  hour: number;
  planet: string;
  startTime: string;
  endTime: string;
};

export const planetaryHours: PlanetaryHour[] = [
  { hour: 1, planet: 'Sun', startTime: '6:00 AM', endTime: '7:00 AM' },
  { hour: 2, planet: 'Venus', startTime: '7:00 AM', endTime: '8:00 AM' },
  { hour: 3, planet: 'Mercury', startTime: '8:00 AM', endTime: '9:00 AM' },
  { hour: 4, planet: 'Moon', startTime: '9:00 AM', endTime: '10:00 AM' },
  { hour: 5, planet: 'Saturn', startTime: '10:00 AM', endTime: '11:00 AM' },
  { hour: 6, planet: 'Jupiter', startTime: '11:00 AM', endTime: '12:00 PM' },
  { hour: 7, planet: 'Mars', startTime: '12:00 PM', endTime: '1:00 PM' },
  { hour: 8, planet: 'Sun', startTime: '1:00 PM', endTime: '2:00 PM' },
  { hour: 9, planet: 'Venus', startTime: '2:00 PM', endTime: '3:00 PM' },
  { hour: 10, planet: 'Mercury', startTime: '3:00 PM', endTime: '4:00 PM' },
  { hour: 11, planet: 'Moon', startTime: '4:00 PM', endTime: '5:00 PM' },
  { hour: 12, planet: 'Saturn', startTime: '5:00 PM', endTime: '6:00 PM' },
];
