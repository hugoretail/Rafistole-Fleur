import { proxy } from "valtio";
import { chapters } from "../content/chapters";

type ManualOptions = {
  manual?: boolean;
};

type StoryState = {
  chapterIndex: number;
  autopilot: boolean;
  interactionVersion: number;
};

export const storyState = proxy<StoryState>({
  chapterIndex: 0,
  autopilot: true,
  interactionVersion: 0,
});

const clampChapterIndex = (index: number) => Math.max(0, Math.min(chapters.length - 1, index));

const bumpInteractionVersion = () => {
  storyState.interactionVersion += 1;
};

const enforceManual = (options?: ManualOptions) => {
  if (options?.manual && storyState.autopilot) {
    storyState.autopilot = false;
    bumpInteractionVersion();
  }
};

export const setChapter = (index: number, options?: ManualOptions) => {
  storyState.chapterIndex = clampChapterIndex(index);
  enforceManual(options);
};

export const nudgeChapter = (direction: 1 | -1, options?: ManualOptions) => {
  const next = storyState.chapterIndex + direction;
  if (next < 0) {
    storyState.chapterIndex = chapters.length - 1;
    enforceManual(options);
    return;
  }
  if (next >= chapters.length) {
    storyState.chapterIndex = 0;
    enforceManual(options);
    return;
  }
  storyState.chapterIndex = next;
  enforceManual(options);
};

export const toggleAutopilot = () => {
  storyState.autopilot = !storyState.autopilot;
  bumpInteractionVersion();
};

export const chapterCount = () => chapters.length;
