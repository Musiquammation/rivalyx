import { DataReader } from "./net/DataReader";
import { DataWriter } from "./net/DataWriter";


export interface GameInterface<Snapshot> {
	playerCount: number;

	createSnapshot(isServer: boolean): Snapshot;
	extractInput(reader: DataReader): ArrayBuffer;
	handleInput(snapshot: Snapshot, data: DataReader, user: number): void;
	frame(snapshot: Snapshot, speed: number): void;
	getLeaderboard(snapshot: Snapshot): number[] | null;
	killPlayer(snapshot: Snapshot, user: number): void;

	readNetworkDesc(snapshot: Snapshot, data: DataReader): void;
	writeNetworkDesc(snapshot: Snapshot, writer: DataWriter): void;
}