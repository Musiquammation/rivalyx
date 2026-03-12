import { cowboy_client } from "../games/gcowboy/cowboy_client";
import { packice_client } from "../games/gpackice/packice_client";
import { test_client } from "../games/gtest/test_client";
import { ClientInterface } from "./ClientInterface";

export const CLIENT_DESCRIPTIONS: ClientInterface<any, any>[] = [
	packice_client,
	cowboy_client,
	test_client
];