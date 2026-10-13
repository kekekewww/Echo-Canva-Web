import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkspaceProjectTools } from "@/components/workspace/WorkspaceProjectTools";
import { createDefaultClassicProject, createDefaultHybridProject } from "@/domain/workspace/defaults";
import * as projections from "@/domain/workspace/projections";

describe("WorkspaceProjectTools idle rendering", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["Classic", createDefaultClassicProject],
    ["Hybrid", createDefaultHybridProject],
  ] as const)("renders %s AI controls without calculating unused acoustic projections", (_mode, createProject) => {
    const project = createProject();
    const classicProjection = vi.spyOn(projections, "projectClassicScene");
    const hybridProjection = vi.spyOn(projections, "projectHybridDocument");

    const markup = renderToStaticMarkup(createElement(WorkspaceProjectTools, {
      project,
      dispatch: () => undefined,
    }));

    expect(markup).toContain("Generate scene");
    expect(markup).toContain("Explain selected acoustics");
    expect(classicProjection).not.toHaveBeenCalled();
    expect(hybridProjection).not.toHaveBeenCalled();
  });
});
