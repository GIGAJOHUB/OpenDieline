import { ParameterPanel } from "./components/ParameterPanel";
import { StatusBar } from "./components/StatusBar";
import { DielineCanvas } from "./renderers/svg/DielineCanvas";
import { FoldPreview } from "./renderers/three/FoldPreview";
import { useDieline } from "./hooks/useDieline";

export const App = () => {
  const { params, setParams, updateParam, dieline, topology, issues } = useDieline();

  return (
    <main className="flex h-screen flex-col bg-mist text-ink">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ParameterPanel
          params={params}
          setParams={setParams}
          updateParam={updateParam}
          dieline={dieline}
          issues={issues}
        />
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-0 flex-1">
            <DielineCanvas dieline={dieline} />
            <FoldPreview topology={topology} />
          </div>
          <StatusBar dieline={dieline} />
        </div>
      </div>
    </main>
  );
};
