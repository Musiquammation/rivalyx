export enum CLIENT_IDS {
	/**
	 * No extra data
	 */
	WELCOME,

	/**
	 * hash256: lobby hash
	 * int32: game
	 */
	LOBBY_GAME,

	/**
	 * int32: number
	 * 	>= 0: playerCount
	 *  < 0:  -(playerPosition + 1)
	 */
	LOBBY_UPDATE_PLAYER_COUNT,

	/**
	 * hash256: lobby hash
	 * int32: game
	 */
	SEEK_LOBBY,

	/**
	 * Variadic data
	 */
    GAME_DATA,
	
	/**
	 * int16: playerCount
	 * int16[] list of results
	 */
	END_GAME,

	/**
	 * No extra data
	 */
	FINISH
}