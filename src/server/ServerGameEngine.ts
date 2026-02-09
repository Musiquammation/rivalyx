import { DataReader } from "../net/DataReader";
import { DataWriter } from "../net/DataWriter";

type PlayerRanking = number[];

export abstract class ServerGameEngine {
	abstract start(): void;
	abstract frame(): PlayerRanking | null;
	abstract servNetwork(reader: DataReader, index: number): DataWriter;
}