import { describe, expect, it, vi } from "vitest";

import {
  FallbackAudioStore,
  IndexedDbAudioStore,
  LocalAudioLibrary,
  type LocalAudioStore,
  MemoryAudioStore,
  validateLocalAudioFile,
} from "@/domain/audio-assets/local-library";

type Handler = (() => void) | null;

type FakeRequest = { result: unknown; error: DOMException | null; onsuccess: Handler; onerror: Handler };

type FakeTransaction = {
  error: DOMException | null;
  oncomplete: Handler;
  onerror: Handler;
  onabort: Handler;
  operation: "put" | "delete" | "getAll";
  request: FakeRequest;
};

/**
 * Minimal IDBFactory double. Database open succeeds on the next macrotask;
 * every transaction is held open until the test emits request and transaction
 * events explicitly, so event ordering is fully controlled.
 */
function fakeIndexedDb() {
  const transactions: FakeTransaction[] = [];
  const request = (): FakeRequest => ({ result: undefined, error: null, onsuccess: null, onerror: null });
  const database = {
    objectStoreNames: { contains: () => true },
    transaction: () => {
      const transaction = { error: null, oncomplete: null, onerror: null, onabort: null } as unknown as FakeTransaction;
      const objectStore = {
        put: () => { transaction.operation = "put"; transaction.request = request(); return transaction.request; },
        delete: () => { transaction.operation = "delete"; transaction.request = request(); return transaction.request; },
        getAll: () => { transaction.operation = "getAll"; transaction.request = request(); return transaction.request; },
      };
      Object.assign(transaction, { objectStore: () => objectStore });
      transactions.push(transaction);
      return transaction;
    },
  };
  const factory = {
    open: () => {
      const openRequest = { ...request(), result: database, onupgradeneeded: null };
      setTimeout(() => openRequest.onsuccess?.(), 0);
      return openRequest;
    },
  } as unknown as IDBFactory;
  return { factory, transactions };
}

