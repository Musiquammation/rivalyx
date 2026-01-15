export {};

declare global {
	interface Window {
		SOCKET_ADDRESS: string;
	}
}

window.SOCKET_ADDRESS = "";

