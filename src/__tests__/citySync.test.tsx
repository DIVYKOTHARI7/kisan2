import React from "react";
import { render, waitFor } from "@testing-library/react";
import { vi } from "vitest";

// Mock useAuth to control profile
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    profile: { village: "TestVille", primary_crops: ["Wheat"], land_acres: 5 },
    user: { id: "1" },
    updateProfile: vi.fn(),
  }),
}));

import { Route as DashboardRoute } from "@/routes/index";
import ReactDOM from "react-dom";

// Dashboard Route exports `Route` using createFileRoute; its component is `Dashboard`.
// For this test we import the module and render its default export component.

describe("city sync", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("syncs profile.village into localStorage on mount", async () => {
    const { container } = render((<DashboardRoute.component />) as any);

    await waitFor(() => {
      expect(localStorage.getItem("krishisathi_city")).toBe("TestVille");
    });
  });
});
