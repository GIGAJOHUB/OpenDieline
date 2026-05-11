import { useMemo, useState } from "react";
import { DEFAULT_RTE_PARAMS } from "../constants/packaging";
import { validateReverseTuckEnd } from "../geometry/constraints/rteValidation";
import { validateFoldTopology } from "../geometry/folds/foldValidation";
import { generateReverseTuckEnd } from "../templates/reverseTuckEnd";
import type { ReverseTuckEndParams } from "../types/carton";

export const useDieline = () => {
  const [params, setParams] = useState<ReverseTuckEndParams>(DEFAULT_RTE_PARAMS);

  const generated = useMemo(() => generateReverseTuckEnd(params), [params]);
  const dieline = generated.dieline;
  const topology = generated.topology;
  const issues = useMemo(
    () => [...validateReverseTuckEnd(params), ...validateFoldTopology(topology)],
    [params, topology],
  );

  const updateParam = (key: keyof ReverseTuckEndParams, value: number) => {
    setParams((current) => ({
      ...current,
      [key]: Number.isFinite(value) ? value : current[key],
    }));
  };

  return { params, setParams, updateParam, dieline, topology, issues };
};
