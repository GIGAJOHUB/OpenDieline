import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_RTE_PARAMS } from "../constants/packaging";
import { validateReverseTuckEnd } from "../geometry/constraints/rteValidation";
import { validateFoldTopology } from "../geometry/folds/foldValidation";
import { generateReverseTuckEnd } from "../templates/reverseTuckEnd";
import type { ReverseTuckEndParams } from "../types/carton";

export const useDieline = () => {
  const [params, setParams] = useState<ReverseTuckEndParams>(DEFAULT_RTE_PARAMS);
  const [past, setPast] = useState<ReverseTuckEndParams[]>([]);
  const [future, setFuture] = useState<ReverseTuckEndParams[]>([]);

  const generated = useMemo(() => generateReverseTuckEnd(params), [params]);
  const dieline = generated.dieline;
  const topology = generated.topology;
  const issues = useMemo(
    () => [...validateReverseTuckEnd(params), ...validateFoldTopology(topology)],
    [params, topology],
  );

  const commitParams = useCallback((next: ReverseTuckEndParams) => {
    setParams((current) => ({
      ...next,
    }));
    setPast((current) => [...current.slice(-80), params]);
    setFuture([]);
  }, [params]);

  const updateParam = (key: keyof ReverseTuckEndParams, value: number | ReverseTuckEndParams[keyof ReverseTuckEndParams]) => {
    const next = {
      ...params,
      [key]: typeof value === "number" ? (Number.isFinite(value) ? value : params[key]) : value,
    } as ReverseTuckEndParams;
    if (key === "panelAWidth" && typeof value === "number") {
      next.tuckFlapDepth = value;
    }
    if (key === "tuckFlapDepth" && typeof value === "number") {
      next.panelAWidth = value;
    }
    commitParams(next);
  };

  const replaceParams = useCallback((next: ReverseTuckEndParams) => {
    commitParams(next);
  }, [commitParams]);

  const undo = useCallback(() => {
    setPast((currentPast) => {
      if (currentPast.length === 0) return currentPast;
      const previous = currentPast[currentPast.length - 1];
      setFuture((currentFuture) => [params, ...currentFuture]);
      setParams(previous);
      return currentPast.slice(0, -1);
    });
  }, [params]);

  const redo = useCallback(() => {
    setFuture((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;
      const [next, ...rest] = currentFuture;
      setPast((currentPast) => [...currentPast, params]);
      setParams(next);
      return rest;
    });
  }, [params]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  return { params, setParams: replaceParams, updateParam, dieline, topology, issues, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
};
