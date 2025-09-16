export interface DecodeItem {
  destination: string;
  month: string;
  bg: string;
  profileImg: string;
  title: string;
  author: string;
  query: string;
}

export const initialDecodeData: DecodeItem[] = [
  {
    destination: 'Río Negro',
    month: 'Enero',
    bg: 'https://images.pexels.com/photos/10398717/pexels-photo-10398717.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    profileImg:
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    title: 'Río Negro Edition',
    author: 'Ana García',
    query: 'patagonia argentina landscape',
  },
  {
    destination: 'Kyoto',
    month: 'Abril',
    bg: 'https://images.pexels.com/photos/16142728/pexels-photo-16142728/free-photo-of-persona-sentada-en-banco-de-piedra-con-paraguas-en-kioto-japon.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    profileImg:
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    title: 'Esencia de Kyoto',
    author: 'Julián Soto',
    query: 'kyoto japan cherry blossoms temple',
  },
];
