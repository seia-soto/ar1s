import {type Fetcher} from './aatypes.js';

export const createConnectionToken = async (fetcher: Fetcher) => {
	const response = await fetcher('private/event', {method: 'post'});
	const data: {ticket: string} = await response.json();

	return data.ticket;
};
