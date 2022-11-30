
export const useBaseIdAndTimeStamp = () => {
  const ts = Date.now();
  const tsId = ts.toString(36);
  return {tsId, ts};
}
