import type { Host, HostRequest } from '../types'

export const WEATHER = {
  headline: 'Rainy week ahead',
  detail: '3 days of rain forecast · 12 people searching in Belmopan',
}

export const HOSTS: Host[] = [
  {
    id: 'maria',
    name: 'Maria',
    location: 'Las Flores',
    rating: 4.9,
    price: 0,
    slotsLeft: 3,
    turnaroundHours: 3,
    dryerType: 'Electric',
    hasGenerator: false,
    address: '22 Coconut St.',
    gateCode: '4421',
    whatsapp: '5016001234',
    photos: ['Clean laundry room', 'Samsung dryer', 'Covered porch drop-off'],
    rules: ['Drop off in labeled bag', 'No high heat unless noted', 'Pick up within 24 hrs'],
  },
  {
    id: 'lopez',
    name: 'Mr. Lopez',
    location: 'UB Area',
    rating: 5.0,
    price: 0,
    slotsLeft: 2,
    turnaroundHours: 4,
    dryerType: 'Electric',
    hasGenerator: true,
    foldingExtra: 5,
    address: '14 University Drive',
    gateCode: '8890',
    whatsapp: '5016005678',
    photos: ['Generator backup', 'Folding table available', 'Easy parking'],
    rules: ['Ring bell on arrival', 'Folding service +$5 optional', 'Cash for extras only'],
  },
]

export const INITIAL_REQUEST: HostRequest = {
  id: 'req-1',
  customerName: 'Ana',
  location: 'UB',
  loads: 1,
  dropOffTime: 'before-10',
  sheetsOption: 'own',
  status: 'pending',
}
