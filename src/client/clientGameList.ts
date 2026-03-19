import { gstars_client } from "../games/gstars/gstars_client";
import { packice_client } from "../games/gpackice/packice_client";
import { test_client } from "../games/gtest/test_client";
import { ClientInterface } from "./ClientInterface";

export const CLIENT_DESCRIPTIONS: ClientInterface<any, any>[] = [
	packice_client,
	gstars_client,
	test_client
];