export type JsonBodyResult =
  | {
      status: "OK";
      value: unknown;
    }
  | {
      status: "INVALID_JSON";
    }
  | {
      status: "TOO_LARGE";
    };

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<JsonBodyResult> {
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const parsedLength = Number(contentLength);

    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return {
        status: "TOO_LARGE",
      };
    }
  }

  if (!request.body) {
    return {
      status: "INVALID_JSON",
    };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();

  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();

        return {
          status: "TOO_LARGE",
        };
      }

      text += decoder.decode(value, {
        stream: true,
      });
    }

    text += decoder.decode();
  } catch {
    return {
      status: "INVALID_JSON",
    };
  }

  try {
    return {
      status: "OK",
      value: JSON.parse(text) as unknown,
    };
  } catch {
    return {
      status: "INVALID_JSON",
    };
  }
}
