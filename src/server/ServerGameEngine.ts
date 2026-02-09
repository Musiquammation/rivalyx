import { DataReader } from "../net/DataReader";
import { DataWriter } from "../net/DataWriter";
import { GameInterface } from "../GameInterface";
import { CLIENT_IDS } from "../net/CLIENT_IDS";
import { getTimestamp } from "../getTimestamp";

type PlayerRanking = number[];

interface Timeline {
	date: number;
}

interface Input {
	date: number;
	user: number;
	leftFlag: number;
	content: ArrayBuffer | null;
}


const MAX_FRAME_DURATION = 10;


export class ServerGameEngine {
	private timelines: Timeline[];
	private inputs: Input[] = [];
	private sharedSnapshot: any;
	private pureLeftFlag: number;


	object: GameInterface<any>;

	constructor(object: GameInterface<any>) {
		this.object = object;
		this.sharedSnapshot = object.createSnapshot();

		const count = object.playerCount;
		const timelines: Timeline[] = [];
		for (let i = 0; i < count; i++) {
			timelines.push({
				date: getTimestamp()
			});
		}

		this.pureLeftFlag = (1<<count) - 1;
		this.timelines = timelines;
	}



	private getFirstInput(date: number): number {
		let l = 0;
		let r = this.inputs.length;

		while (l < r) {
			const mid = (l + r) >>> 1;
			if (this.inputs[mid].date < date)
				l = mid + 1;
			else
				r = mid;
		}
		return l;
	}

	private appendInputs(reader: DataReader, user: number, clientDate: number) {
		const newInputs = [];
		let lastDate = -Infinity;

		// # Read inputs #
		while (true) {
			const date = reader.readUint32();
			console.log(date);
			if (date === 0)
				break;

			// Check order
			if (date < lastDate) {
				throw new Error("Inputs must be given from the recestest to the lastest");
			} else {
				lastDate = date;
			}

			newInputs.push({
				date,
				user,
				leftFlag: this.pureLeftFlag,
				content: this.object.extractInput(reader)
			});
		}

		newInputs.push({
			date: clientDate,
			user,
			leftFlag: this.pureLeftFlag,
			content: null
		});

		
		// # Append them #
		const inputs = this.inputs;


		// Binary search
		const start = this.getFirstInput(newInputs[0].date);

		const merged: Input[] = [];
		let i = start;
		let j = 0;

		// Merge
		while (i < inputs.length && j < newInputs.length) {
			if (inputs[i].date <= newInputs[j].date) {
				merged.push(inputs[i++]);
			} else {
				merged.push(newInputs[j++]);
			}
		}

		while (i < inputs.length)
			merged.push(inputs[i++]);

		while (j < newInputs.length)
			merged.push(newInputs[j++]);

		// Append
		inputs.splice(start, inputs.length - start, ...merged);
	}

	private simulateUntil(snapshot: any, date: number, removeFlag: number) {
		console.log("simulation {");

		// Move until client date
		const inputs = this.inputs;

		const inputLengthLimit = inputs.length - 1;
		let i = 0;
		for (; i < inputLengthLimit; i++) {
			const current = inputs[i];
			const next = inputs[i+1];

			if (current.content) {
				this.object.handleInput(snapshot, new DataReader(current.content), current.user);
			}
			
			console.log("\t" + current.date + (current.content ? "" : " (empty)"));
			if (next.date >= date) {
				break;
			}
			
			current.leftFlag &= removeFlag;
			this.runFrame(snapshot, next.date - current.date);
		}

		// Make last frame
		const last = this.inputs[i];
		if (last.content) {
			console.log("\t" + last.date);
			this.object.handleInput(snapshot, new DataReader(last.content), last.user);
		}
		console.log("final ", date - last.date);
		this.runFrame(snapshot, date - last.date);

		console.log("}");
	}

	handleMessage(reader: DataReader, user: number) {
		console.log("AS USER:", user);
		const clientDate = reader.readUint32();

		// Collect inputs
		this.appendInputs(reader, user, clientDate);

		// Get indice
		const inputs = this.inputs;
		let idx = 0;
		while (idx < inputs.length && inputs[idx].leftFlag === 0) {idx++;}
		
		const removeFlag = ~(1<<user);
		
		// Get date
		const timeline = this.timelines[user];
		const snapshot = this.object.copySnapshot(this.sharedSnapshot);
		this.simulateUntil(snapshot, clientDate, removeFlag);
		
		// Delete old inputs and move shared snapshot
		console.log("idx", idx);
		this.simulateUntil(this.sharedSnapshot, inputs[idx].date, removeFlag);
		
		if (idx > 0) {
			inputs.splice(0, idx);
		}
		
		// Send data
		const writer = new DataWriter();
		writer.writeInt8(CLIENT_IDS.GAME_DATA);
		writer.writeUint32(getTimestamp());
		this.object.writeNetworkDesc(snapshot, writer);
		
		writer.writeInt8(CLIENT_IDS.FINISH);
		return writer;
	}

	private runFrame(snapshot: any, duration: number) {
		while (duration >= MAX_FRAME_DURATION) {
			this.object.frame(snapshot, MAX_FRAME_DURATION);
			duration -= MAX_FRAME_DURATION;
		}

		this.object.frame(snapshot, duration);
	}
}
