export interface GatewayErrorBody {
  error: { code: string; message: string };
}

export class GatewayError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
    this.code = code;
  }
}

export function isGatewayErrorBody(body: unknown): body is GatewayErrorBody {
  return typeof body === "object" && body !== null && "error" in body;
}
