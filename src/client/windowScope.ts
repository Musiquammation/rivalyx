export {};

declare global {
	interface Window {
		SOCKET_ADDRESS: string;
		FORCED_LATENCY: number;
		ASSET_PATH: string;
	}
}


