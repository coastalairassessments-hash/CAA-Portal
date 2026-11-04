// Switches for work that is built but not shown to clients yet. Off unless the setting is exactly "on".
export const clientTimelineOn = () => process.env.CLIENT_TIMELINE === "on";
