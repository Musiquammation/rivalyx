export enum SERVER_IDS {
	/**
	 * No extra data
	 */
	WELCOME,

	/**
	 * int32: game id
	 */
	CREATE_LOBBY,
	
	/**
	 * hash256: lobby hash
	 */
	JOIN_LOBBY,

	/**
	 * hash256: lobby hash
	 */
	SEEK_LOBBY,
	
	/**
	 * Variadic data
	 */
	GAME_DATA,

	/**
	 * uint32: date
	 */
	SYNC,

	/**
	 * No extra data
	 */
	FINISH
}