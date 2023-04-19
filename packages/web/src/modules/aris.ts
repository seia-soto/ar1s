import {Aris} from '@ar1s/client';

const fetcher = Aris.createFetcher('/api');

export const aris = new Aris(fetcher);
