import { proxy } from "valtio";
import { chapters } from "../content/chapters";

export const storyState = proxy({
  chapterIndex: 0,
  autopilot: true,
});

export const setChapter = (index: number) => {
  storyState.chapterIndex = Math.max(0, Math.min(chapters.length - 1, index));
};

export const nudgeChapter = (direction: 1 | -1) => {
  const next = storyState.chapterIndex + direction;
  if (next < 0) {
    storyState.chapterIndex = chapters.length - 1;
    return;
  }
  if (next >= chapters.length) {
    storyState.chapterIndex = 0;
    return;
  }
  storyState.chapterIndex = next;
};

export const toggleAutopilot = () => {
  storyState.autopilot = !storyState.autopilot;
};

export const chapterCount = () => chapters.length;
