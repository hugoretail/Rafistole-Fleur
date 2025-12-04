import { proxy } from "valtio";
import { partnerFilters, partners, type PartnerFilterId, type PartnerProfile } from "../content/partners";

export type PartnerState = {
  activeId: string;
  focus: PartnerFilterId;
  pinned: string[];
};

export const partnerState = proxy<PartnerState>({
  activeId: partners[0]?.id ?? "",
  focus: "all",
  pinned: [],
});

const resolveList = (focus: PartnerFilterId): PartnerProfile[] => {
  if (focus === "all") {
    return partners;
  }
  return partners.filter((partner) => partner.focus === focus);
};

export const getVisiblePartners = (focus: PartnerFilterId = partnerState.focus) => resolveList(focus);

export const getPartnerById = (id: string) => partners.find((partner) => partner.id === id);

export const setPartnerFocus = (focus: PartnerFilterId) => {
  partnerState.focus = focus;
  const visible = resolveList(focus);
  if (!visible.length) {
    return;
  }
  if (!visible.some((partner) => partner.id === partnerState.activeId)) {
    partnerState.activeId = visible[0].id;
  }
};

export const setActivePartner = (id: string) => {
  if (id) {
    partnerState.activeId = id;
  }
};

export const cyclePartner = (direction: 1 | -1) => {
  const visible = resolveList(partnerState.focus);
  if (!visible.length) {
    return;
  }
  const currentIndex = visible.findIndex((partner) => partner.id === partnerState.activeId);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = (safeIndex + direction + visible.length) % visible.length;
  partnerState.activeId = visible[nextIndex].id;
};

export const togglePinnedPartner = (id: string) => {
  if (!id) return;
  if (partnerState.pinned.includes(id)) {
    partnerState.pinned = partnerState.pinned.filter((pinnedId) => pinnedId !== id);
  } else {
    partnerState.pinned = [...partnerState.pinned, id];
  }
};

export const isPinned = (id: string) => partnerState.pinned.includes(id);

export const partnerFilterOptions = partnerFilters;