function track(promise: Promise<unknown>) {
  const state: { settled: "pending" | "resolved" | "rejected" } = { settled: "pending" };
  promise.then(() => { state.settled = "resolved"; }, () => { state.settled = "rejected"; });
  return state;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function nextTransaction(transactions: FakeTransaction[], index: number) {
  await vi.waitFor(() => expect(transactions[index]?.request).toBeDefined());
  return transactions[index];
}

function abortError() {
  return new DOMException("Simulated late abort", "AbortError");
}

function audioBlob(size: number, type = "audio/wav") {
  return new Blob([new Uint8Array(size)], { type });
}

describe("local audio library", () => {
  it("accepts WAV, MP3, and Ogg within the per-file budget", () => {
    expect(validateLocalAudioFile(audioBlob(32, "audio/wav"), 0).ok).toBe(true);
    expect(validateLocalAudioFile(audioBlob(32, "audio/mpeg"), 0).ok).toBe(true);
    expect(validateLocalAudioFile(audioBlob(32, "audio/ogg"), 0).ok).toBe(true);
  });

  it("rejects unsupported MIME types, files above 25 MB, and a library above 100 MB", () => {
    expect(validateLocalAudioFile(audioBlob(32, "video/mp4"), 0).ok).toBe(false);
    expect(validateLocalAudioFile(audioBlob(25 * 1024 * 1024 + 1), 0).ok).toBe(false);
    expect(validateLocalAudioFile(audioBlob(10), 100 * 1024 * 1024).ok).toBe(false);
  });

  it("preserves existing records after a rejected add and revokes resolved URLs", async () => {
    const revoke = vi.fn();
    const library = new LocalAudioLibrary({
      createObjectURL: (blob) => `blob:${blob.size}`,
      revokeObjectURL: revoke,
    });
    const added = await library.add("Tone.wav", audioBlob(8));
    await expect(library.add("Movie.mp4", audioBlob(8, "video/mp4"))).rejects.toThrow();
    expect(await library.list()).toHaveLength(1);

    const url = await library.resolveObjectUrl(added.id);
    expect(url).toBe("blob:8");
    await library.remove(added.id);
    expect(revoke).toHaveBeenCalledWith("blob:8");
  });

  it("does not persist an asset when browser decoding fails", async () => {
    const library = new LocalAudioLibrary({
      decode: async () => { throw new Error("decode failed"); },
      makeId: () => "local_invalid",
    });

    await expect(library.add("broken.wav", audioBlob(8))).rejects.toThrow("could not be decoded");
    expect(await library.list()).toEqual([]);
  });

  it("rejects decoded stereo before creating a local record", async () => {
    const library = new LocalAudioLibrary({
      decode: async () => ({ numberOfChannels: 2 }),
      makeId: () => "local_stereo",
    });

    await expect(library.add("stereo.wav", audioBlob(8))).rejects.toThrow(/mono/i);
    expect(await library.list()).toEqual([]);
  });

  it("relinks a missing asset under the same stable ID and revokes its old URL", async () => {
    const revoke = vi.fn();
    const library = new LocalAudioLibrary({
      createObjectURL: (blob) => `blob:${blob.size}`,
      revokeObjectURL: revoke,
      makeId: () => "local_voice",
    });
    const record = await library.add("old.wav", audioBlob(8));
    expect(await library.resolveObjectUrl(record.id)).toBe("blob:8");

    const replacement = await library.relink(record.id, "new.wav", audioBlob(12));

    expect(replacement.id).toBe("local_voice");
    expect(replacement.name).toBe("new.wav");
    expect(revoke).toHaveBeenCalledWith("blob:8");
    expect(await library.resolveArrayBuffer(record.id)).toHaveProperty("byteLength", 12);
  });

  it("falls back to memory after an IndexedDB-style operation failure", async () => {
    const primary: LocalAudioStore = {
      list: async () => { throw new Error("blocked"); },
      put: async () => { throw new Error("blocked"); },
      delete: async () => { throw new Error("blocked"); },
    };
    const warning = vi.fn();
    const store = new FallbackAudioStore(primary, undefined, warning);
    const library = new LocalAudioLibrary({ store, makeId: () => "local_memory" });

    await library.add("memory.wav", audioBlob(8));

    expect((await library.list()).map(({ id }) => id)).toEqual(["local_memory"]);
    expect(warning).toHaveBeenCalledOnce();
    expect(store.persistent).toBe(false);
  });

  describe.each(["put", "delete"] as const)("IndexedDB %s transaction commit", (operation) => {
    const record = { id: "local_tx", name: "tx.wav", mimeType: "audio/wav", size: 8, blob: audioBlob(8), createdAt: 1 };
    const run = (store: IndexedDbAudioStore | FallbackAudioStore) =>
      operation === "put" ? store.put(record) : store.delete(record.id);

    it("rejects when the transaction aborts after request success", async () => {
      const { factory, transactions } = fakeIndexedDb();
      const store = new IndexedDbAudioStore(factory);
      const pending = run(store);
      const state = track(pending);
      const transaction = await nextTransaction(transactions, 0);
      expect(transaction.operation).toBe(operation);

      transaction.request.onsuccess?.();
      await flush();
      expect(state.settled).toBe("pending");

      transaction.error = abortError();
      transaction.onabort?.();
      await expect(pending).rejects.toThrow("Simulated late abort");
    });

    it("resolves only after the transaction completes", async () => {
      const { factory, transactions } = fakeIndexedDb();
      const store = new IndexedDbAudioStore(factory);
      const pending = run(store);
      const state = track(pending);
      const transaction = await nextTransaction(transactions, 0);

      transaction.request.onsuccess?.();
      await flush();
      expect(state.settled).toBe("pending");

      transaction.oncomplete?.();
      await expect(pending).resolves.toBeUndefined();
    });

    it("rejects on request error", async () => {
      const { factory, transactions } = fakeIndexedDb();
      const pending = run(new IndexedDbAudioStore(factory));
      const transaction = await nextTransaction(transactions, 0);
      transaction.request.error = new DOMException("Simulated constraint failure", "ConstraintError");
      transaction.request.onerror?.();
      await expect(pending).rejects.toThrow("Simulated constraint failure");
    });

    it("switches the fallback store to memory-only after a late abort", async () => {
      const { factory, transactions } = fakeIndexedDb();
      const warning = vi.fn();
      const memory = new MemoryAudioStore();
      if (operation === "delete") await memory.put(record);
      const store = new FallbackAudioStore(new IndexedDbAudioStore(factory), memory, warning);
      const pending = run(store);
      const transaction = await nextTransaction(transactions, 0);

      transaction.request.onsuccess?.();
      await flush();
      expect(store.persistent).toBe(true);

      transaction.error = abortError();
      transaction.onabort?.();
      await expect(pending).resolves.toBeUndefined();
      expect(store.persistent).toBe(false);
      expect(warning).toHaveBeenCalledOnce();
      expect((await memory.list()).map(({ id }) => id)).toEqual(operation === "put" ? ["local_tx"] : []);
    });

    it("keeps the fallback store persistent after a normal commit", async () => {
      const { factory, transactions } = fakeIndexedDb();
      const warning = vi.fn();
      const store = new FallbackAudioStore(new IndexedDbAudioStore(factory), undefined, warning);
      const pending = run(store);
      const state = track(pending);
      const transaction = await nextTransaction(transactions, 0);

      transaction.request.onsuccess?.();
      await flush();
      expect(state.settled).toBe("pending");

      transaction.oncomplete?.();
      await expect(pending).resolves.toBeUndefined();
      expect(store.persistent).toBe(true);
      expect(warning).not.toHaveBeenCalled();
    });
  });
});
