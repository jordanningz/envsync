import { execSync } from "child_process";
import {
  gitNotesAdd,
  gitNotesShow,
  gitNotesList,
  getCurrentCommitHash,
} from "./git";

jest.mock("child_process");

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe("git notes helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("gitNotesAdd", () => {
    it("calls git notes add with correct args", () => {
      mockedExecSync.mockReturnValue(Buffer.from(""));
      gitNotesAdd("envsync", "encrypted-payload");
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git notes --ref=envsync add -f -m "encrypted-payload"',
        { stdio: "pipe" }
      );
    });
  });

  describe("gitNotesShow", () => {
    it("returns trimmed note content for HEAD", () => {
      mockedExecSync.mockReturnValue(Buffer.from("  some-payload\n"));
      const result = gitNotesShow("envsync");
      expect(result).toBe("some-payload");
    });

    it("uses provided commit hash", () => {
      mockedExecSync.mockReturnValue(Buffer.from("payload"));
      gitNotesShow("envsync", "abc123");
      expect(mockedExecSync).toHaveBeenCalledWith(
        "git notes --ref=envsync show abc123",
        { stdio: "pipe" }
      );
    });
  });

  describe("gitNotesList", () => {
    it("returns list of commit hashes", () => {
      mockedExecSync.mockReturnValue(
        Buffer.from("noteHash1 commitHash1\nnoteHash2 commitHash2\n")
      );
      const result = gitNotesList("envsync");
      expect(result).toEqual(["commitHash1", "commitHash2"]);
    });

    it("returns empty array when no notes exist", () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error("no notes");
      });
      const result = gitNotesList("envsync");
      expect(result).toEqual([]);
    });
  });

  describe("getCurrentCommitHash", () => {
    it("returns trimmed commit hash", () => {
      mockedExecSync.mockReturnValue(Buffer.from("deadbeef\n"));
      const result = getCurrentCommitHash();
      expect(result).toBe("deadbeef");
    });
  });
});
