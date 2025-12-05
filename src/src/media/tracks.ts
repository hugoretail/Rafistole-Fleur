import cardigan from "./Cardigan (VIP).mp3";
import realMan from "./Real Man (Real Man).mp3";
import rightNow from "./Right Now.mp3";
import odoriko from "./踊り子.mp3";

export type AudioTrack = {
  id: string;
  title: string;
  artist: string;
  mood: string;
  url: string;
};

export const audioTracks: AudioTrack[] = [
  {
    id: "cardigan",
    title: "Cardigan (VIP)",
    artist: "Window Kid",
    mood: "Future funk cardio",
    url: cardigan,
  },
  {
    id: "realman",
    title: "Real Man",
    artist: "Bibi",
    mood: "Electro pop confident",
    url: realMan,
  },
  {
    id: "rightnow",
    title: "Right Now",
    artist: "NDI Jeans",
    mood: "House glitter",
    url: rightNow,
  },
  {
    id: "odoriko",
    title: "踊り子 (Odoriko)",
    artist: "Vaundy",
    mood: "City pop neon",
    url: odoriko,
  },
];

export const defaultAudioTrackId = audioTracks[0]?.id ?? "";

export const getAudioTrackById = (id: string) => audioTracks.find((track) => track.id === id);
