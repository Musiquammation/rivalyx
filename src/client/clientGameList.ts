import { packice_client } from "../games/gpackice/packice_client";
import { test_client } from "../games/gtest/test_client";
import { ClientInterface } from "./ClientInterface";

export const CLIENT_DESCRIPTIONS: ClientInterface<any, any>[] = [
	packice_client,
	test_client
];