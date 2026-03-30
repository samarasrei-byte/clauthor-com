/**
 * ThorGreeter.tsx — Thin wrapper composing ThorCore (logic) + ThorUI (rendering)
 * All behavior, visual, and functionality preserved identically.
 */

import { useThorCore } from "./thor/ThorCore";
import { ThorRenderer } from "./thor/ThorUI";

const ThorGreeter = () => {
  const core = useThorCore();
  return <ThorRenderer {...core} />;
};

export default ThorGreeter;
