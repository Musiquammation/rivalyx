import { getTimestamp } from "../getTimestamp";
import { CLIENT_IDS } from "../net/CLIENT_IDS";
import { DataWriter } from "../net/DataWriter";

export interface TimeSyncInterface {
	toServ(date: number): number;
	toClient(date: number): number;
}

export class TimeSync implements TimeSyncInterface {
	private offset: number;

	constructor(offset: number) {
		this.offset = offset;
		console.log("Offset", offset);
	}

	toServ(date: number): number {
		return date + this.offset;
	}

	toClient(date: number): number {
		return date - this.offset;
	}
}


export class TimeSyncBuilder implements TimeSyncInterface {
	private left = 16;
	private offsets: number[] = [];
	private serverTimestamp = 0;

	markFirstStart() {
		this.serverTimestamp = getTimestamp();
	}

	append(clientTimestamp: number) {
		this.left--;

		const rtt = getTimestamp() - this.serverTimestamp;
		const offset = clientTimestamp - (this.serverTimestamp + rtt / 2);
		this.offsets.push(offset);

		this.serverTimestamp = getTimestamp();

		if (this.left > 0)
			return null;

		return new TimeSync(Math.floor(median(this.offsets)));
	}	

	toServ(date: number) {
		return date;
	}

	toClient(date: number) {
		return date;
	}
}


function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0
		? sorted[mid]
		: (sorted[mid - 1] + sorted[mid]) / 2;
}



