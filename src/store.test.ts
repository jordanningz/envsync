import { saveEnv, loadEnv, formatEnvFile, parseEnvFile } from "./store";
import * as crypto from "./crypto";
import * as git from "./git";

jest.mock("./crypto");
jest.mock("./git");

const mockedEncrypt = crypto.encrypt as jest.MockedFunction<typeof crypto.encrypt>;
const mockedDecrypt = crypto.decrypt as jest.MockedFunction<typeof crypto.decrypt>;
const mockedNotesAdd = git.gitNotesAdd as jest.MockedFunction<typeof git.gitNotesAdd>;
const mockedNotesShow = git.gitNotesShow as jest.MockedFunction<typeof git.gitNotesShow>;
const mockedNotesPush = git.gitNotesPush as jest.MockedFunction<typeof git.gitNotesPush>;
const mockedNotesFetch = git.gitNotesFetch as jest.MockedFunction<typeof git.gitNotesFetch>;

describe("store", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("saveEnv", () => {
    it("encrypts vars and stores as git note", async () => {
      mockedEncrypt.mockResolvedValue("ciphertext");
      await saveEnv({ API_KEY: "secret" }, "pass");
      expect(mockedEncrypt).toHaveBeenCalled();
      expect(mockedNotesAdd).toHaveBeenCalledWith("envsync", "ciphertext");
      expect(mockedNotesPush).not.toHaveBeenCalled();
    });

    it("pushes to remote when provided", async () => {
      mockedEncrypt.mockResolvedValue("ciphertext");
      await saveEnv({ KEY: "val" }, "pass", "origin");
      expect(mockedNotesPush).toHaveBeenCalledWith("origin", "envsync");
    });
  });

  describe("loadEnv", () => {
    it("fetches, decrypts and parses env store", async () => {
      const store = { version: 1, updatedAt: "2024-01-01", vars: { DB: "url" } };
      mockedNotesShow.mockReturnValue("ciphertext");
      mockedDecrypt.mockResolvedValue(JSON.stringify(store));
      const result = await loadEnv("pass", "origin");
      expect(mockedNotesFetch).toHaveBeenCalledWith("origin", "envsync");
      expect(result.vars).toEqual({ DB: "url" });
    });
  });

  describe("formatEnvFile", () => {
    it("formats key=value pairs", () => {
      const out = formatEnvFile({ FOO: "bar", BAZ: "qux" });
      expect(out).toBe('FOO="bar"\nBAZ="qux"');
    });
  });

  describe("parseEnvFile", () => {
    it("parses quoted and unquoted values", () => {
      const content = 'FOO="bar"\nBAZ=plain\n# comment\n\nEMPTY=';
      const result = parseEnvFile(content);
      expect(result).toEqual({ FOO: "bar", BAZ: "plain", EMPTY: "" });
    });
  });
});
