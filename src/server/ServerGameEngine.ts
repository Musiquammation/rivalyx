import { DataReader } from "../net/DataReader";
import { DataWriter } from "../net/DataWriter";
import { GameInterface } from "../GameInterface";
import { CLIENT_IDS } from "../net/CLIENT_IDS";
import { getTimestamp } from "../getTimestamp";


const DEBUG = false;
function printDebug(...data: any[]) {
	if (!DEBUG)
		return;

	console.log(...data);
}

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
	private readonly pureLeftFlag: number;


	object: GameInterface<any>;

	constructor(object: GameInterface<any>) {
		this.object = object;
		this.sharedSnapshot = object.createSnapshot(true);

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

		// Final flag
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

	private simulate(snapshot: any,) {
		const inputs = this.inputs;

		if (!inputs)
			return -1;

		const inputLengthLimit = inputs.length - 1;
		let i = 0;
		for (; i < inputLengthLimit; i++) {
			const current = inputs[i];
			const next = inputs[i+1];
			
			if (next.leftFlag) {
				break;
			}

			if (current.content) {
				this.object.handleInput(snapshot, new DataReader(current.content), current.user);
			}

			this.runFrame(snapshot, next.date - current.date);
		}

		return i;
	}

	private consumeEvents(removeFlag: number) {
		for (const input of this.inputs)
			input.leftFlag &= removeFlag;

	}

	private writeInputs(writer: DataWriter) {
		const length = this.inputs.reduce((acc, i) => acc + (i.content?1:0), 0);

		writer.writeUint32(length);

		for (let input of this.inputs) {
			if (input.content) {
				writer.writeUint32(input.date);
				writer.writeUint16(input.content.byteLength);
				writer.writeUint16(input.user);
				writer.addArrayBuffer(input.content);
			}
		}
	}


	handleMessage(reader: DataReader, user: number) {
		const clientDate = reader.readUint32();

		// Collect inputs
		this.appendInputs(reader, user, clientDate);
		
		
		// Get indice
		const inputs = this.inputs;
		this.consumeEvents(~(1<<user));
		const idx = this.simulate(this.sharedSnapshot);

		// Delete old inputs and move shared snapshot
		if (idx > 0) {
			printDebug("date: " + (Math.floor(inputs[idx].date/1000)%300).toString().padStart(3, '0'));
			inputs.splice(0, idx);
		}

		printDebug("u" + user + " {");
		inputs.forEach(x => printDebug("\t", (Math.floor(x.date/1000)%300).toString().padStart(3, '0'), "u"+x.user, x.leftFlag, x.content ? new Uint8Array(x.content).join("-") : null));
		printDebug("}");

		
		// Send data
		const writer = new DataWriter();
		writer.writeInt8(CLIENT_IDS.GAME_DATA);
		writer.writeUint32(getTimestamp());
		this.object.writeNetworkDesc(this.sharedSnapshot, writer);

		printDebug("send", (Math.floor(inputs[0].date/1000)%300).toString().padStart(3, '0'));
		writer.writeUint32(this.inputs[0].date);
		this.writeInputs(writer);
		
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
