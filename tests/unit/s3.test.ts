// tests/unit/s3.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://signed.example/put"),
}));

const originalEnv = process.env;

async function loadS3(env: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = { ...originalEnv, ...env };
  const { S3Client } = await import("@aws-sdk/client-s3");
  const mod = await import("@/lib/s3");
  const config = vi.mocked(S3Client).mock.calls.at(-1)?.[0] as Record<string, unknown>;
  return { mod, config };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  process.env = originalEnv;
});

describe("s3.ts client configuration (G16: Cloudflare R2 via S3_ENDPOINT)", () => {
  it("without S3_ENDPOINT keeps the AWS defaults (us-east-1, no endpoint, virtual-host style)", async () => {
    const { config } = await loadS3({ S3_ENDPOINT: undefined, AWS_REGION: undefined });
    expect(config.region).toBe("us-east-1");
    expect(config.endpoint).toBeUndefined();
    expect(config.forcePathStyle).toBe(false);
  });

  it("with S3_ENDPOINT uses region 'auto', the endpoint, and path-style addressing", async () => {
    const { config } = await loadS3({
      S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
      AWS_REGION: undefined,
    });
    expect(config.region).toBe("auto");
    expect(config.endpoint).toBe("https://abc123.r2.cloudflarestorage.com");
    expect(config.forcePathStyle).toBe(true);
  });

  it("an explicit AWS_REGION still wins over 'auto'", async () => {
    const { config } = await loadS3({
      S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
      AWS_REGION: "eu-central-1",
    });
    expect(config.region).toBe("eu-central-1");
  });

  it("builds the public URL from AWS_CLOUDFRONT_URL (the r2.dev / img.<domain> host)", async () => {
    const { mod } = await loadS3({
      S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
      AWS_S3_BUCKET: "mirox-media",
      AWS_CLOUDFRONT_URL: "https://pub-xyz.r2.dev",
    });
    const result = await mod.getPresignedUploadUrl("Фото 1.jpg", "image/jpeg");
    expect(result.uploadUrl).toBe("https://signed.example/put");
    // G16 deviation from the brief's literal regex (/^products\/\d+-_1\.jpg$/):
    // the existing (untouched-by-this-task) sanitizer replaces each invalid
    // character individually, not per invalid *run*, so "Фото " (4 Cyrillic
    // letters + a space) becomes 5 underscores, not 1. Verified against the
    // pre-Task-3 code too, so this is frozen, out-of-scope behavior, not a
    // regression. `_+` keeps the assertion's intent (key format + the
    // publicUrl/getKeyFromUrl round trip) without hardcoding that count.
    expect(result.key).toMatch(/^products\/\d+-_+1\.jpg$/);
    expect(result.publicUrl).toBe(`https://pub-xyz.r2.dev/${result.key}`);
    expect(mod.getKeyFromUrl(result.publicUrl)).toBe(result.key);
  });
});
