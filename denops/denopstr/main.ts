import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as popup from "https://deno.land/x/denops_std@v6.4.0/popup/mod.ts";

import { assert, is } from "https://deno.land/x/unknownutil@v3.18.0/mod.ts";

import { Event } from "npm:nostr-tools/core";
import { SimplePool } from "npm:nostr-tools/pool";
import * as nip19 from "npm:nostr-tools/nip19";

const relays = ["wss://yabu.me", "wss://nostr.uneu.net"];

async function fetchProfiles(): Promise<Array<Event>> {
	const pool = new SimplePool();

	var events = await pool.querySync(relays, { kinds: [0] });
	return events;
}

async function fetchPosts(): Promise<Array<Event>> {
	const pool = new SimplePool();

	var events = await pool.querySync(relays, { kinds: [1] });
	return events;
}

export async function main(denops: Denops): Promise<void> {
	denops.dispatcher = {
		async timeline() {
			const pool = new SimplePool();

			var profiles = await fetchProfiles();

			await denops.cmd("enew");
			const bufnr = await fn.bufnr(denops);
			await fn.setbufvar(denops, bufnr, "&buftype", "nofile");

			var events = await fetchPosts();

			for (const [index, event] of events.entries()) {
				const date = new Date(event.created_at * 1000);
				if (profiles.map((p) => p.pubkey).includes(event.pubkey)) {
					var name = JSON.parse(profiles.find((p) => event.pubkey === p.pubkey).content).name;
				} else {
					var name = event.pubkey;
				}

				await fn.setbufline(denops, bufnr, 1 + index * 3, `${date.toString()} ${name}`);
				await fn.setbufline(denops, bufnr, 1 + index * 3 + 1, `${event.content}`);
				await fn.setbufline(denops, bufnr, 1 + index * 3 + 2, "");
			}

			await buffer.concrete(denops, bufnr);
		},
	};
}
