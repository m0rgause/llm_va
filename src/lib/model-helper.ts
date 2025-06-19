export function getSelectedModel(): string {
  if (typeof window !== "undefined") {
    const storedModel = localStorage.getItem("selectedModel");
    return storedModel || "syaki-ai";
  } else {
    // Default model
    return "syaki-ai";
  }
}
