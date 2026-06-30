import "server-only";

import { NextResponse } from "next/server";

type JsonPayload = Record<string, unknown> | unknown[];

function withNoStore(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers);
  nextHeaders.set("Cache-Control", "no-store");
  return nextHeaders;
}

export function noStoreJson(payload: JsonPayload, init: ResponseInit = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: withNoStore(init.headers),
  });
}

export function jsonError(error: string, status: number) {
  return noStoreJson({ error }, { status });
}
