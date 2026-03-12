export type AxonState = {
  status: "idle" | "running";
};

export const initialAxonState: AxonState = {
  status: "idle",
};
