import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("mounts the template workspace", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Start building" })).toBeDefined();
  });
});
