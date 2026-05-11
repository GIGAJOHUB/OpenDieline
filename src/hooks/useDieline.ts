import { useMemo, useState } from "react";
import { DEFAULT_RTE_PARAMS } from "../constants/packaging";
import { validateReverseTuckEnd } from "../geometry/constraints/rteValidation";
import { generateReverseTuckEndDieline } from "../templates/reverseTuckEnd";
import type { ReverseTuckEndParams } from "../types/carton";

export const useDieline = () => {
  const [params, setParams] = useState<ReverseTuckEndParams>(DEFAULT_RTE_PARAMS);

  const dieline = useMemo(() => generateReverseTuckEndDieline(params), [params]);
  const issues = useMemo(() => validateReverseTuckEnd(params), [params]);

  const updateParam = (key: keyof ReverseTuckEndParams, value: number) => {
    setParams((current) => ({
      ...current,
      [key]: Number.isFinite(value) ? value : current[key],
    }));
  };

  return { params, setParams, updateParam, dieline, issues };
};
